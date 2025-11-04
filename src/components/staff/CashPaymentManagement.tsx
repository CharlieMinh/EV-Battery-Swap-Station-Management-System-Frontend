import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, User, Tag, CalendarDays, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

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

  // Filter & Search states
  const [searchText, setSearchText] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'Subscription', 'PayPerSwap'
  const [filterPriceRange, setFilterPriceRange] = useState<string>('all'); // 'all', '0-100k', '100k-500k', '500k+'
  const [filterDate, setFilterDate] = useState<string>('all'); // 'all', 'today', 'yesterday', 'this-week', 'this-month'

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 3; // Giảm xuống 3 để dễ test phân trang  // =========================
  // Fetch pending cash payments
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
  // Filter & Search Logic
  // =========================
  const filteredPayments = payments.filter((payment) => {
    // Search filter (tên hoặc số điện thoại)
    const searchLower = searchText.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      payment.userName?.toLowerCase().includes(searchLower) ||
      payment.userPhone?.toLowerCase().includes(searchLower) ||
      payment.userEmail?.toLowerCase().includes(searchLower);

    // Type filter
    const matchesType = filterType === 'all' || payment.type === filterType;

    // Price range filter
    let matchesPrice = true;
    if (filterPriceRange === '0-100k') {
      matchesPrice = payment.amount <= 100000;
    } else if (filterPriceRange === '100k-500k') {
      matchesPrice = payment.amount > 100000 && payment.amount <= 500000;
    } else if (filterPriceRange === '500k+') {
      matchesPrice = payment.amount > 500000;
    }

    // Date filter
    let matchesDate = true;
    if (filterDate !== 'all') {
      const paymentDate = new Date(payment.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (filterDate === 'today') {
        matchesDate = paymentDate >= today;
      } else if (filterDate === 'yesterday') {
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        matchesDate = paymentDate >= yesterday && paymentDate < yesterdayEnd;
      } else if (filterDate === 'this-week') {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        matchesDate = paymentDate >= weekStart;
      } else if (filterDate === 'this-month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        matchesDate = paymentDate >= monthStart;
      }
    }

    return matchesSearch && matchesType && matchesPrice && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterType, filterPriceRange]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Xác nhận thanh toán tiền mặt
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và xác nhận các giao dịch thanh toán bằng tiền mặt
          </p>
        </div>
        <Button
          onClick={() => {
            toast.info('Đang làm mới danh sách...', { ...toastOpts, toastId: 'cash-refresh' });
            fetchPendingCashPayments();
          }}
          variant="outline"
          size="sm"
          disabled={loading || !!confirmingId}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, số điện thoại hoặc email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter by Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Loại thanh toán" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="Subscription">Mua gói</SelectItem>
                <SelectItem value="PayPerSwap">Đặt lịch đổi pin</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter by Price */}
            <Select value={filterPriceRange} onValueChange={setFilterPriceRange}>
              <SelectTrigger className="w-full">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Khoảng giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giá</SelectItem>
                <SelectItem value="0-100k">Dưới 100k</SelectItem>
                <SelectItem value="100k-500k">100k - 500k</SelectItem>
                <SelectItem value="500k+">Trên 500k</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter summary */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-gray-600">
              Hiển thị <span className="font-semibold text-orange-600">{currentPayments.length}</span> / {filteredPayments.length} giao dịch
              {filteredPayments.length !== payments.length && (
                <span className="text-gray-400"> (đã lọc từ {payments.length})</span>
              )}
            </p>
            {(searchText || filterType !== 'all' || filterPriceRange !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchText('');
                  setFilterType('all');
                  setFilterPriceRange('all');
                }}
                className="text-orange-600 hover:text-orange-700"
              >
                <X className="h-4 w-4 mr-1" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">Không tìm thấy giao dịch nào</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Payment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPayments.map((payment) => (
              <Card key={payment.id} className="flex flex-col hover:shadow-lg transition-shadow border-2">
                <CardHeader className="pb-3">
                  {/* Badge phân loại loại thanh toán */}
                  {payment.type === 'Subscription' ? (
                    <Badge className="mb-3 w-fit bg-blue-500 hover:bg-blue-600 text-white">
                      Thanh toán Mua Gói
                    </Badge>
                  ) : (
                    <Badge className="mb-3 w-fit bg-purple-500 hover:bg-purple-600 text-white">
                      Thanh toán Đặt lịch Đổi Pin
                    </Badge>
                  )}

                  {/* Tên người dùng - Ưu tiên hiển thị */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {(payment.userName || 'K')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {payment.userName || 'Khách lẻ'}
                      </h3>
                      {payment.userPhone && (
                        <p className="text-sm text-gray-600 truncate">{payment.userPhone}</p>
                      )}
                      {payment.userEmail && (
                        <p className="text-xs text-gray-500 truncate">{payment.userEmail}</p>
                      )}
                    </div>
                  </div>

                  {/* Số tiền */}
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-orange-700 font-medium mb-1">Số tiền thanh toán</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {payment.amount.toLocaleString('vi-VN')} đ
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-3 text-sm pb-4">
                  {/* Thời gian */}
                  <div className="flex items-center text-gray-600 bg-gray-50 rounded-md p-2">
                    <CalendarDays className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="text-xs">
                      {format(new Date(payment.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>

                  {/* Gói hoặc mô tả */}
                  {payment.subscriptionPlanName && (
                    <div className="flex items-start bg-blue-50 rounded-md p-2 border border-blue-200">
                      <Tag className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                      <span className="text-blue-800 font-medium text-sm">
                        {payment.subscriptionPlanName}
                      </span>
                    </div>
                  )}
                  {!payment.subscriptionPlanName && payment.description && (
                    <div className="flex items-start bg-gray-50 rounded-md p-2">
                      <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">
                        {payment.description}
                      </span>
                    </div>
                  )}
                </CardContent>

                <div className="p-4 pt-0 mt-auto">
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md hover:shadow-lg transition-all"
                    size="lg"
                    onClick={() => handleConfirmCash(payment.id)}
                    disabled={confirmingId === payment.id || !!confirmingId}
                  >
                    {confirmingId === payment.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Xác nhận đã thu tiền
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Trang {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>

                    {/* Page numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? "bg-orange-600 hover:bg-orange-700" : ""}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default StaffCashPaymentManagement;
