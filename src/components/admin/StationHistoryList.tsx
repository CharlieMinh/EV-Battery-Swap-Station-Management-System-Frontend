import React, { useEffect, useState } from "react";
import { Zap, Clock, DollarSign, User } from "lucide-react";
import { fetchHistoryStationByName } from "@/services/admin/stationService";

export interface SwapTransaction {
  id: string;
  stationName: string;
  status: string;
  completedAt: string;
  swapFee: number;
  userEmail?: string;
  vehicleLicensePlate?: string;
}

const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN");

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);

interface StationHistoryListProps {
  stationName: string;
}

export const StationHistoryList: React.FC<StationHistoryListProps> = ({
  stationName,
}) => {
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchHistoryStationByName(stationName, 1, 50);
        setTransactions(data?.transactions ?? []);
      } catch (err) {
        console.error("Lỗi khi lấy lịch sử:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [stationName]);

  if (loading)
    return (
      <div className="text-center py-6 text-gray-500">Đang tải lịch sử...</div>
    );

  if (transactions.length === 0)
    return (
      <div className="text-center py-6 text-gray-400">
        Chưa có giao dịch đổi pin nào.
      </div>
    );

  // Nhóm theo ngày
  const grouped = transactions.reduce((acc, tx) => {
    const date = formatDate(tx.completedAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, SwapTransaction[]>);

  return (
    <div className="space-y-8 mt-6">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
            {date}
          </h3>
          <div className="space-y-3">
            {txs.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center bg-white border border-gray-100 p-4 rounded-xl hover:shadow transition"
              >
                <div className="flex items-center gap-4">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {formatTime(tx.completedAt)}
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {tx.vehicleLicensePlate || "Xe chưa rõ"}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="w-4 h-4" /> {tx.userEmail}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{tx.status}</p>
                  <p className="text-lg font-bold text-green-600 flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(tx.swapFee)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
