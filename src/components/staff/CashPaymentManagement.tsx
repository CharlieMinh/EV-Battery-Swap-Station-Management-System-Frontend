// src/components/staff/StaffCashPaymentManagement.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge"; // ✅ Badge là component của shadcn/ui
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  User,
  Tag,
  CalendarDays,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PaymentListItem {
  id: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userSubscriptionId?: string | null;
  subscriptionPlanName?: string | null;
  reservationId?: string | null;
  method: string;
  type: "Subscription" | "OneTime" | string;
  amount: number;
  status: string;
  description?: string | null;
  createdAt: string;
  completedAt?: string | null;
  processedByStaffId?: string | null;
  processedByStaffName?: string | null;
}

interface ConfirmResponse {
  success: boolean;
  paymentId: string;
  status?: string | null;
  message?: string | null;
}

const API_BASE = "http://localhost:5194/api/v1";

const fmtCurrency = (v: number) =>
  (v ?? 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

export default function StaffCashPaymentManagement() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchPendingCashPayments = async (silent = false) => {
    setLoading(true);
    setError(null);

    // Chỉ hiện toast khi người dùng bấm “Làm mới”, còn lần load đầu thì im lặng
    const promise = axios.get<{ payments: PaymentListItem[] }>(
      `${API_BASE}/payments`,
      {
        params: { status: 0, method: 1, pageSize: 100 },
        withCredentials: true,
      }
    );

    try {
      if (silent) {
        const res = await promise;
        setPayments(res.data.payments || []);
      } else {
        const res = await toast.promise(
          promise,
          {
            pending: "Đang tải danh sách thanh toán...",
            success: {
              render({ data }) {
                const list = (data?.data?.payments ?? []) as PaymentListItem[];
                return `Tải thành công ${list.length} bản ghi.`;
              },
            },
            error: {
              render({ data }) {
                const msg =
                  (data as any)?.response?.data?.message ||
                  "Không thể tải danh sách thanh toán.";
                return msg;
              },
            },
          },
          { autoClose: 1800 }
        );
        setPayments(res.data.payments || []);
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setPayments([]);
      const msg =
        err?.response?.data?.message || "Không thể tải danh sách thanh toán.";
      setError(msg);
      if (silent) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Lần đầu load im lặng, không bắn toast success để đỡ ồn
    fetchPendingCashPayments(true);
  }, []);

  const handleConfirmCash = async (paymentId: string) => {
    if (confirmingId) return;
    setConfirmingId(paymentId);

    const promise = axios.post<ConfirmResponse>(
      `${API_BASE}/payments/${paymentId}/complete-cash`,
      {},
      { withCredentials: true }
    );

    try {
      const res = await toast.promise(
        promise,
        {
          pending: "Đang xác nhận thu tiền...",
          success: {
            render({ data }) {
              const okMsg =
                (data?.data?.message as string) || "Xác nhận thành công!";
              return okMsg;
            },
          },
          error: {
            render({ data }) {
              const msg =
                (data as any)?.response?.data?.message ||
                "Xác nhận thất bại.";
              return msg;
            },
          },
        },
        { autoClose: 2000 }
      );

      if (res.data?.success) {
        // Xóa khỏi list cục bộ
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      }
    } catch (err) {
      // Lỗi đã được toast.promise xử lý; chỉ log thêm
      console.error("Error confirming payment:", err);
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="ml-2">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <Button
          onClick={() => fetchPendingCashPayments(false)}
          variant="outline"
          className="mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Xác nhận thanh toán tiền mặt
        </h2>
        <Button
          onClick={() => fetchPendingCashPayments(false)}
          variant="outline"
          size="sm"
          disabled={loading || !!confirmingId}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {payments.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          Không có thanh toán tiền mặt nào đang chờ.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-orange-600">
                    {fmtCurrency(payment.amount)}
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <Tag className="w-4 h-4" />
                    {payment.type === "Subscription" ? "Mua gói" : "Đặt lẻ"}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center pt-1">
                  <CalendarDays className="w-4 h-4 mr-1.5 text-gray-500" />
                  {format(new Date(payment.createdAt), "HH:mm dd/MM/yyyy", {
                    locale: vi,
                  })}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-start">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="font-medium">
                      {payment.userName || "Khách lẻ"}
                    </span>
                    {payment.userEmail && (
                      <span className="block text-xs text-gray-500">
                        {payment.userEmail}
                      </span>
                    )}
                    {payment.userPhone && (
                      <span className="block text-xs text-gray-500">
                        {payment.userPhone}
                      </span>
                    )}
                  </div>
                </div>

                {(payment.subscriptionPlanName || payment.description) && (
                  <div className="flex items-start">
                    <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                    <span className="text-gray-700">
                      {payment.subscriptionPlanName || payment.description}
                    </span>
                  </div>
                )}
              </CardContent>

              <div className="p-4 pt-0">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                  onClick={() => handleConfirmCash(payment.id)}
                  disabled={confirmingId === payment.id || !!confirmingId}
                >
                  {confirmingId === payment.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Xác nhận đã thu tiền
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
