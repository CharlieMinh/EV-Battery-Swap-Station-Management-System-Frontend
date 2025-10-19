import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useLanguage } from "../LanguageContext";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingResult: any;
}

export function QRCodeDialog({ isOpen, onClose, bookingResult }: QRCodeDialogProps) {
  const { t } = useLanguage();

  const qrCodeValue = bookingResult?.qrCode;
  const reservationCode = bookingResult?.reservationCode;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("driver.checkInQRCode")}</DialogTitle>
          <DialogDescription>{t("driver.scanAtStation")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {qrCodeValue ? (
            <>
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeSVG
                  value={qrCodeValue}
                  size={256}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                />
              </div>
              <div>
                <p className="font-mono text-lg tracking-widest">{reservationCode}</p>
                <p className="text-sm text-center text-gray-500">{t("driver.yourBookingCode")}</p>
              </div>
            </>
          ) : (
            <p className="text-gray-500 py-10">{t("driver.noQrCode")}</p>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>
            {t("driver.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}