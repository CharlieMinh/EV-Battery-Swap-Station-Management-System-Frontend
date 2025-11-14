import React from "react";
import { Package, CheckCircle, XCircle, X, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryRequest } from "@/services/admin/batteryService";
import { useLanguage } from "../LanguageContext";

interface GroupedRequest {
  createdAt: string;
  requests: BatteryRequest[];
  adminName: string;
  stationName: string;
  totalItems: number;
  status: number;
}

interface RequestDetailModalProps {
  group: GroupedRequest;
  onClose: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  group,
  onClose,
}) => {
  const { t } = useLanguage();
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

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
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
                {t("admin.shipmentDetail")}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t("admin.viewShipmentDetail")}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
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
                {t("admin.shipmentInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t("admin.sender")}</p>
                    <p className="font-semibold">{group.adminName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t("admin.sendTime")}</p>
                    <p className="font-semibold">
                      {formatDateTime(group.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t("admin.receivingStation")}</p>
                    <p className="font-semibold">{group.stationName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">{t("admin.totalQuantity")}</p>
                    <p className="font-semibold text-orange-600">
                      {group.totalItems} {t("admin.batteryUnit")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chi tiết pin */}
          <Card className="border border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-600">{t("admin.batteryDetails")}</CardTitle>
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
                      <p className="text-xs text-gray-500">{t("admin.quantity")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trạng thái xử lý */}
          <Card className="border border-green-200">
            <CardHeader>
              <CardTitle className="text-green-600">{t("admin.processingStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.requests.map((request, index) => (
                  <div
                    key={request.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {request.batteryModelName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("admin.quantity")}: x{request.quantity}
                        </p>
                      </div>
                      <div>
                        {request.status === 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            {t("admin.pending")}
                          </span>
                        ) : request.status === 1 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {t("admin.confirmed")}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            {t("admin.rejected")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thông tin xử lý */}
                    {request.handledByStaffName && (
                      <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">
                            {t("admin.handler")}
                          </p>
                          <p className="font-medium text-gray-900">
                            {request.handledByStaffName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">
                            {t("admin.updateTime")}
                          </p>
                          <p className="font-medium text-gray-900 text-xs">
                            {formatDateTime(request.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Ghi chú */}
                    {request.staffNotes && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-xs mb-1">
                          {t("admin.staffNotes")}:
                        </p>
                        <p className="text-gray-900 text-sm">
                          {request.staffNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hiển thị thông tin tổng hợp nếu đã xử lý */}
          {group.status !== 0 && (
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t("admin.handledBy")}</p>
                    <p className="font-semibold">
                      {group.requests[0].handledByStaffName || t("admin.notAvailable")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{t("admin.shipmentStatus")}</p>
                    {group.status === 1 ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                        <CheckCircle className="w-4 h-4" /> {t("admin.confirmed")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <XCircle className="w-4 h-4" /> {t("admin.rejected")}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100">
          <Button
            onClick={onClose}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
};
