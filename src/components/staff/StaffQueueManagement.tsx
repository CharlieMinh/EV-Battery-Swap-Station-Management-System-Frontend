import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  Clock, 
  ChevronRight, 
  Battery, 
  Eye, 
  QrCode, 
  X, 
  Zap, 
  CheckCircle, 
  DollarSign, 
  Printer,
  AlertTriangle,
  RefreshCw,
  Download
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import QRCode from 'qrcode';

interface Booking {
  id: string;
  time?: string;
  status: number;
  customer?: string;
  vehicle?: string;
  code?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  checkInWindow?: {
    earliest: string;
    latest: string;
  };
  registrationTime?: string;
  createdAt?: string;
}

interface PinInfo {
  id: string;
  serial: string;
  model: string;
  capacity: number;
  voltage: number;
  health: number;
  temperature: number;
  cycles: number;
}

interface StaffQueueManagementProps {
  bookings: Booking[];
  onRefreshBookings?: () => void;
}

export function StaffQueueManagement({ 
  bookings, 
  onRefreshBookings 
}: StaffQueueManagementProps) {
  const { t } = useLanguage();
  const [checkInDialog, setCheckInDialog] = useState(false);
  const [pinCheckDialog, setPinCheckDialog] = useState(false);
  const [pinReplaceDialog, setPinReplaceDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [qrCodeData, setQrCodeData] = useState("");
  const [pinCheckResult, setPinCheckResult] = useState<any>(null);
  const [availablePins, setAvailablePins] = useState<PinInfo[]>([]);
  const [selectedReplacementPin, setSelectedReplacementPin] = useState<PinInfo | null>(null);
  const [mockBookings, setMockBookings] = useState<Booking[]>([]);
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [bookingQRCodes, setBookingQRCodes] = useState<{[key: string]: string}>({});

  // Mock data for demonstration
  useEffect(() => {
    // Simulate available pins in warehouse
    setAvailablePins([
      {
        id: "pin-1",
        serial: "TESLA-S-2024-001",
        model: "Tesla Model 3 Battery",
        capacity: 100,
        voltage: 400,
        health: 95,
        temperature: 25,
        cycles: 150
      },
      {
        id: "pin-2", 
        serial: "BYD-S-2024-002",
        model: "BYD Blade Battery",
        capacity: 120,
        voltage: 350,
        health: 88,
        temperature: 28,
        cycles: 200
      },
      {
        id: "pin-3",
        serial: "VINFAST-S-2024-003", 
        model: "VinFast VF8 Battery",
        capacity: 90,
        voltage: 380,
        health: 92,
        temperature: 26,
        cycles: 100
      }
    ]);

    // Simulate mock bookings data
    setMockBookings([
      {
        id: "booking-1",
        time: "08:00:00",
        status: 0, // pending
        customer: "Nguyễn Văn A",
        vehicle: "Tesla Model 3",
        code: "QR-PEND-001A",
        slotStartTime: "08:00:00",
        slotEndTime: "08:30:00",
        checkInWindow: {
          earliest: "08:00:00",
          latest: "08:30:00"
        },
        registrationTime: "2024-01-15T07:30:00Z",
        createdAt: "2024-01-15T07:30:00Z"
      },
      {
        id: "booking-2",
        time: "10:00:00",
        status: 1, // checked-in
        customer: "Trần Thị B",
        vehicle: "BYD Dolphin",
        code: "QR-CHECK-002B",
        slotStartTime: "10:00:00",
        slotEndTime: "10:30:00",
        checkInWindow: {
          earliest: "10:00:00",
          latest: "10:30:00"
        },
        registrationTime: "2024-01-15T09:45:00Z",
        createdAt: "2024-01-15T09:45:00Z"
      },
      {
        id: "booking-3",
        time: "11:00:00",
        status: 2, // completed
        customer: "Lê Văn C",
        vehicle: "VinFast VF8",
        code: "QR-COMP-003C",
        slotStartTime: "11:00:00",
        slotEndTime: "11:30:00",
        checkInWindow: {
          earliest: "11:00:00",
          latest: "11:30:00"
        },
        registrationTime: "2024-01-15T10:30:00Z",
        createdAt: "2024-01-15T10:30:00Z"
      },
      {
        id: "booking-4",
        time: "13:00:00",
        status: 3, // cancelled
        customer: "Phạm Thị D",
        vehicle: "Tesla Model Y",
        code: "QR-CANCEL-004D",
        slotStartTime: "13:00:00",
        slotEndTime: "13:30:00",
        checkInWindow: {
          earliest: "13:00:00",
          latest: "13:30:00"
        },
        registrationTime: "2024-01-15T12:15:00Z",
        createdAt: "2024-01-15T12:15:00Z"
      },
      {
        id: "booking-5",
        time: "16:00:00",
        status: 0, // pending
        customer: "Hoàng Văn E",
        vehicle: "BYD Atto 3",
        code: "QR-PEND-005E",
        slotStartTime: "16:00:00",
        slotEndTime: "16:30:00",
        checkInWindow: {
          earliest: "16:00:00",
          latest: "16:30:00"
        },
        registrationTime: "2024-01-15T15:20:00Z",
        createdAt: "2024-01-15T15:20:00Z"
      }
    ]);

    // Generate QR codes for all bookings
    const generateQRCodes = async () => {
      const qrCodes: {[key: string]: string} = {};
      
      for (const booking of mockBookings) {
        try {
          const qrData = JSON.stringify({
            bookingId: booking.id,
            customer: booking.customer,
            vehicle: booking.vehicle,
            time: booking.time,
            code: booking.code,
            timestamp: new Date().toISOString()
          });
          
          const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 150,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          qrCodes[booking.id] = qrCodeDataURL;
        } catch (error) {
          console.error(`Error generating QR code for booking ${booking.id}:`, error);
        }
      }
      
      setBookingQRCodes(qrCodes);
    };

    generateQRCodes();
  }, []);

  const handleCheckIn = (booking: Booking) => {
    setSelectedBooking(booking);
    setCheckInDialog(true);
  };

  const handleQRCodeScan = async () => {
    // Simulate QR code scanning
    const mockQRData = `eyJyaWQiOiJiZ6E4ZTdhMi0yNTgxLTRzMzMtOwFjZi04MzIwY2N1MjNjOTUiLCJ0cyI6MTc2MDk10TH18VmN1011sZW9SV@U5cHFmZzdtam12dnR3RjBraVFDZFVEY@p00VJuv10adize`;
    setQrCodeData(mockQRData);
    
    // Generate QR code image from the data
    try {
      const qrCodeDataURL = await QRCode.toDataURL(mockQRData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeImage(qrCodeDataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
    
    // Simulate QR code validation
    setTimeout(() => {
      if (selectedBooking) {
        // Update booking status to checked-in
        console.log('Check-in successful for booking:', selectedBooking.id);
        setCheckInDialog(false);
        onRefreshBookings?.();
      }
    }, 1000);
  };

  const handleDownloadQRCode = () => {
    if (qrCodeImage) {
      const link = document.createElement('a');
      link.download = `qr-code-${selectedBooking?.customer || 'customer'}.png`;
      link.href = qrCodeImage;
      link.click();
    }
  };

  const handleDownloadBookingQRCode = (booking: Booking) => {
    if (bookingQRCodes[booking.id]) {
      const link = document.createElement('a');
      link.download = `qr-code-${booking.customer}-${booking.time}.png`;
      link.href = bookingQRCodes[booking.id];
      link.click();
    }
  };

  const handlePinCheck = (booking: Booking) => {
    setSelectedBooking(booking);
    
    // Generate random pin parameters for visual inspection
    const randomPinParams = {
      capacity: Math.floor(Math.random() * 50) + 50, // 50-100%
      voltage: Math.floor(Math.random() * 100) + 300, // 300-400V
      temperature: Math.floor(Math.random() * 20) + 20, // 20-40°C
      cycles: Math.floor(Math.random() * 1000) + 100, // 100-1100 cycles
      health: Math.floor(Math.random() * 30) + 70, // 70-100%
      physicalCondition: Math.random() > 0.3 ? 'Tốt' : 'Cần kiểm tra',
      connectionStatus: Math.random() > 0.2 ? 'Ổn định' : 'Không ổn định'
    };
    
    setPinCheckResult(randomPinParams);
    setPinCheckDialog(true);
  };

  const handlePinReplace = (booking: Booking) => {
    setSelectedBooking(booking);
    setPinReplaceDialog(true);
  };

  const handleCompletePinCheck = () => {
    if (pinCheckResult && pinCheckResult.physicalCondition === 'Tốt' && pinCheckResult.connectionStatus === 'Ổn định') {
      // Check if suitable replacement pin is available
      const suitablePin = availablePins.find(pin => pin.health >= 80);
      if (suitablePin) {
        alert(`✅ Pin đạt yêu cầu!\nPin thay thế phù hợp: ${suitablePin.model}\nSức khỏe: ${suitablePin.health}%`);
        setPinCheckDialog(false);
      } else {
        alert('⚠️ Pin đạt yêu cầu nhưng không có pin thay thế phù hợp trong kho!');
      }
    } else {
      alert('❌ Pin không đạt yêu cầu kiểm tra cảm quan!');
    }
  };

  const handleCompletePinReplace = () => {
    if (selectedReplacementPin && selectedBooking) {
      alert(`✅ Thay pin thành công!\nKhách hàng: ${selectedBooking.customer}\nPin cũ: ${selectedBooking.vehicle}\nPin mới: ${selectedReplacementPin.model}`);
      setPinReplaceDialog(false);
      onRefreshBookings?.();
    } else {
      alert('❌ Vui lòng chọn pin thay thế!');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-500';
      case 1: return 'bg-blue-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Đang chờ';
      case 1: return 'Đã check-in';
      case 2: return 'Hoàn thành';
      case 3: return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-orange-200 rounded-lg shadow-lg bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-orange-600 text-2xl font-bold">
                Quản Lý Hàng Chờ
              </CardTitle>
              <CardDescription className="text-gray-600">
                Danh sách đặt chỗ và quản lý quy trình thay pin
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={onRefreshBookings}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(bookings.length > 0 ? bookings : mockBookings).map((booking, index) => (
              <div key={booking.id}>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-orange-600 font-bold text-lg">{booking.time}</div>
                        <div className={`mt-2 px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <p className="font-bold text-black text-lg">{booking.customer}</p>
                          <p className="text-sm text-gray-500">{booking.vehicle}</p>
                          <p className="text-xs text-gray-400 font-mono">{booking.code}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-blue-600">
                              <span className="font-medium">Khung giờ:</span> {booking.slotStartTime} - {booking.slotEndTime}
                            </p>
                            <p className="text-xs text-green-600">
                              <span className="font-medium">Check-in:</span> {booking.checkInWindow?.earliest || booking.slotStartTime} - {booking.checkInWindow?.latest || booking.slotEndTime}
                            </p>
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Đăng ký:</span> {booking.registrationTime ? new Date(booking.registrationTime).toLocaleString('vi-VN') : booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN') : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {/* QR Code Display */}
                        {bookingQRCodes[booking.id] && (
                          <div className="text-center">
                            <div className="bg-white p-2 rounded-lg border border-gray-200">
                              <img 
                                src={bookingQRCodes[booking.id]} 
                                alt={`QR Code for ${booking.customer}`}
                                className="w-16 h-16"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">QR Code</p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="mt-1 text-xs px-2 py-1 h-6"
                              onClick={() => handleDownloadBookingQRCode(booking)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Tải
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {booking.status === 0 && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-4 py-2" 
                            onClick={() => handleCheckIn(booking)}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            Check-in
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg px-4 py-2" 
                            onClick={() => {
                              // Handle cancel booking
                              console.log('Cancel booking:', booking.id);
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Hủy đặt đơn
                          </Button>
                        </>
                      )}
                      {booking.status === 1 && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2" 
                            onClick={() => handlePinCheck(booking)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Kiểm tra pin
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg px-4 py-2" 
                            onClick={() => handlePinReplace(booking)}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Thay pin
                          </Button>
                        </>
                      )}
                      {booking.status === 2 && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-4 py-2" 
                            onClick={() => {
                              // Handle complete
                              console.log('Complete booking:', booking.id);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Hoàn thành
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2" 
                            onClick={() => {
                              // Handle payment and invoice
                              console.log('Process payment:', booking.id);
                            }}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Thanh toán và in hóa đơn
                          </Button>
                        </>
                      )}
                      {booking.status === 3 && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-300 text-gray-600 rounded-lg px-4 py-2"
                          disabled
                        >
                          <X className="w-4 h-4 mr-2" />
                          Đã hủy
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {index < (bookings.length > 0 ? bookings : mockBookings).length - 1 && (
                  <div className="h-px bg-orange-200 my-4"></div>
                )}
              </div>
            ))}
            {bookings.length === 0 && mockBookings.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Không có đặt chỗ nào</p>
                <p className="text-gray-400 text-sm">Danh sách đặt chỗ sẽ hiển thị ở đây</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Check-in Dialog */}
      <Dialog open={checkInDialog} onOpenChange={setCheckInDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-green-600 mb-2">
              📱 Quét Mã QR Check-in
            </DialogTitle>
            <p className="text-gray-600">Quét mã QR từ khách hàng để xác nhận check-in</p>
          </DialogHeader>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 mb-6">
            <div className="text-center">
              <QrCode className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Khách hàng: {selectedBooking?.customer}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Thời gian: {selectedBooking?.time}
              </p>
              <Button 
                onClick={handleQRCodeScan}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Quét Mã QR
              </Button>
            </div>
          </div>

          {qrCodeData && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-6">
              <div className="flex items-center space-x-2 text-blue-700 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Mã QR đã được quét thành công!</span>
              </div>
              
              {/* QR Code Image */}
              {qrCodeImage && (
                <div className="text-center mb-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200 inline-block">
                    <img 
                      src={qrCodeImage} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">QR Code được tạo từ dữ liệu</p>
                </div>
              )}
              
              {/* Raw Data */}
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-500 mb-2 font-medium">Dữ liệu gốc:</p>
                <p className="text-sm text-gray-600 font-mono break-all">
                  {qrCodeData}
                </p>
              </div>
              
              {/* Download Button */}
              {qrCodeImage && (
                <div className="text-center mt-4">
                  <Button 
                    onClick={handleDownloadQRCode}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống QR Code
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setCheckInDialog(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pin Check Dialog */}
      <Dialog open={pinCheckDialog} onOpenChange={setPinCheckDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-orange-600 mb-2">
              🔍 Kiểm Tra Pin
            </DialogTitle>
            <p className="text-gray-600">Kiểm tra cảm quan pin và thông số kỹ thuật</p>
          </DialogHeader>
          
          {pinCheckResult && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
                  👤 Thông Tin Khách Hàng
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tên:</span>
                    <p className="font-medium">{selectedBooking?.customer}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Thời gian:</span>
                    <p className="font-medium">{selectedBooking?.time}</p>
                  </div>
                </div>
              </div>

              {/* Random Pin Parameters */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center">
                  🔋 Thông Số Pin (Random)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <span className="font-medium text-gray-700">Dung lượng:</span>
                    <p className="font-bold text-lg text-orange-600">{pinCheckResult.capacity}%</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <span className="font-medium text-gray-700">Điện áp:</span>
                    <p className="font-bold text-lg text-blue-600">{pinCheckResult.voltage}V</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <span className="font-medium text-gray-700">Nhiệt độ:</span>
                    <p className="font-bold text-lg text-red-600">{pinCheckResult.temperature}°C</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <span className="font-medium text-gray-700">Chu kỳ:</span>
                    <p className="font-bold text-lg text-purple-600">{pinCheckResult.cycles}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <span className="font-medium text-gray-700">Sức khỏe:</span>
                    <p className="font-bold text-lg text-green-600">{pinCheckResult.health}%</p>
                  </div>
                </div>
              </div>

              {/* Visual Inspection */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                  👁️ Kiểm Tra Cảm Quan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${pinCheckResult.physicalCondition === 'Tốt' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium text-gray-700">Tình trạng vật lý:</span>
                    </div>
                    <p className={`font-bold text-lg ${pinCheckResult.physicalCondition === 'Tốt' ? 'text-green-600' : 'text-red-600'}`}>
                      {pinCheckResult.physicalCondition}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${pinCheckResult.connectionStatus === 'Ổn định' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium text-gray-700">Kết nối:</span>
                    </div>
                    <p className={`font-bold text-lg ${pinCheckResult.connectionStatus === 'Ổn định' ? 'text-green-600' : 'text-red-600'}`}>
                      {pinCheckResult.connectionStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warehouse Check */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center">
                  🏪 Kiểm Tra Kho Pin
                </h3>
                <div className="space-y-3">
                  {availablePins.map((pin) => (
                    <div key={pin.id} className="bg-white p-4 rounded-lg border border-purple-100">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-700">{pin.model}</p>
                          <p className="text-sm text-gray-500">Serial: {pin.serial}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">{pin.health}%</p>
                          <p className="text-sm text-gray-500">{pin.capacity}Ah</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setPinCheckDialog(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={handleCompletePinCheck}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 shadow-lg"
            >
              <Eye className="w-5 h-5 mr-2" />
              ✅ Hoàn Thành Kiểm Tra
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pin Replace Dialog */}
      <Dialog open={pinReplaceDialog} onOpenChange={setPinReplaceDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-purple-600 mb-2">
              ⚡ Thay Pin
            </DialogTitle>
            <p className="text-gray-600">Thông tin khách hàng và pin thay thế</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                👤 Thông Tin Khách Hàng
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Tên khách hàng:</span>
                  <p className="font-bold text-lg text-blue-600">{selectedBooking?.customer}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Thời gian:</span>
                  <p className="font-bold text-lg text-blue-600">{selectedBooking?.time}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Xe:</span>
                  <p className="font-bold text-lg text-blue-600">{selectedBooking?.vehicle}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mã đặt:</span>
                  <p className="font-bold text-lg text-blue-600 font-mono">{selectedBooking?.code}</p>
                </div>
              </div>
            </div>

            {/* Current Pin Info */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                🔋 Pin Hiện Tại (Của Khách Hàng)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-red-100">
                  <span className="font-medium text-gray-700">Model:</span>
                  <p className="font-bold text-lg text-red-600">Tesla Model 3 Battery</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-100">
                  <span className="font-medium text-gray-700">Serial:</span>
                  <p className="font-bold text-lg text-red-600">TESLA-C-2023-001</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-100">
                  <span className="font-medium text-gray-700">Dung lượng:</span>
                  <p className="font-bold text-lg text-red-600">75%</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-100">
                  <span className="font-medium text-gray-700">Điện áp:</span>
                  <p className="font-bold text-lg text-red-600">380V</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-100">
                  <span className="font-medium text-gray-700">Chu kỳ:</span>
                  <p className="font-bold text-lg text-red-600">850</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-100">
                  <span className="font-medium text-gray-700">Nhiệt độ:</span>
                  <p className="font-bold text-lg text-red-600">32°C</p>
                </div>
              </div>
            </div>

            {/* Replacement Pin Selection */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                🔄 Pin Thay Thế (Từ Kho)
              </h3>
              <div className="space-y-3">
                {availablePins.map((pin) => (
                  <div 
                    key={pin.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedReplacementPin?.id === pin.id 
                        ? 'border-green-500 bg-green-100' 
                        : 'border-green-200 bg-white hover:bg-green-50'
                    }`}
                    onClick={() => setSelectedReplacementPin(pin)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-700">{pin.model}</p>
                        <p className="text-sm text-gray-500">Serial: {pin.serial}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600">{pin.health}%</p>
                        <p className="text-sm text-gray-500">{pin.capacity}Ah / {pin.voltage}V</p>
                        <p className="text-xs text-gray-400">{pin.cycles} chu kỳ</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setPinReplaceDialog(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={handleCompletePinReplace}
              disabled={!selectedReplacementPin}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 shadow-lg disabled:opacity-50"
            >
              <Zap className="w-5 h-5 mr-2" />
              ✅ Xác Nhận Thay Pin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
