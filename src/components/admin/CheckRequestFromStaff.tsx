import React, { useState, useEffect } from "react";
import { X, Package, User, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fetchStaffById } from "@/services/admin/staffAdminService";
import {
  reviewStockRequest,
  ReviewStockRequestPayload,
} from "@/services/admin/requestPin";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface GroupedSendRequest {
  createdAt: string;
  requests: any[];
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
  onSuccess: () => void;
}

const CheckRequestFromStaff: React.FC<CheckSendRequestProps> = ({
  group,
  onClose,
  onSuccess,
}) => {
  const [note, setNote] = useState(group.staffNote || "");
  const [adminNote, setAdminNote] = useState("");
  const [staffName, setStaffName] = useState(group.staffName || "");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditable = group.status === "PendingAdminReview";

  useEffect(() => {
    const staffId = group.requests[0]?.requestedByStaffId;
    if (!staffId) return;

    setLoadingStaff(true);
    fetchStaffById(staffId)
      .then((staff) => setStaffName(staff.name || group.staffName || "Unknown"))
      .catch(() => setStaffName(group.staffName || "Unknown"))
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

  const handleProvidePin = async () => {
    if (!isEditable) return;
    setSubmitting(true);

    try {
      await Promise.all(
        group.requests.map(async (req) => {
          const payload: ReviewStockRequestPayload = {
            isApproved: true,
            adminNote: adminNote || "",
          };
          await reviewStockRequest(req.id, payload);
        })
      );

      toast.success("Cung cấp pin thành công!");
      onClose();
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi cung cấp pin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div
        className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-orange-600">
              {isEditable ? "Chi tiết yêu cầu gửi" : "Xem yêu cầu gửi"}
            </h2>
            <Button variant="secondary" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Thông tin chung */}
            <Card className="border border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-600">
                  Thông tin chung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />{" "}
                    <span>
                      Người gửi: {loadingStaff ? "Đang tải..." : staffName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />{" "}
                    <span>{formatDateTime(group.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500" />{" "}
                    <span>{group.stationName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500" />{" "}
                    <span>Tổng: {group.totalItems} pin</span>
                  </div>
                </div>

                {isEditable && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú của Admin
                    </label>
                    <textarea
                      className="w-full border rounded p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
                      rows={5}
                      placeholder="Nhập ghi chú của Admin, ví dụ: kiểm tra số lượng, kiểm tra tình trạng pin..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                  </div>
                )}

                {note && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú của Nhân viên
                    </label>
                    <div className="w-full border rounded p-3 text-sm bg-gray-50">
                      {note}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chi tiết pin */}
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

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              {isEditable && (
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={submitting}
                  onClick={handleProvidePin}
                >
                  {submitting ? "Đang xử lý..." : "Cung cấp Pin"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckRequestFromStaff;
