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
import { Clock, ChevronRight, Battery, Eye, QrCode, X, Zap, CheckCircle, DollarSign, Printer } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Booking } from "../../services/staffApi";
import { CheckInDialog } from "./CheckInDialog";

interface QueueManagementProps {
  bookings: Booking[];
  onStartSwap: (booking: Booking) => void;
  onBatteryCheck?: (booking: Booking) => void;
  onCancelBooking?: (booking: Booking) => void;
  onCheckIn?: (booking: Booking) => void;
  onComplete?: (booking: Booking) => void;
  onProcessPaymentAndPrint?: (booking: Booking) => void;
}

export function QueueManagement({
  bookings,
  onStartSwap,
  onBatteryCheck,
  onCancelBooking,
  onCheckIn,
  onComplete,
  onProcessPaymentAndPrint,
}: QueueManagementProps) {
  const { t } = useLanguage();
  const [checkInDialog, setCheckInDialog] = React.useState(false);

  return (
    <Card className="border border-orange-200 rounded-lg shadow-lg bg-white">
      <CardHeader>
        <div>
          <CardTitle className="text-orange-600 text-2xl font-bold">
            Đơn Đặt Hôm Nay
          </CardTitle>
          <CardDescription className="text-gray-600">
            Danh sách đặt chỗ trong ngày
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <div key={booking.id}>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-orange-600 font-bold text-lg">{booking.time}</div>
                      <div className={`mt-2 px-3 py-1 rounded-full text-white text-sm font-medium ${
                        booking.status === 'pending' ? 'bg-yellow-500' :
                        booking.status === 'in-progress' ? 'bg-blue-500' :
                        booking.status === 'ready-to-swap' ? 'bg-purple-500' :
                        booking.status === 'swap-confirmed' ? 'bg-green-500' :
                        booking.status === 'ready-for-payment' ? 'bg-orange-500' :
                        booking.status === 'completed' ? 'bg-green-500' :
                        booking.status === 'cancelled' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}>
                        {booking.status === 'pending' ? 'Đang chờ' :
                         booking.status === 'in-progress' ? 'Đang xử lý' :
                         booking.status === 'ready-to-swap' ? 'Sẵn sàng thay pin' :
                         booking.status === 'swap-confirmed' ? 'Đã thay pin' :
                         booking.status === 'ready-for-payment' ? 'Chờ thanh toán' :
                         booking.status === 'completed' ? 'Hoàn thành' :
                         booking.status === 'cancelled' ? 'Đã hủy' :
                         'Không xác định'}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-black text-lg">{booking.customer}</p>
                      <p className="text-sm text-gray-500">{booking.vehicle}</p>
                      <p className="text-xs text-gray-400 font-mono">{booking.code}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-blue-600">
                          <span className="font-medium">Khung giờ:</span> {booking.slotTime}
                        </p>
                        <p className="text-xs text-green-600">
                          <span className="font-medium">Check-in:</span> {booking.checkInWindow.earliest} - {booking.checkInWindow.latest}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Đăng ký:</span> {new Date(booking.registrationTime).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {booking.status === "pending" && (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-4 py-2" 
                          onClick={() => setCheckInDialog(true)}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Check-in
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 font-semibold rounded-lg px-4 py-2" 
                          onClick={() => onCancelBooking?.(booking)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Hủy đặt đơn
                        </Button>
                      </>
                    )}
                    {booking.status === "in-progress" && (
                      <Button 
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2" 
                        onClick={() => onBatteryCheck?.(booking)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Kiểm tra pin
                      </Button>
                    )}
                    {booking.status === "ready-to-swap" && (
                      <Button 
                        size="sm" 
                        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg px-4 py-2" 
                        onClick={() => onStartSwap(booking)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Thay pin
                      </Button>
                    )}
                    {booking.status === "swap-confirmed" && (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-4 py-2" 
                        onClick={() => onComplete?.(booking)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Hoàn thành
                      </Button>
                    )}
                    {booking.status === "ready-for-payment" && (
                      <Button 
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-2" 
                        onClick={() => onProcessPaymentAndPrint?.(booking)}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Thanh toán và in hóa đơn
                      </Button>
                    )}
                    {booking.status === "completed" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-gray-300 text-gray-600 rounded-lg px-4 py-2"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Hoàn thành
                      </Button>
                    )}
                    {booking.status === "cancelled" && (
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
              {index < bookings.length - 1 && (
                <div className="h-px bg-orange-200 my-4"></div>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <CheckInDialog
        isOpen={checkInDialog}
        onClose={() => setCheckInDialog(false)}
        onCheckIn={(qrCode) => {
          console.log('Check-in successful:', qrCode);
          setCheckInDialog(false);
          
          // Tìm booking đầu tiên có status pending để check-in
          const pendingBooking = bookings.find(b => b.status === 'pending');
          if (pendingBooking && onCheckIn) {
            onCheckIn(pendingBooking);
          }
        }}
      />
    </Card>
  );
}
