import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 👈 Thêm
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { QrCode, MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react"; // 👈 Thêm
import { useLanguage } from "../LanguageContext";
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify'; // 👈 Thêm

// Interface cho dữ liệu reservation
interface Reservation {
  id: string;
  slotDate: string;
  stationName: string;
  slotStartTime: string;
  qrCode: string;
  reservationCode: string;
  // (Thêm các trường khác nếu bạn cần)
}

// ❌ SỬA LẠI PROPS: Chỉ nhận 2 hàm callback
interface SwapStatusProps {
  onQRDialog: () => void;
  onNavigateToBooking: () => void;
}

export function SwapStatus({ onQRDialog, onNavigateToBooking }: SwapStatusProps) {
  const { t } = useLanguage();

  // ✅ THÊM STATE NỘI BỘ (Chuyển từ Dashboard vào)
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  // State cho việc tải dữ liệu
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ THÊM HÀM fetch (Chuyển từ Dashboard vào)
  const getReservation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Reservation[]>( // Chỉ định kiểu trả về là mảng Reservation
        "http://localhost:5194/api/v1/slot-reservations/mine",
        {
          params: { status: 0 }, // 0 = Pending
          withCredentials: true,
        }
      );
      setActiveReservation(response.data?.[0] || null); // Lấy cái đầu tiên hoặc null
    } catch (error) {
      console.error(t("driver.booking.errorFetchReservation"), error);
      setError(t("driver.booking.errorFetchReservation"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ THÊM useEffect (Để gọi API khi component mount)
  useEffect(() => {
    getReservation();
  }, [t]); // Thêm [t] vì t được dùng trong hàm getReservation (cho error)

  // ✅ THÊM HÀM HỦY (Chuyển từ Dashboard vào)
  const showCancelReservation = () => setShowCancelPrompt(true);
  const hideCancelReservation = () => setShowCancelPrompt(false);

  const handleCancelReservation = async () => { // Lấy cancelNote từ state
    if (!activeReservation) return;

    setIsCancelling(true);
    try {
      await axios.delete(
        `http://localhost:5194/api/v1/slot-reservations/${activeReservation.id}`,
        {
          data: { reason: 0, note: cancelNote }, // Dùng state cancelNote
          withCredentials: true,
        }
      );
      toast.success(t("driver.cancelBooking.success"));
      setActiveReservation(null); // 👈 Tự cập nhật state của mình
      setShowCancelPrompt(false); // 👈 Tự cập nhật state của mình
      setCancelNote(""); // Xóa ghi chú
    } catch (error) {
      console.error("Lỗi khi hủy lịch hẹn:", error);
      toast.error(t("driver.cancelBooking.error"));
    } finally {
      setIsCancelling(false);
    }
  };

  // ⭐ HÀM KIỂM TRA HỦY MUỘN HAY SỚM
  const checkCancellationTiming = (): { isLate: boolean; timeUntilSlot: number; warningMessage: string } => {
    if (!activeReservation) return { isLate: false, timeUntilSlot: 0, warningMessage: '' };

    try {
      // Parse ngày và giờ từ reservation
      const dateParts = activeReservation.slotDate.split('-').map(Number);
      const timeParts = activeReservation.slotStartTime.split(':').map(Number);

      const slotDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
      const now = new Date();
      const timeUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60); // Giờ

      const isLate = timeUntilSlot <= 1 && timeUntilSlot > 0;

      let warningMessage = '';
      if (isLate) {
        warningMessage = '⚠️ Hủy sát giờ (≤1h)';
      } else if (timeUntilSlot > 1) {
        warningMessage = '✓ Hủy sớm (>1h)';
      }

      return { isLate, timeUntilSlot, warningMessage };
    } catch (error) {
      return { isLate: false, timeUntilSlot: 0, warningMessage: '' };
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <Card className="text-center p-8 border-dashed">
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="ml-2 text-gray-600">Đang kiểm tra lịch hẹn...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="text-center p-8 border-dashed border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600">Lỗi Tải Dữ Liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={getReservation} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- TRƯỜNG HỢP 1: CÓ LỊCH HẸN ---
  if (activeReservation) {
    const dateString = activeReservation.slotDate;
    const parts = dateString.split('-').map(Number);
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);

    return (
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-500 font-bold">{t("driver.activeReservation")}</CardTitle>
          <CardDescription>{t("driver.activeReservationDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-medium text-orange-600">{activeReservation.stationName}</h3>
              <p className="text-gray-500">
                {localDate.toLocaleDateString('vi-VN')} {t('driver.booking.atTime')} {activeReservation.slotStartTime.substring(0, 5)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg inline-block border">
              <QRCodeSVG value={activeReservation.qrCode || ""} size={128} />
            </div>
            <p className="font-mono text-lg tracking-widest">{activeReservation.reservationCode}</p>
            <div className="space-y-3 pt-4">

              {/* --- KHỐI NHẬP LÝ DO (logic nội bộ) --- */}
              {showCancelPrompt ? (
                <div className="space-y-2 text-left">
                  {/* ⭐ HIỂN THỊ CẢNH BÁO DỰA TRÊN THỜI GIAN */}
                  {(() => {
                    const { isLate, timeUntilSlot, warningMessage } = checkCancellationTiming();

                    return (
                      <>
                        {timeUntilSlot > 0 && (
                          <div className={`p-3 rounded-lg border ${isLate ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                            <p className={`text-sm font-semibold ${isLate ? 'text-red-700' : 'text-green-700'}`}>
                              {warningMessage}
                            </p>
                            {isLate ? (
                              <div className="mt-2 text-xs text-red-600 space-y-1">
                                <p>• <strong>Hủy sát giờ sẽ bị hình phạt:</strong></p>
                                <p className="ml-3">- Nếu đặt bằng <strong>Gói</strong>: Mất lượt (không hoàn)</p>
                                <p className="ml-3">- Nếu đặt bằng <strong>Tiền mặt</strong>: Tăng vi phạm +1</p>
                                <p className="ml-3 text-red-700 font-semibold">- Vi phạm 3 lần → Không được thanh toán tiền mặt</p>
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-green-600">
                                ✓ Hủy trước 1 giờ không bị phạt. Gói sẽ được hoàn lại lượt.
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <label htmlFor="cancelNote" className="block text-sm font-medium text-gray-700">
                    {t("driver.cancelReason")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="cancelNote"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                    value={cancelNote}
                    onChange={(e) => setCancelNote(e.target.value)}
                    placeholder={t("driver.enterCancelReason")}
                    disabled={isCancelling}
                  />
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleCancelReservation} // 👈 Sửa: Dùng hàm nội bộ
                    disabled={isCancelling || !cancelNote.trim()}
                  >
                    {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("driver.confirmCancel")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={hideCancelReservation} // 👈 Sửa: Dùng hàm nội bộ
                    disabled={isCancelling}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              ) : (
                /* --- NÚT BẤM CHÍNH (logic nội bộ) --- */
                <>
                  <Button
                    variant="outline"
                    className="w-full bg-orange-500 text-white"
                    onClick={showCancelReservation} // 👈 Sửa: Dùng hàm nội bộ
                  >
                    {t("driver.cancelBooking")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- TRƯỜNG HỢP 2: KHÔNG CÓ LỊCH HẸN (Giữ nguyên) ---
  return (
    <Card className="text-center p-8 border-dashed">
      <CardHeader>
        <CardTitle>{t('driver.swapStatus.noReservationTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="bg-orange-500" onClick={onNavigateToBooking}>
          <MapPin className="w-4 h-4 mr-2" /> {t('driver.swapStatus.bookNow')}
        </Button>
      </CardContent>
    </Card>
  );
}