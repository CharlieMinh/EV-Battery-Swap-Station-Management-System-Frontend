// src/components/staff/SendRequestList.tsx
import React, { useEffect, useState } from "react";
import { Calendar, Package, User, CheckCircle, Edit, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CheckRequest from "./CheckRequest";
import { getMyStockRequests } from "@/services/staff/stockRequest";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";
import CheckSendRequest from "./CheckSendRequest";
import { formatDateTimeShort } from "../../utils/dateTimeUtils";

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
  adminReviewerName?: string | null; // tên admin từ API
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
};

const SendRequestList = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRequest | null>(
    null
  );
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [previousStatusMap, setPreviousStatusMap] = useState<Record<string, string>>({});
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getMyStockRequests();
      
      // Kiểm tra status thay đổi và hiển thị thông báo (chỉ sau lần load đầu tiên)
      if (!isFirstLoad) {
        let approvedCount = 0;
        let rejectedCount = 0;
        
        data.forEach((req) => {
          const prevStatus = previousStatusMap[req.id];
          if (prevStatus && prevStatus !== req.status) {
            if (prevStatus === "PendingAdminReview" && req.status === "Approved") {
              approvedCount++;
            } else if (prevStatus === "PendingAdminReview" && req.status === "Rejected") {
              rejectedCount++;
            }
          }
        });
        
        // Chỉ hiển thị 1 toast tổng hợp thay vì nhiều toast riêng lẻ
        if (approvedCount > 0) {
          toast.success(t("staff.sendRequest.toastApproved"), {
            ...toastOpts,
            toastId: "send-request-approved-batch",
          });
        }
        if (rejectedCount > 0) {
          toast.error(t("staff.sendRequest.toastRejected"), {
            ...toastOpts,
            toastId: "send-request-rejected-batch",
          });
        }
      } else {
        setIsFirstLoad(false);
      }
      
      // Cập nhật previous status map
      const newStatusMap: Record<string, string> = {};
      data.forEach((req) => {
        newStatusMap[req.id] = req.status;
      });
      setPreviousStatusMap(newStatusMap);
      
      setRequests(data);
      groupRequestsByCreatedAt(data);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      const msg = error?.message || t("staff.sendRequest.toastLoadError");
      toast.error(msg, { ...toastOpts, toastId: TOAST_ID.fetchErr });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Auto-refresh mỗi 30 giây để check status changes
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);
    return () => clearInterval(interval);
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
          staffName: items[0].requestedByStaffName || null,
          adminName: (items[0] as any).adminReviewerName ?? items[0].requestedByAdminName ?? null,
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


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PendingAdminReview":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            {t("staff.sendRequest.status.pending")}
          </span>
        );
      case "Approved":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            {t("staff.sendRequest.status.approved")}
          </span>
        );
      case "Rejected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            {t("staff.sendRequest.status.rejected")}
          </span>
        );
      default:
        return null;
    }
  };

  const handleCheckRequest = (group: GroupedRequest) => {
    setSelectedGroup(group);
    setShowCheckModal(true);
  };

  const handleCloseModal = () => {
    setShowCheckModal(false);
    setSelectedGroup(null);
    fetchRequests();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">{t("staff.sendRequest.loading")}</p>
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
            {t("staff.sendRequest.title")}
          </CardTitle>
          <p className="text-sm text-gray-600">{t("staff.sendRequest.subtitle")}</p>
        </CardHeader>
      </Card>

      {/* List */}
      {groupedRequests.length === 0 ? (
        <Card className="rounded-2xl border border-orange-200">
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{t("staff.sendRequest.noRequests")}</p>
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
                      {`${t("staff.sendRequest.batchLabel")} #${groupedRequests.length - index}`}
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
                        <span>{formatDateTimeShort(group.createdAt)}</span>
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
                      <span className="font-semibold">{t("staff.sendRequest.totalLabel")}</span>{" "}
                      <span className="text-orange-600 font-bold">{group.totalItems}</span>{" "}
                      {t("staff.sendRequest.unit")}
                    </div>

                    <Button
                      onClick={() => handleCheckRequest(group)}
                      className={`h-10 rounded-lg text-white shadow-md hover:shadow-lg transition-all ${
                        group.status === "PendingAdminReview"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : "border border-orange-600 text-orange-600 hover:bg-orange-50 bg-white"
                      }`}
                    >
                      {group.status === "PendingAdminReview" ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <Edit className="w-4 h-4 mr-2" />
                      )}
                      {group.status === "PendingAdminReview"
                        ? t("staff.sendRequest.button.check")
                        : t("staff.sendRequest.button.viewDetails")}
                    </Button>
                  </div>

                  {group.requests[0].staffNote && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">{t("staff.sendRequest.noteLabel")}</span>{" "}
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
