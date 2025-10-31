import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, User, Tag, CalendarDays } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// =========================
// Interfaces (Giữ nguyên)
// =========================
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
  type: string;
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

// =========================
// Helpers cho toast
// =========================
const toastOpts = { position: 'top-right' as const, autoClose: 2500, closeOnClick: true };

function getAxiosErrorMessage(err: any) {
  return err?.response?.data?.message || err?.message || 'Đã xảy ra lỗi.';
}

export function StaffCashPaymentManagement() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // =========================
  // Fetch pending cash payments (Giữ nguyên luồng)
  // =========================
  const fetchPendingCashPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<{ payments: PaymentListItem[] }>(
        'http://localhost:5194/api/v1/payments',
        {
          params: { status: 0, method: 1, pageSize: 100 },
          withCredentials: true,
        }
      );

      const list = response.data.payments || [];
      setPayments(list);

      // ✅ Chỉ 1 toast nhờ toastId
      toast.success(
        list.length > 0
          ? `Đã tải ${list.length} thanh toán tiền mặt đang chờ.`
          : 'Không có thanh toán tiền mặt nào đang chờ.',
        { ...toastOpts, toastId: 'cash-fetch' }
      );
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      const msg = getAxiosErrorMessage(err) || 'Không thể tải danh sách thanh toán.';
      setError('Không thể tải danh sách thanh toán.');
      setPayments([]);
      // ❌ Chỉ 1 toast lỗi
      toast.error(msg, { ...toastOpts, toastId: 'cash-fetch-error' });
    } finally {
      setLoading(false);
    }
  };

  // Gọi fetch khi mount (Giữ nguyên)
  useEffect(() => {
    fetchPendingCashPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Xác nhận đã thu tiền (Giữ nguyên luồng)
  // =========================
  const handleConfirmCash = async (paymentId: string) => {
    if (confirmingId) return;
    setConfirmingId(paymentId);
    try {
      const response = await axios.post<ConfirmResponse>(
        `http://localhost:5194/api/v1/payments/${paymentId}/complete-cash`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // ✅ Thành công — đảm bảo 1 toast cho mỗi payment
        toast.success(response.data.message || 'Xác nhận thành công!', {
          ...toastOpts,
          toastId: `cash-confirm-${paymentId}`,
        });
        setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      } else {
        // ❌ Thất bại (không throw)
        toast.error(response.data.message || 'Xác nhận thất bại.', {
          ...toastOpts,
          toastId: `cash-confirm-error-${paymentId}`,
        });
      }
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      // ❌ Lỗi khi gọi API
      toast.error(getAxiosErrorMessage(err) || 'Lỗi khi xác nhận.', {
        ...toastOpts,
        toastId: `cash-confirm-error-${paymentId}`,
      });
    } finally {
      setConfirmingId(null);
    }
  };

  // =========================
  // Render UI (giữ nguyên cấu trúc)
  // =========================

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
          onClick={() => {
            toast.info('Đang làm mới danh sách...', { ...toastOpts, toastId: 'cash-refresh' });
            fetchPendingCashPayments();
          }}
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
        <h2 className="text-2xl font-semibold tracking-tight">Xác nhận thanh toán tiền mặt</h2>
        <Button
          onClick={() => {
            toast.info('Đang làm mới danh sách...', { ...toastOpts, toastId: 'cash-refresh' });
            fetchPendingCashPayments();
          }}
          variant="outline"
          size="sm"
          disabled={loading || !!confirmingId}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </Button>
      </div>

      {payments.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Không có thanh toán tiền mặt nào đang chờ.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-orange-600">
                    {payment.amount.toLocaleString('vi-VN')} VND
                  </span>
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                    <Tag className="w-4 h-4 mr-1" />
                    {payment.type === 'Subscription' ? 'Mua gói' : 'Đặt lẻ'}
                  </span>
                </CardTitle>
                <CardDescription className="flex items-center pt-1">
                  <CalendarDays className="w-4 h-4 mr-1.5 text-gray-500" />
                  {format(new Date(payment.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow space-y-2 text-sm">
                <div className="flex items-start">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{payment.userName || 'Khách lẻ'}</span>
                    {payment.userEmail && (
                      <span className="block text-xs text-gray-500">{payment.userEmail}</span>
                    )}
                    {payment.userPhone && (
                      <span className="block text-xs text-gray-500">{payment.userPhone}</span>
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

export default StaffCashPaymentManagement;
