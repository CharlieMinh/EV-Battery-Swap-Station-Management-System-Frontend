// src/components/staff/CashPaymentManagement.tsx  (giữ nguyên tên export của bạn)
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Tag,
  CalendarDays,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

/* =========================
 * Interfaces
 * ========================= */
interface VehicleInfo {
  id: string;
  plate: string;
  vin?: string | null;
  vehicleModelName?: string | null;
}

interface ReservationInfo {
  id: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
}

interface SubscriptionPlanInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  maxSwapsPerMonth: number;
  batteryModelName: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
}

interface StationInfo {
  id: string;
  name: string;
  address: string;
}

interface PaymentDetailInfo {
  amount: number;
  method: string;
  type: string;
  createdAt: string;
  completedAt?: string | null;
  description?: string | null;
  user: UserInfo;
  subscriptionPlan?: SubscriptionPlanInfo | null;
  vehicle?: VehicleInfo | null;
  reservation?: ReservationInfo | null;
  processedByStaff?: any | null;
  station?: StationInfo | null;
}

interface PendingCashPaymentItem {
  success: boolean;
  paymentId: string;
  status: string;
  message: string;
  paymentDetail: PaymentDetailInfo;
}

interface ConfirmResponse {
  success: boolean;
  paymentId: string;
  status?: string | null;
  message?: string | null;
}

/* =========================
 * Helpers cho toast (GIỮ)
 * ========================= */
const toastOpts = {
  position: "top-right" as const,
  autoClose: 2500,
  closeOnClick: true,
};
function getAxiosErrorMessage(err: any) {
  return err?.response?.data?.message || err?.message || "Đã xảy ra lỗi.";
}

