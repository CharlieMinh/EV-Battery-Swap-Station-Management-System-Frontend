// src/components/staff/SendRequestList.tsx
import React, { useEffect, useState } from "react";
import { Calendar, Package, User, CheckCircle, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CheckRequest from "./CheckRequest";
import { getMyStockRequests } from "@/services/staff/stockRequest";
import { toast } from "react-toastify";
import CheckSendRequest from "./CheckSendRequest";

interface StockRequest {
  id: string;
  stationId: string;
  stationName: string;
  batteryModelId: string;
  batteryModelName: string;
  quantity: number;
  requestedByStaffId: string;
  requestedByStaffName: string | null;
  requestedByAdminName?: string | null; // nếu có admin duyệt
  requestDate: string;
  status: string; // string từ API
  staffNote?: string | null;
}

interface GroupedRequest {
  createdAt: string;
  requests: StockRequest[];
  adminName: string | null; // Admin/Người duyệt
  staffName: string | null; // Staff/Người tạo
  stationName: string;
  totalItems: number;
  status: string;
}

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};

const TOAST_ID = {
  fetchOk: "sr-fetch-ok",
  fetchErr: "sr-fetch-err",
  openInfo: "sr-open-modal",
  closeInfo: "sr-close-modal",
};

const SendRequestList = () => {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRequest | null>(
    null
  );
  const [showCheckModal, setShowCheckModal] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getMyStockRequests();
      setRequests(data);
      groupRequestsByCreatedAt(data);

      toast.success(
        data?.length
          ? `Đã tải ${data.length} yêu cầu.`
          : "Không có yêu cầu nào.",
        { ...toastOpts, toastId: TOAST_ID.fetchOk }
      );
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      const msg = error?.message || "Không thể tải yêu cầu.";
      toast.error(msg, { ...toastOpts, toastId: TOAST_ID.fetchErr });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Gộp các request ±5s cùng staff & station
  const groupRequestsByCreatedAt = (data: StockRequest[]) => {
    if (!data || data.length === 0) {
      setGroupedRequests([]);
      return;
    }

    const sorted = [...data].sort(
      (a, b) =>
        new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
    );

    const grouped: { [key: string]: StockRequest[] } = {};

    sorted.forEach((request) => {
      const requestTime = new Date(request.requestDate).getTime();

      const existingKey = Object.keys(grouped).find((key) => {
        const group = grouped[key];
        const first = group[0];
        const timeDiff = Math.abs(
          requestTime - new Date(first.requestDate).getTime()
        );
        const sameStaff =
          request.requestedByStaffName === first.requestedByStaffName;
        const sameStation = request.stationName === first.stationName;
        return timeDiff <= 5000 && sameStaff && sameStation;
      });

      if (existingKey) {
        grouped[existingKey].push(request);
      } else {
        const dateKey = new Date(request.requestDate).toISOString();
        grouped[dateKey] = [request];
      }
    });

    const groupedArray: GroupedRequest[] = Object.keys(grouped).map(
      (dateKey) => {
        const items = grouped[dateKey];
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const allSameStatus = items.every(
          (item) => item.status === items[0].status
        );

        return {
          createdAt: items[0].requestDate,
          requests: items,
          staffName: items[0].requestedByStaffName,
          adminName: items[0].requestedByAdminName ?? null,
          stationName: items[0].stationName,
          totalItems,
          status: allSameStatus ? items[0].status : "PendingAdminReview",
        };
      }
    );

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingAdminReview":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            Chờ xác nhận
          </span>
        );
      case "Approved":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Đã xác nhận
          </span>
        );
      case "Rejected":
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
    toast.info(
      group.status === "PendingAdminReview"
        ? "Mở kiểm tra yêu cầu."
        : "Mở chi tiết yêu cầu.",
      { ...toastOpts, toastId: TOAST_ID.openInfo }
    );
  };

  const handleCloseModal = () => {
    setShowCheckModal(false);
    setSelectedGroup(null);
    toast.info("Đã đóng cửa sổ.", {
      ...toastOpts,
      toastId: TOAST_ID.closeInfo,
    });
    fetchRequests();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <Card className="rounded-2xl shadow-lg border border-orange-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Yêu cầu gửi pin
          </CardTitle>
          <p className="text-sm text-gray-600">Danh sách các yêu cầu gửi pin</p>
        </CardHeader>
      </Card>

      {/* List */}
      {groupedRequests.length === 0 ? (
        <Card className="rounded-2xl border border-orange-200">
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
              className="rounded-2xl hover:shadow-lg transition-shadow border border-orange-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Yêu cầu #{groupedRequests.length - index}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{group.staffName}</span>
                      </div>
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

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Tổng số lượng:</span>{" "}
                      <span className="text-orange-600 font-bold">
                        {group.totalItems}
                      </span>{" "}
                      pin
                    </div>

                    <Button
                      onClick={() => handleCheckRequest(group)}
                      className={`h-10 rounded-lg ${
                        group.status === "PendingAdminReview"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "border border-orange-600 text-orange-600 hover:bg-orange-50"
                      }`}
                    >
                      {group.status === "PendingAdminReview" ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <Edit className="w-4 h-4 mr-2" />
                      )}
                      {group.status === "PendingAdminReview"
                        ? "Kiểm tra"
                        : "Xem chi tiết"}
                    </Button>
                  </div>

                  {group.requests[0].staffNote && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Ghi chú:</span>{" "}
                        {group.requests[0].staffNote}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal kiểm tra */}
      {showCheckModal && selectedGroup && (
        <CheckSendRequest group={selectedGroup} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default SendRequestList;
