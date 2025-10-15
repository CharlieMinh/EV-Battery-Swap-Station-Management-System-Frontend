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
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
  QrCode, 
  Clock, 
  Battery, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar,
  Play
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import staffApi from "../../services/staffApi";

interface CheckInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (qrCode: string) => void;
}

interface ReservationData {
  id: string;
  userId: string;
  stationId: string;
  batteryModelId: string;
  batteryUnitId?: string;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  qrCode?: string;
  checkedInAt?: string;
  verifiedByStaffId?: string;
  status: number; // 0=Pending, 1=CheckedIn, 2=Completed, 3=Cancelled
  cancelReason?: number;
  cancelNote?: string;
  cancelledAt?: string;
  createdAt: string;
  // Additional fields for UI compatibility
  checkInWindow?: {
    earliest: string;
    latest: string;
  };
  customerInfo?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  assignedBattery?: {
    batteryUnitId: string;
    serialNumber: string;
    chargeLevel: number;
    location: string;
  };
}

export function CheckInDialog({
  isOpen,
  onClose,
  onCheckIn,
}: CheckInDialogProps) {
  const { t } = useLanguage();
  const [qrCode, setQrCode] = useState("");
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQRScan = async () => {
    if (!qrCode.trim()) {
      setError("Vui lòng nhập mã QR");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const reservation = await staffApi.checkInReservation(qrCode);
      setReservationData(reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi xác thực QR");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCheckIn = () => {
    if (reservationData && reservationData.qrCode) {
      onCheckIn(reservationData.qrCode);
      onClose();
    }
  };

  const handleSimulateCheckIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Use real API with simulated QR code
      const mockReservation = await staffApi.checkInReservation("SIMULATED-QR-CODE-12345");
      setReservationData(mockReservation);
      
      // Auto check-in after 1 second
      setTimeout(() => {
        if (mockReservation.qrCode) {
          onCheckIn(mockReservation.qrCode);
          onClose();
        }
      }, 1000);
      
    } catch (err) {
      setError("Có lỗi xảy ra khi giả lập check-in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQrCode("");
    setReservationData(null);
    setError("");
    onClose();
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Chờ check-in';
      case 1: return 'Đã check-in';
      case 2: return 'Hoàn thành';
      case 3: return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border border-gray-200 rounded-lg bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-800 text-xl font-bold">
            Check-in Khách Hàng
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            Quét QR code để xác nhận khách hàng đến trạm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Information */}
          <Card className="border border-orange-200 rounded-lg bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800 font-bold flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                Thông Tin Đặt Chỗ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Khách hàng:</span>
                    <span className="text-sm font-medium ml-2">Alex Chen</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Battery className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Xe:</span>
                    <span className="text-sm font-medium ml-2">Tesla Model 3</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Battery className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Pin:</span>
                    <span className="text-sm font-medium ml-2">75kWh</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Ngày:</span>
                    <span className="text-sm font-medium ml-2">10/10/2025</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Giờ:</span>
                    <span className="text-sm font-medium ml-2">09:00 - 09:30</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Check-in:</span>
                    <span className="text-sm font-medium ml-2">08:45 - 09:15</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Warning */}
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-600 text-sm">
                Ngoài khung giờ check-in
              </span>
            </div>
            <p className="text-red-600 text-xs mt-1">
              Khách hàng chỉ có thể check-in từ 08:45 đến 09:15
            </p>
          </div>

          {/* QR Code Input */}
          <Card className="border border-orange-200 rounded-lg bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-800 font-bold flex items-center">
                <QrCode className="w-4 h-4 mr-2 text-orange-500" />
                Quét QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-700 font-medium text-sm">QR Code từ khách hàng</Label>
                  <Input
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Nhập hoặc dán QR code từ ứng dụng khách hàng..."
                    className="mt-2 text-sm border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                {error && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={handleSimulateCheckIn}
                    disabled={isLoading}
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    {isLoading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Đang giả lập...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Giả lập Check-in
                      </>
                    )}
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleQRScan}
                      disabled={isLoading || !qrCode.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 mr-2" />
                          Check-in
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
