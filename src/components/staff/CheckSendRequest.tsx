import React, { useState, useEffect } from "react";
import { X, Package, User, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fetchStaffById } from "@/services/admin/staffAdminService"; // import API của bạn

interface GroupedSendRequest {
  createdAt: string;
  requests: any[]; // StockRequest[]
  adminName: string | null;
  staffName: string | null;
  stationName: string;
  totalItems: number;
  status: string;
  staffNote?: string | null;
}

interface CheckSendRequestProps {
  group: GroupedSendRequest;
  onClose: () => void;
}

const CheckSendRequest: React.FC<CheckSendRequestProps> = ({
  group,
  onClose,
}) => {
  const [note, setNote] = useState(group.staffNote || "");
  const [staffName, setStaffName] = useState(group.staffName || "");
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch tên staff dựa trên requestedByStaffId của request đầu tiên
  useEffect(() => {
    const staffId = group.requests[0]?.requestedByStaffId;
    if (!staffId) return;

    setLoadingStaff(true);
    fetchStaffById(staffId)
      .then((staff) => {
        setStaffName(staff.name || group.staffName || "Unknown");
      })
      .catch(() => {
        setStaffName(group.staffName || "Unknown");
      })
      .finally(() => setLoadingStaff(false));
  }, [group.requests, group.staffName]);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isEditable = group.status === "PendingAdminReview";

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-600">
            {isEditable ? "Chi tiết yêu cầu gửi" : "Xem yêu cầu gửi"}
          </h2>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <Card className="border border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span>{loadingStaff ? "Đang tải..." : staffName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span>{group.adminName || "Chưa duyệt"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span>{formatDateTime(group.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>{group.stationName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>Tổng: {group.totalItems} pin</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-600">Chi Tiết Pin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.requests.map((request, index) => (
                  <div
                    key={request.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {request.batteryModelName || request.batteryModelId}
                        </p>
                        <p className="text-sm text-gray-500">
                          Model ID: {request.batteryModelId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        x{request.quantity}
                      </p>
                      <p className="text-xs text-gray-500">Số lượng</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            {isEditable && (
              <Button className="bg-red-600 hover:bg-red-700">
                Hủy yêu cầu
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckSendRequest;
