import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { QrCode, MapPin, Loader2 } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { QRCodeSVG } from 'qrcode.react';

interface SwapStatusProps {
  activeReservation: any | null;
  onQRDialog: () => void;
  onNavigateToBooking: () => void;
  onShowCancelReservation: () => void;
  onCancelReservation: (note: string) => void;
  isCancelling: boolean;
  showCancelPrompt: boolean;
  onHideCancelReservation: () => void;
}

export function SwapStatus({ onHideCancelReservation, showCancelPrompt, activeReservation, onQRDialog, onNavigateToBooking, onCancelReservation, isCancelling, onShowCancelReservation }: SwapStatusProps) {
  const { t } = useLanguage();
  const [cancelNote, setCancelNote] = useState("");

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

              {/* --- KHỐI NHẬP LÝ DO (Chỉ hiện khi showCancelPromt = true) --- */}
              {showCancelPrompt ? (
                <div className="space-y-2 text-left">
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
                    onClick={() => onCancelReservation(cancelNote)}
                    disabled={isCancelling || !cancelNote.trim()}
                  >
                    {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t("driver.confirmCancel")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onHideCancelReservation}
                    disabled={isCancelling}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              ) : (
                /* --- CÁC NÚT BẤM CHÍNH (Chỉ hiện khi showCancelPromt = false) --- */
                <>
                  <Button
                    variant="outline"
                    className="w-full bg-orange-500 text-white"
                    onClick={onShowCancelReservation}
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

  // --- TRƯỜNG HỢP 2: KHÔNG CÓ LỊCH HẸN ---
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