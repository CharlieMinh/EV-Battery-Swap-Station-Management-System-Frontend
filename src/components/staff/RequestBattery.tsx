// src/components/staff/RequestBattery.tsx
import React, { useEffect, useState } from "react";
import { Calendar, Package, User, CheckCircle, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CheckRequest from "./CheckRequest";
import {
  fetchBatteryRequests,
  BatteryRequest,
} from "@/services/admin/batteryService";
import { toast } from "react-toastify";

interface GroupedRequest {
  createdAt: string;
  requests: BatteryRequest[];
  adminName: string;
  stationName: string;
  totalItems: number;
  status: number;
}

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};

// 🔔 đảm bảo 1 action = 1 thông báo
const TOAST_ID = {
  fetchOk: "rb-fetch-ok",
  fetchErr: "rb-fetch-err",
  openInfo: "rb-open-modal",
  closeInfo: "rb-close-modal",
};

const RequestBattery = () => {
  const [requests, setRequests] = useState<BatteryRequest[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRequest | null>(null);
  const [showCheckModal, setShowCheckModal] = useState(false);

  // Fetch requests từ API (giữ nguyên luồng)
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchBatteryRequests();
      setRequests(data);
      groupRequestsByCreatedAt(data);

      toast.success(
        data?.length ? `Đã tải ${data.length} yêu cầu nhập pin.` : "Không có yêu cầu nhập pin.",
        { ...toastOpts, toastId: TOAST_ID.fetchOk }
      );
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      const msg = error?.response?.data?.message || error?.message || "Không thể tải yêu cầu.";
      toast.error(msg, { ...toastOpts, toastId: TOAST_ID.fetchErr });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Gộp các requests có cùng createdAt (±3s), cùng admin & station (giữ nguyên thuật toán)
  const groupRequestsByCreatedAt = (data: BatteryRequest[]) => {
    if (!data || data.length === 0) {
      setGroupedRequests([]);
      return;
    }

    const sorted = [...data].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const grouped: { [key: string]: BatteryRequest[] } = {};

    sorted.forEach((request) => {
      const requestTime = new Date(request.createdAt).getTime();

      const existingKey = Object.keys(grouped).find((key) => {
        const group = grouped[key];
        const first = group[0];
        const timeDiff = Math.abs(requestTime - new Date(first.createdAt).getTime());
        const sameAdmin = request.requestedByAdminName === first.requestedByAdminName;
        const sameStation = request.stationName === first.stationName;
        return timeDiff <= 3000 && sameAdmin && sameStation;
      });

      if (existingKey) {
        grouped[existingKey].push(request);
      } else {
        const dateKey = new Date(request.createdAt).toISOString().split(".")[0];
        grouped[dateKey] = [request];
      }
    });

    const groupedArray: GroupedRequest[] = Object.keys(grouped).map((dateKey) => {
      const items = grouped[dateKey];
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const allSameStatus = items.every((item) => item.status === items[0].status);

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
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  const handleCheckRequest = (group: GroupedRequest) => {
    setSelectedGroup(group);
    setShowCheckModal(true);
    toast.info(group.status === 0 ? "Mở kiểm tra lô hàng." : "Mở chi tiết lô hàng.", {
      ...toastOpts,
      toastId: TOAST_ID.openInfo,
    });
  };

  const handleCloseModal = () => {
    setShowCheckModal(false);
    setSelectedGroup(null);
    toast.info("Đã đóng cửa sổ.", { ...toastOpts, toastId: TOAST_ID.closeInfo });
    fetchRequests(); // Refresh danh sách sau khi xong (giữ nguyên ý định)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-orange-600">Yêu Cầu Nhập Pin</h1>
        <p className="text-gray-600 mt-2">Quản lý các yêu cầu nhập pin từ Admin</p>
      </div>

      {groupedRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Không có yêu cầu nào</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groupedRequests.map((group, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow border border-orange-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Lô hàng #{groupedRequests.length - index}
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
                <div className="space-y-2">
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

                    {group.status === 0 ? (
                      <Button
                        onClick={() => handleCheckRequest(group)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Kiểm tra hàng
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCheckRequest(group)}
                        variant="outline"
                        className="border-orange-600 text-orange-600 hover:bg-orange-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    )}
                  </div>

                  {/* Hiển thị notes nếu đã xử lý */}
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

      {/* Modal kiểm tra/chỉnh sửa */}
      {showCheckModal && selectedGroup && (
        <CheckRequest group={selectedGroup} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default RequestBattery;
