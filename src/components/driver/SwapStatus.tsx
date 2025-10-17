import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { QrCode, MapPin } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { QRCodeSVG } from 'qrcode.react';

interface SwapStatusProps {
  activeReservation: any | null;
  onQRDialog: () => void;
  onNavigateToBooking: () => void;
}

export function SwapStatus({ activeReservation, onQRDialog, onNavigateToBooking }: SwapStatusProps) {
  const { t } = useLanguage();

  // --- TRƯỜNG HỢP 1: CÓ LỊCH HẸN ĐANG HOẠT ĐỘNG ---
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
                {/* 4. Sử dụng biến `localDate` đã được xử lý an toàn */}
                {localDate.toLocaleDateString('vi-VN')} lúc {activeReservation.slotStartTime.substring(0, 5)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg inline-block border">
              <QRCodeSVG value={activeReservation.qrCode || ""} size={128} />
            </div>
            <p className="font-mono text-lg tracking-widest">{activeReservation.reservationCode}</p>

            <Button className="w-full bg-orange-500" onClick={onQRDialog}>
              <QrCode className="w-4 h-4 mr-2" /> {t("driver.viewFullQRCode")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- TRƯỜNG HỢP 2: KHÔNG CÓ LỊCH HẸN ---
  return (
    <Card className="text-center p-8 border-dashed">
      <CardHeader>
        <CardTitle>Bạn hiện không có đơn đặt lịch nào</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="bg-orange-500" onClick={onNavigateToBooking}>
          <MapPin className="w-4 h-4 mr-2" /> Đặt lịch ngay
        </Button>
      </CardContent>
    </Card>
  );
}