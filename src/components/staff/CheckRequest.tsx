import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  X,
  Package,
  User,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { toast } from "react-toastify";
import {
  confirmMultipleBatteryRequests,
  rejectMultipleBatteryRequests,
  BatteryRequest,
} from "@/services/admin/batteryService";

interface GroupedRequest {
  createdAt: string;
  requests: BatteryRequest[];
  adminName: string;
  stationName: string;
  totalItems: number;
  status: number; // 0: pending, 1: confirmed, 2: rejected
}

interface CheckRequestProps {
  group: GroupedRequest;
  onClose: () => void;
}

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2500,
  closeOnClick: true,
};

// key ổn định theo group để chống trùng toast
const groupKey = (g: GroupedRequest) =>
  `${g.createdAt}|${g.adminName}|${g.stationName}`;

function getAxiosErrorMessage(err: any) {
  return err?.response?.data?.message || err?.message || "Đã xảy ra lỗi.";
}

const CheckRequest: React.FC<CheckRequestProps> = ({ group, onClose }) => {
  const [notes, setNotes] = useState(group.requests[0].staffNotes || "");
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<"confirm" | "reject" | null>(
    null
  );

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

  // Xác nhận tất cả (giữ nguyên luồng)
  const handleConfirmAll = async () => {
    if (!notes.trim()) {
      toast.warning("Vui lòng nhập ghi chú xác nhận!", {
        ...toastOpts,
        toastId: `req-note-missing-${groupKey(group)}`,
      });
      return;
    }

    setActionType("confirm");
    setLoading(true);

    try {
      const requestIds = group.requests.map((req) => req.id);
      await confirmMultipleBatteryRequests(requestIds, notes.trim());

      toast.success(
        `Đã xác nhận thành công ${group.requests.length} yêu cầu!`,
        {
          ...toastOpts,
          toastId: `req-confirm-success-${groupKey(group)}`,
        }
      );
      onClose();
    } catch (error: any) {
      console.error("Error confirming requests:", error);
      toast.error(
        getAxiosErrorMessage(error) || "Có lỗi xảy ra khi xác nhận!",
        {
          ...toastOpts,
          toastId: `req-confirm-error-${groupKey(group)}`,
        }
      );
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  // Từ chối tất cả (giữ nguyên luồng)
  const handleRejectAll = async () => {
    if (!notes.trim()) {
      toast.warning("Vui lòng nhập lý do từ chối!", {
        ...toastOpts,
        toastId: `req-reject-note-missing-${groupKey(group)}`,
      });
      return;
    }

    setActionType("reject");
    setLoading(true);

    try {
      const requestIds = group.requests.map((req) => req.id);
      await rejectMultipleBatteryRequests(requestIds, notes.trim());

      toast.success(`Đã từ chối ${group.requests.length} yêu cầu!`, {
        ...toastOpts,
        toastId: `req-reject-success-${groupKey(group)}`,
      });
      onClose();
    } catch (error: any) {
      console.error("Error rejecting requests:", error);
      toast.error(getAxiosErrorMessage(error) || "Có lỗi xảy ra khi từ chối!", {
        ...toastOpts,
        toastId: `req-reject-error-${groupKey(group)}`,
      });
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const isEditing = group.status !== 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => {
        onClose();
        toast.info("Đã đóng cửa sổ kiểm tra.", {
          ...toastOpts,
          toastId: `req-close-${groupKey(group)}`,
        });
      }}
    >
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-orange-600">
                {isEditing ? "Chi Tiết Yêu Cầu" : "Kiểm Tra Hàng"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isEditing
                  ? "Xem thông tin yêu cầu đã xử lý"
                  : "Xác nhận hoặc từ chối lô hàng này"}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                toast.info("Đã đóng cửa sổ kiểm tra.", {
                  ...toastOpts,
                  toastId: `req-close-${groupKey(group)}`,
                });
              }}
              className="hover:bg-red-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Thông tin chung */}
          <Card className="border border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600">
                Thông Tin Lô Hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Người gửi</p>
                    <p className="font-semibold">{group.adminName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Thời gian gửi</p>
                    <p className="font-semibold">
                      {formatDateTime(group.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Trạm nhận hàng</p>
                    <p className="font-semibold">{group.stationName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Tổng số lượng</p>
                    <p className="font-semibold text-orange-600">
                      {group.totalItems} pin
                    </p>
                  </div>
                </div>
              </div>
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
                    key={request.id}
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
                          {request.batteryModelName}
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

          {/* Ghi chú */}
          <Card className="border border-green-200">
            <CardHeader>
              <CardTitle className="text-green-600">
                {isEditing ? "Ghi Chú Đã Lưu" : "Ghi Chú Xác Nhận"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {!isEditing && (
                  <label className="text-sm font-medium text-gray-700">
                    Nhập ghi chú về tình trạng hàng nhận được *
                  </label>
                )}
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isEditing
                      ? ""
                      : "Ví dụ: Đã kiểm tra đầy đủ, hàng nguyên vẹn, không có vấn đề..."
                  }
                  className={`w-full p-3 border border-gray-300 rounded-lg ${
                    isEditing
                      ? "bg-gray-50 cursor-not-allowed"
                      : "focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  }`}
                  rows={4}
                  disabled={isEditing}
                  readOnly={isEditing}
                />
                {!isEditing && !notes.trim() && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Vui lòng nhập ghi chú trước khi xác nhận hoặc từ chối
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Thông tin đã xử lý */}
          {isEditing && group.requests[0].handledByStaffName && (
            <Card className="border border-gray-200 bg-gray-50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Đã xử lý bởi</p>
                    <p className="font-semibold">
                      {group.requests[0].handledByStaffName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Trạng thái</p>
                    {group.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <CheckCircle className="w-4 h-4" /> Đã xác nhận
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <XCircle className="w-4 h-4" /> Đã từ chối
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                toast.info("Đã đóng cửa sổ kiểm tra.", {
                  ...toastOpts,
                  toastId: `req-close-${groupKey(group)}`,
                });
              }}
              disabled={loading}
              className="px-6"
            >
              {isEditing ? "Đóng" : "Hủy"}
            </Button>

            {!isEditing && (
              <>
                <Button
                  onClick={handleRejectAll}
                  disabled={loading || !notes.trim()}
                  className="bg-red-600 hover:bg-red-700 px-6"
                >
                  {loading && actionType === "reject" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Từ chối
                </Button>
                <Button
                  onClick={handleConfirmAll}
                  disabled={loading || !notes.trim()}
                  className="bg-green-600 hover:bg-green-700 px-6"
                >
                  {loading && actionType === "confirm" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Xác nhận
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckRequest;
