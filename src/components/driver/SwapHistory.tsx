import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Battery, CheckCircle, XCircle, Loader2, AlertCircle, Star, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { Textarea } from "../ui/textarea";

// Interface Swap (Giữ nguyên)
interface Swap {
  id: string;
  transactionNumber: string;
  stationName: string;
  stationAddress: string;
  completedAt: string;
  totalAmount: number;
  status: string;
  vehicleLicensePlate: string;
  batteryHealthIssued: number;
  batteryHealthReturned: number;
  isPaid: boolean;
  notes?: string;
  rating?: number;
  feedback?: string;
  ratedAt?: string;
}

// Interface cho toàn bộ response API
interface SwapHistoryResponse {
  transactions: Swap[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ❌ XÓA Props cũ
interface SwapHistoryProps {
  // Không cần props nữa
}

export function SwapHistory({ }: SwapHistoryProps) {
  const { t } = useLanguage();

  // ✅ STATE NỘI BỘ
  const [swapHistory, setSwapHistory] = useState<SwapHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho modal báo cáo lỗi
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedSwapId, setSelectedSwapId] = useState<string | null>(null);
  const [complaintDetails, setComplaintDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho modal đánh giá
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedSwapForRating, setSelectedSwapForRating] = useState<Swap | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // ✅ NEW: State cho filter và pagination
  const [searchText, setSearchText] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // ✅ THÊM useEffect ĐỂ TỰ GỌI API
  useEffect(() => {
    async function fetchSwapHistory() {
      setLoading(true);
      setError(null);
      try {
        // ✅ NEW: Always load all data (pagination handled client-side)
        const url = "http://localhost:5194/api/v1/swaps/history?page=1&pageSize=100";
        const response = await axios.get<SwapHistoryResponse>(url, { withCredentials: true });
        setSwapHistory(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử đổi pin:", error);
        setError(t("driver.swapHistory.errorLoad"));
      } finally {
        setLoading(false);
      }
    }
    fetchSwapHistory();
  }, [t]);

  // Handler mở modal báo cáo lỗi
  const handleOpenReportModal = (swapId: string) => {
    setSelectedSwapId(swapId);
    setComplaintDetails("");
    setIsReportModalOpen(true);
  };

  // Handler gửi báo cáo lỗi
  const handleSubmitComplaint = async () => {
    if (!selectedSwapId || !complaintDetails.trim()) {
      toast.error("Vui lòng nhập nội dung khiếu nại");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:5194/api/driver/complaints/report",
        {
          swapTransactionId: selectedSwapId,
          complaintDetails: complaintDetails.trim(),
        },
        { withCredentials: true }
      );

      toast.success("Báo cáo lỗi đã được ghi nhận thành công! Vui lòng vào menu 'Khiếu nại của tôi' để đặt lịch kiểm tra.", {
        autoClose: 5000, // Hiển thị lâu hơn để user đọc
      });
      setIsReportModalOpen(false);
      setComplaintDetails("");
      setSelectedSwapId(null);

      // ❌ Xóa điều hướng tự động
      // navigate("/driver/complaints");
    } catch (error: any) {
      // Xử lý lỗi validation từ API
      let errorMsg = "Không thể gửi báo cáo. Vui lòng thử lại.";

      if (error.response?.data?.errors) {
        // Lấy lỗi validation từ object errors
        const errors = error.response.data.errors;
        const errorMessages: string[] = [];

        // Duyệt qua tất cả các field có lỗi
        Object.keys(errors).forEach(key => {
          if (Array.isArray(errors[key])) {
            errorMessages.push(...errors[key]);
          }
        });

        if (errorMessages.length > 0) {
          errorMsg = errorMessages.join(". ");
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler mở modal đánh giá
  const handleOpenRatingModal = (swap: Swap) => {
    setSelectedSwapForRating(swap);
    setRating(0);
    setHoverRating(0);
    setFeedback("");
    setIsRatingModalOpen(true);
  };

  // Handler gửi đánh giá
  const handleSubmitRating = async () => {
    if (!selectedSwapForRating) return;

    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    if (!feedback.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    setIsSubmittingRating(true);

    try {
      const response = await axios.put(
        `http://localhost:5194/api/v1/swaps/${selectedSwapForRating.id}/rate`,
        {
          rating: rating,
          feedback: feedback.trim(),
        },
        { withCredentials: true }
      );

      toast.success("Cảm ơn bạn đã đánh giá!");

      // Cập nhật lại dữ liệu swap trong danh sách
      setSwapHistory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          transactions: prev.transactions.map(swap =>
            swap.id === selectedSwapForRating.id
              ? { ...swap, rating: rating, feedback: feedback.trim(), ratedAt: new Date().toISOString() }
              : swap
          )
        };
      });

      setIsRatingModalOpen(false);
      setRating(0);
      setHoverRating(0);
      setFeedback("");
      setSelectedSwapForRating(null);
    } catch (error: any) {
      let errorMsg = "Không thể gửi đánh giá. Vui lòng thử lại.";

      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      toast.error(errorMsg);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // ✅ NEW: Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterPaymentStatus, filterRating]);

  // ✅ NEW: Filter and search logic
  const allTransactions = swapHistory?.transactions || [];

  const filteredTransactions = allTransactions.filter((swap) => {
    // Search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        swap.transactionNumber.toLowerCase().includes(searchLower) ||
        swap.stationName.toLowerCase().includes(searchLower) ||
        swap.vehicleLicensePlate.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Payment status filter
    if (filterPaymentStatus !== "all") {
      if (filterPaymentStatus === "paid" && !swap.isPaid) return false;
      if (filterPaymentStatus === "unpaid" && swap.isPaid) return false;
    }

    // Rating filter
    if (filterRating !== "all") {
      if (filterRating === "unrated" && swap.rating) return false;
      if (filterRating === "1-2" && (!swap.rating || swap.rating > 2)) return false;
      if (filterRating === "3-4" && (!swap.rating || swap.rating < 3 || swap.rating > 4)) return false;
      if (filterRating === "5" && swap.rating !== 5) return false;
    }

    return true;
  });

  // ✅ NEW: Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const transactionsToShow = filteredTransactions.slice(startIndex, endIndex);

  // ✅ NEW: Check if any filters are active
  const hasActiveFilters = searchText.trim() !== "" || filterPaymentStatus !== "all" || filterRating !== "all";

  // ✅ NEW: Clear all filters
  const handleClearFilters = () => {
    setSearchText("");
    setFilterPaymentStatus("all");
    setFilterRating("all");
    setCurrentPage(1);
  };

  // --- Render UI ---

  if (loading && !swapHistory) { // Chỉ hiển thị loading xoay tròn khi tải lần đầu
    return (
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-500 font-bold">{t("driver.swapHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-red-500 rounded-lg">
        <CardHeader>
          <CardTitle className="text-red-500 font-bold">{t("driver.swapHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-red-600">
          <p>{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-500 rounded-xl shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b border-orange-200">
        <CardTitle className="text-orange-600 font-bold text-xl flex items-center space-x-2">
          <Battery className="w-6 h-6" />
          <span>{t("driver.swapHistory")}</span>
        </CardTitle>
        <CardDescription className="text-base">
          <div className="font-bold text-gray-700">
            {t("driver.totalSwap")}:{" "}
            <span className="text-orange-600 text-lg">{swapHistory?.totalCount || 0}</span>
          </div>
          <p className="text-gray-600">{t("driver.swapHistoryDesc")}</p>
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {/* ✅ NEW: Filter and Search UI */}
        <Card className="mb-6 bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Row 1: Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Tìm theo mã giao dịch, trạm, biển số xe..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Row 2: Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Payment Status Filter */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Thanh toán</label>
                  <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="paid">Đã thanh toán</SelectItem>
                      <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Đánh giá</label>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="unrated">Chưa đánh giá</SelectItem>
                      <SelectItem value="1-2">1-2 sao</SelectItem>
                      <SelectItem value="3-4">3-4 sao</SelectItem>
                      <SelectItem value="5">5 sao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Summary & Clear Button */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    Tìm thấy <span className="font-bold text-orange-600">{filteredTransactions.length}</span> kết quả
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* ✅ SỬA LẠI: Dùng transactionsToShow */}
          {transactionsToShow.length === 0 ? (
            <p className="text-center text-gray-500 py-4">{t("driver.swapHistory.noHistory")}</p>
          ) : (
            transactionsToShow.map((swap) => {
              const completedTime = new Date(swap.completedAt).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              return (
                <Card
                  key={swap.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    {/* Header với background màu */}
                    <div className="bg-orange-500 text-white p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <Battery className="w-5 h-5" />
                          <p className="font-semibold text-base">
                            {swap.stationName}
                          </p>
                        </div>
                        <Badge className="bg-white text-orange-600 hover:bg-white">
                          {swap.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-orange-50 mt-1">{swap.stationAddress}</p>
                    </div>

                    {/* Nội dung chi tiết */}
                    <div className="p-4 space-y-3">
                      {/* Thông tin cơ bản */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">{t("driver.completeTime")}:</span>
                          <p className="font-medium text-gray-900">{completedTime}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">{t("driver.licensePlate")}:</span>
                          <p className="font-medium text-gray-900">{swap.vehicleLicensePlate}</p>
                        </div>
                      </div>

                      {/* Battery Health với progress bar */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">{t("driver.batteryHealth")}:</span>
                          <span className="text-sm font-bold text-gray-900">{swap.batteryHealthReturned}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${swap.batteryHealthReturned >= 80 ? 'bg-green-500' :
                              swap.batteryHealthReturned >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${swap.batteryHealthReturned}%` }}
                          />
                        </div>
                      </div>

                      {/* Payment và Total */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center space-x-2">
                          {swap.isPaid ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Đã thanh toán</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Chưa thanh toán</span>
                            </div>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-orange-500 hover:text-orange-600 h-auto p-1 text-xs underline"
                              >
                                {t("driver.viewAllNotes")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t("driver.transactionNotes")}</DialogTitle>
                              </DialogHeader>
                              <p className="text-gray-700 whitespace-pre-line">
                                {swap.notes || "Không có ghi chú"}
                              </p>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{t("driver.totalAmount")}</p>
                          <p className="font-bold text-green-600">
                            {Number(swap.totalAmount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                          </p>
                        </div>
                      </div>

                      {/* Rating section */}
                      {swap.rating && swap.ratedAt ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Đánh giá của bạn:</span>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= swap.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {swap.feedback && (
                            <p className="text-sm text-gray-600 italic">"{swap.feedback}"</p>
                          )}
                          <p className="text-xs text-gray-400">
                            Đánh giá lúc: {new Date(swap.ratedAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      ) : null}

                      {/* Action buttons */}
                      <div className={`grid gap-2 pt-2 ${swap.rating ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {!swap.rating && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-orange-400 text-orange-600 hover:bg-orange-50"
                            onClick={() => handleOpenRatingModal(swap)}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Đánh giá giao dịch
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-400 text-red-600 hover:bg-red-50"
                          onClick={() => handleOpenReportModal(swap.id)}
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Báo cáo lỗi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* ✅ NEW: Pagination Controls */}
        {filteredTransactions.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-gray-600">
              Trang <span className="font-bold text-orange-600">{currentPage}</span> / {totalPages}
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-orange-400 text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-orange-400 text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

      </CardContent>

      {/* Modal Báo cáo lỗi */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-gray-900">Báo cáo lỗi</DialogTitle>
            <DialogDescription className="text-base text-gray-600 pt-2">
              Vui lòng mô tả chi tiết vấn đề bạn gặp phải với pin đã đổi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <Textarea
              placeholder="Ví dụ: Pin tụt quá nhanh, chỉ dùng được 2 tiếng..."
              value={complaintDetails}
              onChange={(e) => setComplaintDetails(e.target.value)}
              rows={5}
              className="resize-none"
            />

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsReportModalOpen(false);
                  setComplaintDetails("");
                }}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSubmitComplaint}
                disabled={isSubmitting || !complaintDetails.trim()}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Đánh giá */}
      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-gray-900">Đánh giá giao dịch</DialogTitle>
            <DialogDescription className="text-base text-gray-600 pt-2">
              Hãy chia sẻ trải nghiệm của bạn về giao dịch này
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Chọn số sao */}
            <div className="flex flex-col items-center space-y-3">
              <p className="text-sm font-medium text-gray-700">Chọn số sao</p>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-10 h-10 cursor-pointer transition-all ${star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400 scale-110'
                      : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  {rating === 1 && "Rất tệ"}
                  {rating === 2 && "Tệ"}
                  {rating === 3 && "Bình thường"}
                  {rating === 4 && "Tốt"}
                  {rating === 5 && "Xuất sắc"}
                </p>
              )}
            </div>

            {/* Nhập feedback */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nhận xét của bạn</label>
              <Textarea
                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ đổi pin..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Nút hành động */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsRatingModalOpen(false);
                  setRating(0);
                  setHoverRating(0);
                  setFeedback("");
                }}
                disabled={isSubmittingRating}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSubmitRating}
                disabled={isSubmittingRating || rating === 0 || !feedback.trim()}
              >
                {isSubmittingRating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmittingRating ? "Đang gửi..." : "Gửi đánh giá"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}