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

interface DriverInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  vehicleInfo: {
    model: string;
    plateNumber: string;
    batteryModel: string;
  };
  qrCode: string;
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
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  const handleQRScan = async () => {
    if (!qrCode.trim()) {
      setError("Vui lòng nhập mã QR từ driver");
      return;
    }

    setIsLoading(true);
    setError("");
    setVerificationStatus('pending');
    setDriverInfo(null);
    setReservationData(null);

    try {
      console.log('CheckInDialog: Scanning driver QR code:', qrCode);
      
      // Step 1: Get driver info from QR code
      const driver = await staffApi.getDriverByQRCode(qrCode);
      console.log('CheckInDialog: Driver info received:', driver);
      
      if (!driver) {
        setError("Không tìm thấy thông tin driver với mã QR này");
        setVerificationStatus('failed');
        return;
      }
      
      setDriverInfo(driver);
      
      // Step 2: Get reservation data for this driver
      const reservation = await staffApi.getReservationByDriverId(driver.id);
      console.log('CheckInDialog: Reservation data received:', reservation);
      
      if (!reservation) {
        setError("Không tìm thấy đặt chỗ cho driver này");
        setVerificationStatus('failed');
        return;
      }
      
      setReservationData(reservation);
      
      // Step 3: Verify driver info matches reservation
      const isVerified = verifyDriverInfo(driver, reservation);
      console.log('CheckInDialog: Verification result:', isVerified);
      
      if (isVerified) {
        setVerificationStatus('verified');
        setError("");
      } else {
        setVerificationStatus('failed');
        setError("Thông tin driver không khớp với đặt chỗ. Vui lòng kiểm tra lại.");
      }
      
    } catch (err: any) {
      console.error('CheckInDialog: Error scanning driver QR:', err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi xác thực QR driver");
      setVerificationStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify driver info matches reservation
  const verifyDriverInfo = (driver: DriverInfo, reservation: ReservationData): boolean => {
    try {
      // Check if driver ID matches reservation user ID
      if (driver.id !== reservation.userId) {
        console.log('CheckInDialog: Driver ID mismatch:', driver.id, 'vs', reservation.userId);
        return false;
      }
      
      // Check if vehicle info matches
      if (driver.vehicleInfo.model !== reservation.customerInfo?.vehicle) {
        console.log('CheckInDialog: Vehicle model mismatch:', driver.vehicleInfo.model, 'vs', reservation.customerInfo?.vehicle);
        return false;
      }
      
      // Check if battery model matches
      if (driver.vehicleInfo.batteryModel !== reservation.batteryModelId) {
        console.log('CheckInDialog: Battery model mismatch:', driver.vehicleInfo.batteryModel, 'vs', reservation.batteryModelId);
        return false;
      }
      
      console.log('CheckInDialog: All verifications passed');
      return true;
    } catch (error) {
      console.error('CheckInDialog: Error in verification:', error);
      return false;
    }
  };

  const handleConfirmCheckIn = () => {
    if (verificationStatus === 'verified' && driverInfo && reservationData) {
      console.log('CheckInDialog: Confirming check-in for driver:', driverInfo.name);
      onCheckIn(driverInfo.qrCode);
      onClose();
    }
  };

  const handleSimulateCheckIn = async () => {
    setIsLoading(true);
    setError("");
    setVerificationStatus('pending');

    try {
      // Simulate driver QR scan
      const mockDriver: DriverInfo = {
        id: 'driver-001',
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        licenseNumber: 'A123456789',
        vehicleInfo: {
          model: 'Tesla Model 3',
          plateNumber: '30A-12345',
          batteryModel: 'battery-model-001'
        },
        qrCode: 'DRIVER-QR-001'
      };
      
      const mockReservation: ReservationData = {
        id: 'reservation-001',
        userId: 'driver-001',
        stationId: '1',
        batteryModelId: 'battery-model-001',
        batteryUnitId: 'battery-unit-001',
        slotDate: new Date().toISOString().split('T')[0],
        slotStartTime: '09:00',
        slotEndTime: '09:30',
        qrCode: 'RESERVATION-QR-001',
        status: 0,
        createdAt: new Date().toISOString(),
        customerInfo: {
          name: 'Nguyễn Văn A',
          phone: '0123456789',
          vehicle: 'Tesla Model 3'
        }
      };
      
      setDriverInfo(mockDriver);
      setReservationData(mockReservation);
      setVerificationStatus('verified');
      
      // Auto check-in after 2 seconds
      setTimeout(() => {
        onCheckIn(mockDriver.qrCode);
        onClose();
      }, 2000);
      
    } catch (err) {
      setError("Có lỗi xảy ra khi giả lập check-in");
      setVerificationStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setQrCode("");
    setDriverInfo(null);
    setReservationData(null);
    setError("");
    setVerificationStatus('pending');
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
          {/* Driver Information */}
          {driverInfo && (
            <Card className="border border-blue-200 rounded-lg bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-gray-800 font-bold flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  Thông Tin Driver
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Tên:</span>
                      <span className="text-sm font-medium ml-2">{driverInfo.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">SĐT:</span>
                      <span className="text-sm font-medium ml-2">{driverInfo.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Bằng lái:</span>
                      <span className="text-sm font-medium ml-2">{driverInfo.licenseNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Battery className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Xe:</span>
                      <span className="text-sm font-medium ml-2">{driverInfo.vehicleInfo.model}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Battery className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Biển số:</span>
                      <span className="text-sm font-medium ml-2">{driverInfo.vehicleInfo.plateNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Battery className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Pin:</span>
                      <span className="text-sm font-medium ml-2">{driverInfo.vehicleInfo.batteryModel}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reservation Information */}
          {reservationData && (
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
                      <span className="text-sm font-medium ml-2">{reservationData.customerInfo?.name || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Battery className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Xe:</span>
                      <span className="text-sm font-medium ml-2">{reservationData.customerInfo?.vehicle || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Ngày:</span>
                      <span className="text-sm font-medium ml-2">{reservationData.slotDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm text-gray-600">Giờ:</span>
                      <span className="text-sm font-medium ml-2">{reservationData.slotStartTime} - {reservationData.slotEndTime}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Status */}
          {verificationStatus !== 'pending' && (
            <div className={`p-3 rounded-lg border ${
              verificationStatus === 'verified' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {verificationStatus === 'verified' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm ${
                  verificationStatus === 'verified' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {verificationStatus === 'verified' 
                    ? '✓ Thông tin driver khớp với đặt chỗ' 
                    : '✗ Thông tin driver không khớp với đặt chỗ'
                  }
                </span>
              </div>
            </div>
          )}

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
                Quét QR Code từ Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-700 font-medium text-sm">QR Code từ ứng dụng Driver</Label>
                  <Input
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Nhập hoặc dán QR code từ ứng dụng driver..."
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
                          Quét QR Driver
                        </>
                      )}
                    </Button>
                    {verificationStatus === 'verified' && (
                      <Button
                        onClick={handleConfirmCheckIn}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Xác Nhận Check-in
                      </Button>
                    )}
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