export function StaffCashPaymentManagement() {
  const [payments, setPayments] = useState<PendingCashPaymentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Filters
  const [searchText, setSearchText] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriceRange, setFilterPriceRange] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all"); // (đang không dùng trong UI)

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 3; // giữ nguyên

  /* =========================
   * Fetch pending cash payments - GỌI API MỚI
   * ========================= */
  const fetchPendingCashPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<PendingCashPaymentItem[]>(
        "http://localhost:5194/api/v1/payments/pending-cash",
        { withCredentials: true }
      );

      const list = response.data || [];
      setPayments(list);
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      const msg =
        getAxiosErrorMessage(err) || "Không thể tải danh sách thanh toán.";
      setError("Không thể tải danh sách thanh toán.");
      setPayments([]);
      toast.error(msg, { ...toastOpts, toastId: "cash-fetch-error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCashPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
   * Filter & Search Logic
   * ========================= */
  const filteredPayments = payments.filter((payment) => {
    const detail = payment.paymentDetail;
    const searchLower = searchText.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      detail.user.name?.toLowerCase().includes(searchLower) ||
      detail.user.phoneNumber?.toLowerCase().includes(searchLower) ||
      detail.user.email?.toLowerCase().includes(searchLower) ||
      detail.vehicle?.plate?.toLowerCase().includes(searchLower) ||
      detail.vehicle?.vin?.toLowerCase().includes(searchLower);

    const matchesType = filterType === "all" || detail.type === filterType;

    let matchesPrice = true;
    if (filterPriceRange === "0-100k") {
      matchesPrice = detail.amount <= 100000;
    } else if (filterPriceRange === "100k-500k") {
      matchesPrice = detail.amount > 100000 && detail.amount <= 500000;
    } else if (filterPriceRange === "500k+") {
      matchesPrice = detail.amount > 500000;
    }

    // filterDate
    let matchesDate = true;
    if (filterDate !== "all") {
      const paymentDate = new Date(detail.createdAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (filterDate === "today") matchesDate = paymentDate >= today;
      else if (filterDate === "yesterday") {
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
        matchesDate = paymentDate >= yesterday && paymentDate < yesterdayEnd;
      } else if (filterDate === "this-week") {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        matchesDate = paymentDate >= weekStart;
      } else if (filterDate === "this-month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        matchesDate = paymentDate >= monthStart;
      }
    }

    return matchesSearch && matchesType && matchesPrice && matchesDate;
  });

  // Pagination (GIỮ)
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterType, filterPriceRange]);

  /* =========================
   * Confirm cash (GIỮ NGUYÊN LOGIC)
   * ========================= */
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
        toast.success(response.data.message || "Xác nhận thành công!", {
          ...toastOpts,
          toastId: `cash-confirm-${paymentId}`,
        });
        setPayments((prev) => prev.filter((p) => p.paymentId !== paymentId));
      } else {
        toast.error(response.data.message || "Xác nhận thất bại.", {
          ...toastOpts,
          toastId: `cash-confirm-error-${paymentId}`,
        });
      }
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      toast.error(getAxiosErrorMessage(err) || "Lỗi khi xác nhận.", {
        ...toastOpts,
        toastId: `cash-confirm-error-${paymentId}`,
      });
    } finally {
      setConfirmingId(null);
    }
  };

  /* =========================
   * Loading / Error (GIỮ)
   * ========================= */
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
            toast.info("Đang làm mới danh sách...", {
              ...toastOpts,
              toastId: "cash-refresh",
            });
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

  /* =========================
   * UI ĐỒNG BỘ VỚI CÁC MÀN KHÁC (CHỈ SỬA CLASSNAME/JSX)
   * ========================= */
  return (
    <div className="container mx-auto space-y-6">
      {/* Header card đồng bộ */}
      <Card className="rounded-2xl shadow-lg border border-orange-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Xác nhận thanh toán tiền mặt
          </CardTitle>
          <p className="text-sm text-gray-600">
            Quản lý và xác nhận các giao dịch thanh toán bằng tiền mặt
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-end">
            <Button
              onClick={() => {
                toast.info("Đang làm mới danh sách...", {
                  ...toastOpts,
                  toastId: "cash-refresh",
                });
                fetchPendingCashPayments();
              }}
              variant="outline"
              size="sm"
              disabled={loading || !!confirmingId}
              className="h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters card đồng bộ */}
      <Card className="rounded-2xl shadow-lg border border-orange-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên, số điện thoại hoặc email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-10 h-10 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter loại */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-10 w-full rounded-lg border-2 border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-black/20 focus:border-black transition-colors hover:border-gray-400">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Loại thanh toán" />
              </SelectTrigger>
              <SelectContent className="border-2 border-gray-300 rounded-lg">
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="Subscription">Mua gói</SelectItem>
                <SelectItem value="PayPerSwap">Đặt lịch đổi pin</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter giá */}
            <Select value={filterPriceRange} onValueChange={setFilterPriceRange}>
              <SelectTrigger className="h-10 w-full rounded-lg border-2 border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-black/20 focus:border-black transition-colors hover:border-gray-400">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Khoảng giá" />
              </SelectTrigger>
              <SelectContent className="border-2 border-gray-300 rounded-lg">
                <SelectItem value="all">Tất cả giá</SelectItem>
                <SelectItem value="0-100k">Dưới 100k</SelectItem>
                <SelectItem value="100k-500k">100k - 500k</SelectItem>
                <SelectItem value="500k+">Trên 500k</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-gray-600">
              Hiển thị{" "}
              <span className="font-semibold text-orange-600">
                {currentPayments.length}
              </span>{" "}
              / {filteredPayments.length} giao dịch
              {filteredPayments.length !== payments.length && (
                <span className="text-gray-400">
                  {" "}
                  (đã lọc từ {payments.length})
                </span>
              )}
            </p>
            {(searchText || filterType !== "all" || filterPriceRange !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchText("");
                  setFilterType("all");
                  setFilterPriceRange("all");
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

      {/* Empty state / List */}
      {filteredPayments.length === 0 ? (
        <Card className="rounded-2xl border border-orange-200">
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
          {/* Cards danh sách – viền cam & bo tròn lớn đồng bộ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPayments.map((payment) => {
              const detail = payment.paymentDetail;
              return (
                <Card
                  key={payment.paymentId}
                  className="flex flex-col hover:shadow-lg transition-shadow rounded-2xl border border-orange-200"
                >
                  <CardHeader className="pb-3">
                    {detail.type === "Subscription" ? (
                      <Badge className="mb-3 w-fit bg-blue-500 hover:bg-blue-600 text-white">
                        Thanh toán Mua Gói
                      </Badge>
                    ) : (
                      <Badge className="mb-3 w-fit bg-purple-500 hover:bg-purple-600 text-white">
                        Thanh toán Đặt lịch Đổi Pin
                      </Badge>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                        {(detail.user.name || "K")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {detail.user.name || "Khách lẻ"}
                        </h3>
                        {detail.user.phoneNumber && (
                          <p className="text-sm text-gray-600 truncate">
                            {detail.user.phoneNumber}
                          </p>
                        )}
                        {detail.user.email && (
                          <p className="text-xs text-gray-500 truncate">
                            {detail.user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="text-xs text-orange-700 font-medium mb-1">
                        Số tiền thanh toán
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {detail.amount.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow space-y-3 text-sm pb-4">
                    <div className="flex items-center text-gray-600 bg-gray-50 rounded-md p-2">
                      <CalendarDays className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                      <span className="text-xs">
                        {format(new Date(detail.createdAt), "HH:mm - dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </span>
                    </div>

                    {detail.subscriptionPlan && (
                      <div className="flex items-start bg-blue-50 rounded-md p-2 border border-blue-200">
                        <Tag className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                        <span className="text-blue-800 font-medium text-sm">
                          {detail.subscriptionPlan.name}
                        </span>
                      </div>
                    )}

                    {/* Thông tin xe - Chỉ hiển thị khi có reservation (PayPerSwap) */}
                    {detail.vehicle && detail.type === "PayPerSwap" && (
                      <div className="bg-purple-50 rounded-md p-3 border border-purple-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-purple-700 mb-1">Thông tin xe</p>
                          </div>
                        </div>
                        <div className="pl-1 space-y-1">
                          <p className="text-xs text-purple-700">
                            <span className="font-medium">Biển số xe:</span> {detail.vehicle.plate}
                          </p>
                          {detail.vehicle.vin && (
                            <p className="text-xs text-purple-700">
                              <span className="font-medium">VIN:</span> {detail.vehicle.vin}
                            </p>
                          )}
                          {detail.vehicle.vehicleModelName && (
                            <p className="text-xs text-purple-700">
                              <span className="font-medium">Dòng xe:</span> {detail.vehicle.vehicleModelName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {!detail.subscriptionPlan && detail.description && !detail.vehicle && (
                      <div className="flex items-start bg-gray-50 rounded-md p-2">
                        <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">
                          {detail.description}
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <div className="p-4 pt-0 mt-auto">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                      size="lg"
                      onClick={() => handleConfirmCash(payment.paymentId)}
                      disabled={confirmingId === payment.paymentId || !!confirmingId}
                    >
                      {confirmingId === payment.paymentId ? (
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
              )
            })}
          </div>

          {/* Pagination đồng bộ */}
          {totalPages > 1 && (
            <Card className="rounded-2xl border border-orange-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Trang {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2)
                          pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;

                        return (
                          <Button
                            key={pageNum}
                            variant={
                              currentPage === pageNum ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={
                              currentPage === pageNum
                                ? "bg-orange-600 hover:bg-orange-700"
                                : ""
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(totalPages, prev + 1)
                        )
                      }
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
