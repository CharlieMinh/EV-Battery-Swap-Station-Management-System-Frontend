// src/components/staff/RequestBattery.tsx
import React, { useEffect, useState } from "react";
import {
  Calendar,
  Package,
  User,
  CheckCircle,
  Edit,
  RefreshCcw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import CheckRequest from "./CheckRequest";
import {
  fetchBatteryRequests,
  BatteryRequest,
} from "@/services/admin/batteryService";
import { toast } from "react-toastify";

/* ===========================
 *  Helper: Chuẩn hoá data API
 * =========================== */
const toRequestArray = (res: unknown): BatteryRequest[] => {
  if (Array.isArray(res)) return res as BatteryRequest[];
  const r: any = res;
  if (Array.isArray(r?.data)) return r.data as BatteryRequest[];
  if (Array.isArray(r?.data?.data)) return r.data.data as BatteryRequest[];
  if (Array.isArray(r?.items)) return r.items as BatteryRequest[];
  return [];
};

interface GroupedRequest {
  createdAt: string;
  requests: BatteryRequest[];
  adminName: string;
  stationName: string;
  totalItems: number;
  status: number;
}

export default function RequestBattery() {
  const [requests, setRequests] = useState<BatteryRequest[]>([]);
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRequest | null>(
    null
  );
  const [showCheckModal, setShowCheckModal] = useState(false);

  /* ===========================
   *  Gom nhóm theo thời gian
   * =========================== */
  const groupRequestsByCreatedAt = (data: BatteryRequest[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      setGroupedRequests([]);
      return;
    }

    const sorted = [...data].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const grouped: Record<string, BatteryRequest[]> = {};

    sorted.forEach((req) => {
      const reqTime = new Date(req.createdAt).getTime();
      const foundKey = Object.keys(grouped).find((key) => {
        const first = grouped[key][0];
        const diff = Math.abs(
          reqTime - new Date(first.createdAt).getTime()
        );
        const sameAdmin =
          req.requestedByAdminName === first.requestedByAdminName;
        const sameStation = req.stationName === first.stationName;
        return diff <= 3000 && sameAdmin && sameStation;
      });

      if (foundKey) grouped[foundKey].push(req);
      else {
        const dateKey = new Date(req.createdAt).toISOString().split(".")[0];
        grouped[dateKey] = [req];
      }
    });

    const arr: GroupedRequest[] = Object.keys(grouped).map((key) => {
      const list = grouped[key];
      const total = list.reduce((sum, i) => sum + i.quantity, 0);
      const same = list.every((i) => i.status === list[0].status);
      return {
        createdAt: list[0].createdAt,
        requests: list,
        adminName: list[0].requestedByAdminName,
        stationName: list[0].stationName,
        totalItems: total,
        status: same ? list[0].status : 0,
      };
    });

    arr.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setGroupedRequests(arr);
  };

  /* ===========================
   *  Fetch API + Toast
   * =========================== */
  const fetchRequests = async (withToast = false) => {
    setLoading(true);
    const promise = fetchBatteryRequests();

    try {
      if (withToast) {
        const res = await toast.promise(
          promise,
          {
            pending: "Đang tải yêu cầu nhập pin...",
            success: {
              render({ data }) {
                const arr = toRequestArray(data);
                return `Tải thành công ${arr.length} yêu cầu.`;
              },
            },
            error: {
              render({ data }) {
                const err: any = data;
                return (
                  err?.response?.data?.message ||
                  err?.message ||
                  "Không thể tải yêu cầu. Vui lòng thử lại."
                );
              },
            },
          },
          { autoClose: 2000 }
        );
        const arr = toRequestArray(res);
        setRequests(arr);
        groupRequestsByCreatedAt(arr);
      } else {
        const res = await promise;
        const arr = toRequestArray(res);
        setRequests(arr);
        groupRequestsByCreatedAt(arr);
      }
    } catch (e) {
      if (!withToast) toast.error("Không thể tải yêu cầu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(false);
  }, []);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (s: number) => {
    switch (s) {
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

  const handleCheckRequest = (g: GroupedRequest) => {
    setSelectedGroup(g);
    setShowCheckModal(true);
  };

  const handleCloseModal = async () => {
    setShowCheckModal(false);
    setSelectedGroup(null);
    toast.info("Đang cập nhật danh sách…", { autoClose: 1200 });
    await fetchRequests(true);
  };

  /* ===========================
   *  Giao diện
   * =========================== */
  if (loading && requests.length === 0)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-orange-600">
            Yêu Cầu Nhập Pin
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý các yêu cầu nhập pin từ Admin
          </p>
        </div>

        <Button
          onClick={() => fetchRequests(true)}
          variant="outline"
          className="border-orange-600 text-orange-600 hover:bg-orange-50"
          disabled={loading}
        >
          <RefreshCcw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
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
          {groupedRequests.map((group, i) => (
            <Card
              key={i}
              className="hover:shadow-lg transition-shadow border border-orange-200"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Lô hàng #{groupedRequests.length - i}
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

                  {group.requests[0]?.staffNotes && (
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

      {showCheckModal && selectedGroup && (
        <CheckRequest group={selectedGroup} onClose={handleCloseModal} />
      )}
    </div>
  );
}
