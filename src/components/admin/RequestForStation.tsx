import React, { useState, useEffect } from "react";
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Eye,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fetchBatteryRequests,
  BatteryRequest,
} from "@/services/admin/batteryService";
import { RequestDetailModal } from "./RequestDetailModal";
import { fetchStations } from "@/services/admin/stationService";
import { Input } from "../ui/input";

interface GroupedRequest {
  createdAt: string;
  requests: BatteryRequest[];
  adminName: string;
  stationName: string;
  totalItems: number;
  status: number;
}

export const RequestForStation: React.FC = () => {
  const [requests, setRequests] = useState<BatteryRequest[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRequest | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [stations, setStations] = useState<{ id: string; name: string }[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("Tất cả");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // số nhóm request trên 1 trang

  // Fetch requests từ API
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchBatteryRequests();
      setRequests(data);
      groupRequestsByCreatedAt(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const data = await fetchStations(1, 100); // lấy tối đa 100 trạm
        setStations(data.items);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };
    loadStations();
  }, []);

  const filteredGroups =
    selectedStation === "Tất cả"
      ? groupedRequests
      : groupedRequests.filter((g) => g.stationName === selectedStation);

  // Reset page khi chọn station khác
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStation]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Gộp các requests có cùng createdAt (làm tròn đến giây)
  const groupRequestsByCreatedAt = (data: BatteryRequest[]) => {
    const grouped = data.reduce(
      (acc: { [key: string]: BatteryRequest[] }, request) => {
        const time = new Date(request.createdAt).getTime();
        const bucket = Math.floor(time / 5000) * 5000; // bội số 5 giây
        if (!acc[bucket]) acc[bucket] = [];
        acc[bucket].push(request);
        return acc;
      },
      {}
    );

    const groupedArray: GroupedRequest[] = Object.keys(grouped).map((key) => {
      const items = grouped[key];
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const allSameStatus = items.every((i) => i.status === items[0].status);

      return {
        createdAt: items[0].createdAt,
        requests: items,
        adminName: items[0].requestedByAdminName,
        stationName: items[0].stationName,
        totalItems,
        status: allSameStatus ? items[0].status : 0,
      };
    });

    groupedArray.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setGroupedRequests(groupedArray);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            Chờ xác nhận
          </span>
        );
      case 1:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Đã xác nhận
          </span>
        );
      case 2:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Đã từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const handleViewDetail = (group: GroupedRequest) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedGroup(null);
  };

  const formatNumber = (num: number) => num.toLocaleString("vi-VN");

  const stats = {
    total: groupedRequests.length,
    pending: groupedRequests.filter((g) => g.status === 0).length,
    confirmed: groupedRequests.filter((g) => g.status === 1).length,
    rejected: groupedRequests.filter((g) => g.status === 2).length,
  };

  if (loading && groupedRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-orange-600">
            Lịch Sử Gửi Pin Đến Trạm
          </h2>
          <p className="text-gray-600 mt-1">
            Theo dõi các lô hàng pin đã gửi đến các trạm
          </p>
        </div>
        <select
          value={selectedStation}
          onChange={(e) => setSelectedStation(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="Tất cả">Tất cả trạm</option>
          {stations.map((station) => (
            <option key={station.id} value={station.name}>
              {station.name}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-orange-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Tổng lô hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats.total)}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Chờ xác nhận</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatNumber(stats.pending)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Đã xác nhận</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(stats.confirmed)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Đã từ chối</p>
              <p className="text-2xl font-bold text-red-600">
                {formatNumber(stats.rejected)}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Request List */}
      {paginatedGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Chưa có lô hàng nào</p>
            <p className="text-sm mt-1">Chưa có yêu cầu gửi pin nào được tạo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedGroups.map((group, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow border border-orange-300"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Lô hàng #
                      {filteredGroups.length -
                        ((currentPage - 1) * itemsPerPage + index)}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{group.adminName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(group.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>{group.stationName}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(group.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.requests.map((req) => (
                      <div
                        key={req.id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {req.batteryModelName}
                        </p>
                        <p className="text-lg font-bold text-orange-600 mt-1">
                          x{req.quantity}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Tổng số lượng:</span>{" "}
                      <span className="text-orange-600 font-bold">
                        {group.totalItems}
                      </span>{" "}
                      pin
                    </div>

                    <Button
                      onClick={() => handleViewDetail(group)}
                      variant="outline"
                      className="border-gray-400 text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </div>

                  {group.requests[0].staffNotes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Ghi chú:</span>{" "}
                        {group.requests[0].staffNotes}
                      </p>
                      {group.requests[0].handledByStaffName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Xử lý bởi: {group.requests[0].handledByStaffName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center space-x-3 mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          Trước
        </Button>

        <div className="flex items-center space-x-1">
          <span className="text-gray-700 text-sm">Trang</span>
          <Input
            type="number"
            min={1}
            max={totalPages || 1}
            value={currentPage}
            onChange={(e) => {
              const newPage = Number(e.target.value);
              if (
                !isNaN(newPage) &&
                newPage >= 1 &&
                newPage <= (totalPages || 1)
              ) {
                setCurrentPage(newPage);
              }
            }}
            className="w-16 text-center text-sm"
          />
          <span className="text-gray-700 text-sm">/ {totalPages || 1}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= (totalPages || 1)}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          Sau
        </Button>
      </div>
      {/* Detail Modal */}
      {showDetailModal && selectedGroup && (
        <RequestDetailModal group={selectedGroup} onClose={handleCloseModal} />
      )}
    </div>
  );
};
