import React, { useState, useEffect } from "react";
import { X, Package, User, Calendar, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { fetchStaffById } from "@/services/admin/staffAdminService";
import { getMe } from "@/services/staff/staffApi";
import { useLanguage } from "../LanguageContext";
import { formatDateTimeShort } from "../../utils/dateTimeUtils";

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
}

const CheckSendRequest: React.FC<CheckSendRequestProps> = ({
  group,
  onClose,
}) => {
  const { t } = useLanguage();

  const [note, setNote] = useState(group.staffNote || "");
  const [staffName, setStaffName] = useState(group.staffName || t("staff.sendRequest.unknown"));
  const [adminName, setAdminName] = useState(group.adminName || t("staff.sendRequest.notApproved"));
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Fetch tên staff
  useEffect(() => {
    const staffId = group.requests[0]?.requestedByStaffId;
    
    // Nếu đã có tên từ group và không rỗng, dùng luôn (tối ưu)
    if (group.staffName && group.staffName.trim()) {
      setStaffName(group.staffName);
      return;
    }

    // Nếu có staffId, fetch từ API
    if (staffId) {
      setLoadingStaff(true);
      fetchStaffById(staffId)
        .then((staff) => {
          if (staff && staff.name) {
            setStaffName(staff.name);
          } else {
            // Nếu fetch không được, thử lấy từ user hiện tại
            getMe()
              .then(({ data }) => {
                if (data && data.name) {
                  setStaffName(data.name);
                } else {
                  setStaffName(group.staffName || t("staff.sendRequest.unknown"));
                }
              })
              .catch(() => {
                setStaffName(group.staffName || t("staff.sendRequest.unknown"));
              });
          }
        })
        .catch((error) => {
          console.error("Error fetching staff:", error);
          // Nếu fetch không được, thử lấy từ user hiện tại
          getMe()
            .then(({ data }) => {
              if (data && data.name) {
                setStaffName(data.name);
              } else {
                setStaffName(group.staffName || t("staff.sendRequest.unknown"));
              }
            })
            .catch(() => {
              setStaffName(group.staffName || t("staff.sendRequest.unknown"));
            });
        })
        .finally(() => setLoadingStaff(false));
      return;
    }

    // Nếu không có staffId, thử lấy từ user hiện tại (có thể là request của chính staff đó)
    setLoadingStaff(true);
    getMe()
      .then(({ data }) => {
        if (data && data.name) {
          setStaffName(data.name);
        } else {
          setStaffName(group.staffName || t("staff.sendRequest.unknown"));
        }
      })
      .catch(() => {
        setStaffName(group.staffName || t("staff.sendRequest.unknown"));
      })
      .finally(() => setLoadingStaff(false));
  }, [group.requests, group.staffName, t]);

  // Cập nhật adminName từ group
  useEffect(() => {
    if (group.adminName) {
      setAdminName(group.adminName);
    } else {
      setAdminName(t("staff.sendRequest.notApproved"));
    }
  }, [group.adminName, t]);

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
        {/* === Header === */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-600">
            {isEditable
              ? t("staff.sendRequest.titleEditable")
              : t("staff.sendRequest.titleReadonly")}
          </h2>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* === Thông tin chung === */}
          <Card className="border border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600">
                {t("staff.sendRequest.generalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Người gửi yêu cầu */}
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span>
                    {loadingStaff ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        {t("staff.sendRequest.loading")}
                      </span>
                    ) : (
                      staffName
                    )}
                  </span>
                </div>

                {/* Admin xử lý */}
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span>
                    {adminName}
                  </span>
                </div>

                {/* Thời gian gửi */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span>{formatDateTimeShort(group.createdAt)}</span>
                </div>

                {/* Trạm */}
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>{group.stationName}</span>
                </div>

                {/* Tổng số lượng */}
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>
                    {t("staff.sendRequest.totalItems")} {group.totalItems}{" "}
                    {t("staff.sendRequest.batteryUnit")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === Chi tiết pin === */}
          <Card className="border border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-600">
                {t("staff.sendRequest.detailTitle")}
              </CardTitle>
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
                          {t("staff.sendRequest.modelId")}{" "}
                          {request.batteryModelId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">
                        x{request.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("staff.sendRequest.quantity")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* === Buttons === */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              {t("staff.sendRequest.close")}
            </Button>

            {isEditable && (
              <Button className="bg-red-600 hover:bg-red-700">
                {t("staff.sendRequest.cancelRequest")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckSendRequest;
