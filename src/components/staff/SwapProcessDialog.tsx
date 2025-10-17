import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Battery,
  CheckCircle,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import staffApi from "../../services/staffApi";

interface SwapProcessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSwapConfirmed?: () => void;
  bookingId?: string;
  staffId?: string;
  stationId?: number;
}

export function SwapProcessDialog({
  isOpen,
  onClose,
  onSwapConfirmed,
  bookingId,
  staffId,
  stationId,
}: SwapProcessDialogProps) {
  const { t } = useLanguage();
  const [swapComplete, setSwapComplete] = useState(false);

  const handleSwapComplete = async () => {
    try {
      console.log('SwapProcessDialog: Completing swap for booking:', bookingId);
      
      if (bookingId && staffId && stationId) {
        await staffApi.completeSwapProcess({
          bookingId,
          batteryOutId: "BAT-OLD-12345",
          batteryInId: "BAT-NEW-67890",
          amount: 25,
          paymentMethod: "card"
        }, staffId, stationId);
        
        console.log('SwapProcessDialog: Swap completed successfully');
      }
      
      setSwapComplete(true);
      onSwapConfirmed?.();
    } catch (error: any) {
      console.error("SwapProcessDialog: Error completing swap:", error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.warn('SwapProcessDialog: Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      if (error.response?.status === 403) {
        console.warn('SwapProcessDialog: Access forbidden for swap process');
        alert('Không có quyền thực hiện quy trình thay pin này');
        return;
      }
      
      alert('Có lỗi xảy ra khi hoàn thành quy trình thay pin');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border border-orange-200 rounded-lg bg-white shadow-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-orange-600 text-xl font-bold">
            {t("staff.batterySwapProcess")}
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            {t("staff.batterySwapProcessDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Information */}
          <Card className="border border-orange-100 rounded-lg bg-gray-50 shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-orange-600 font-medium text-sm">{t("staff.name")}</Label>
                  <p className="font-medium text-base">Alex Chen</p>
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-sm">{t("staff.vehicle")}</Label>
                  <p className="font-medium text-base">Tesla Model 3 2023</p>
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-sm">{t("staff.bookingCode")}</Label>
                  <p className="font-mono text-base">SW-2024-001</p>
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-sm">{t("staff.batteryModel")}</Label>
                  <p className="font-medium text-base">TM3-75kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Battery Status - Compact */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border border-red-200 rounded-lg bg-red-50 shadow-sm">
              <CardContent className="p-3">
                <CardTitle className="text-sm text-red-600 font-bold mb-2">
                  {t("staff.batteryOut")}
                </CardTitle>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>{t("staff.currentBattery")}:</span>
                    <span className="font-medium">Customer's Battery</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.chargeLevel")}:</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.destinationSlot")}:</span>
                    <span className="font-medium">A2 (Charging)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-200 rounded-lg bg-green-50 shadow-sm">
              <CardContent className="p-3">
                <CardTitle className="text-sm text-green-600 font-bold mb-2">
                  {t("staff.batteryIn")}
                </CardTitle>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>{t("staff.newBattery")}:</span>
                    <span className="font-medium">Slot B3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.chargeLevel")}:</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.health")}:</span>
                    <span className="font-medium text-green-600">96%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Service Information */}
          <Card className="border border-blue-100 rounded-lg bg-blue-50 shadow-sm">
            <CardContent className="p-4">
              <CardTitle className="text-sm text-blue-600 font-bold mb-3">
                🔧 Thông Tin Dịch Vụ Xe
              </CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-600 font-medium text-sm">Loại xe được thay</Label>
                  <p className="font-medium text-base">Tesla Model 3 2023</p>
                </div>
                <div>
                  <Label className="text-blue-600 font-medium text-sm">Mô hình pin thay</Label>
                  <p className="font-medium text-base">TM3-75kWh</p>
                </div>
                <div>
                  <Label className="text-blue-600 font-medium text-sm">Pin cũ (OUT)</Label>
                  <p className="font-medium text-base">Serial: BAT-OLD-12345</p>
                </div>
                <div>
                  <Label className="text-blue-600 font-medium text-sm">Pin mới (IN)</Label>
                  <p className="font-medium text-base">Serial: BAT-NEW-67890</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-blue-600 font-medium text-sm">Sửa chữa thêm</Label>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Kiểm tra hệ thống làm mát</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Vệ sinh đầu nối pin</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Cập nhật firmware pin</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between mt-4">
            <Button variant="outline" className="rounded-lg" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <div className="space-x-2">
              {!swapComplete ? (
                <Button 
                  onClick={handleSwapComplete} 
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 text-lg font-semibold rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Xác nhận đã thay pin
                </Button>
              ) : (
                <Button 
                  onClick={onClose} 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 text-lg font-semibold rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Hoàn thành
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

    </Dialog>
  );
}
