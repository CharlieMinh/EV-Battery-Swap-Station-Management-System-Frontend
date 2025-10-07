import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Battery, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface SwapHistoryProps {
  recentSwaps: Swap[];
  showAll: boolean;
  setShowAll: (value: boolean) => void;
  swapHistory: any;
}

export function SwapHistory({ recentSwaps, swapHistory, showAll, setShowAll }: SwapHistoryProps) {
  const { t } = useLanguage();

  return (
    <Card className="border border-orange-500 rounded-lg">
      <CardHeader>
        <CardTitle className="text-orange-500 font-bold">
          {t("driver.swapHistory")}
        </CardTitle>
        <CardDescription>
          <div className="font-bold">
            Tổng số lần bạn đã thay pin:{" "}
            <span className="text-orange-500">{swapHistory?.totalCount || 0}</span>
          </div>

          {t("driver.swapHistoryDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {recentSwaps.map((swap) => {
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
                  Hoàn tất: {completedTime}
                </p>
                <p className="text-sm">Xe: {swap.vehicleLicensePlate}</p>
                <p className="text-sm">
                  Độ khỏe pin: {swap.batteryHealthIssued}% →{" "}
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
                          Xem ghi chú
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ghi chú giao dịch</DialogTitle>
                        </DialogHeader>
                        <p className="text-gray-700 whitespace-pre-line">
                          {swap.notes || "Không có ghi chú"}
                        </p>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="text-right font-medium text-green-600">
                    Tổng: {Number(swap.totalAmount).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {showAll ? (
          <Button
            variant="outline"
            className="w-full mt-4 border-orange-300 rounded-lg text-orange-500"
            onClick={() => setShowAll(false)}
          >
            Thu gọn lại
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full mt-4 border-orange-300 rounded-lg bg-orange-500 text-white"
            onClick={() => setShowAll(true)}
          >
            Xem toàn bộ lịch sử
          </Button>
        )}

      </CardContent>
    </Card>
  );
}
