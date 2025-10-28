import React, { useState, useEffect } from "react"; // 👈 Thêm useState, useEffect
import axios from "axios"; // 👈 Thêm axios
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Battery, CheckCircle, XCircle, Loader2 } from "lucide-react"; // 👈 Thêm Loader2
import { useLanguage } from "../LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export function SwapHistory({ }: SwapHistoryProps) { // 👈 Xóa props khỏi hàm
  const { t } = useLanguage();

  // ✅ THÊM STATE NỘI BỘ
  const [swapHistory, setSwapHistory] = useState<SwapHistoryResponse | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ THÊM useEffect ĐỂ TỰ GỌI API
  useEffect(() => {
    async function fetchSwapHistory() {
      setLoading(true);
      setError(null);
      try {
        let url;
        if (showAll) {
          url = "http://localhost:5194/api/v1/swaps/history?page=1&pageSize=50";
        } else {
          url = "http://localhost:5194/api/v1/swaps/history?page=1&pageSize=3"; // Chỉ lấy 3 cái gần nhất
        }
        const response = await axios.get<SwapHistoryResponse>(url, { withCredentials: true });
        setSwapHistory(response.data);
      } catch (error) {
        console.error("Lỗi khi lấy lịch sử đổi pin:", error);
        setError(t("driver.swapHistory.errorLoad")); // Thêm thông báo lỗi
      } finally {
        setLoading(false);
      }
    }
    fetchSwapHistory();
  }, [showAll, t]); // 👈 Thêm t vào dependencies

  // Lấy danh sách giao dịch từ state
  const transactionsToShow = swapHistory?.transactions || [];

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
          <Button variant="outline" onClick={() => setShowAll(prev => !prev)} className="mt-4">
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-orange-500 rounded-lg">
      <CardHeader>
        <CardTitle className="text-orange-500 font-bold">
          {t("driver.swapHistory")}
        </CardTitle>
        <CardDescription>
          <div className="font-bold">
            {t("driver.totalSwap")}:{" "}
            <span className="text-orange-500">{swapHistory?.totalCount || 0}</span>
          </div>
          {t("driver.swapHistoryDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent>
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
                <div
                  key={swap.id}
                  className="p-4 border border-orange-300 rounded-lg space-y-2 shadow-sm"
                >
                  {/* ... (Giữ nguyên toàn bộ JSX hiển thị 1 swap) ... */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Battery className="w-5 h-5 text-green-500" />
                      <p className="font-semibold text-orange-600">
                        {swap.stationName}
                      </p>
                    </div>
                    <Badge className="bg-orange-500 text-white">
                      {swap.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{swap.stationAddress}</p>
                  <p className="text-sm text-gray-500">
                    {t("driver.completeTime")}: {completedTime}
                  </p>
                  <p className="text-sm">{t("driver.licensePlate")}: {swap.vehicleLicensePlate}</p>
                  <p className="text-sm">
                    {t("driver.batteryHealth")}: {swap.batteryHealthIssued}% →{" "}
                    {swap.batteryHealthReturned}%
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {swap.isPaid ? (
                        <span title="Đã thanh toán">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </span>
                      ) : (
                        <span title="Chưa thanh toán">
                          <XCircle className="w-5 h-5 text-red-500" />
                        </span>
                      )}
                      {/* Popup xem ghi chú */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-500 underline"
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
                    <div className="text-right font-medium text-green-600">
                      {/* Sửa lại định dạng tiền tệ */}
                      {t("driver.totalAmount")}: {Number(swap.totalAmount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Nút Xem thêm/Thu gọn */}
        {(swapHistory?.totalCount ?? 0) > 3 && ( // Chỉ hiển thị nút nếu tổng số > 3
          showAll ? (
            <Button
              variant="outline"
              className="w-full mt-4 border-orange-300 rounded-lg text-orange-500"
              onClick={() => setShowAll(false)} // 👈 Dùng state nội bộ
              disabled={loading} // 👈 Disable khi đang tải
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("driver.collapse")}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full mt-4 border-orange-300 rounded-lg bg-orange-500 text-white"
              onClick={() => setShowAll(true)} // 👈 Dùng state nội bộ
              disabled={loading} // 👈 Disable khi đang tải
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("driver.viewAllHistory")}
            </Button>
          )
        )}

      </CardContent>
    </Card>
  );
}