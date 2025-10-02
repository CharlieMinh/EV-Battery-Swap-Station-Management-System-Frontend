import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { QrCode, Download } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeDialog({ isOpen, onClose }: QRCodeDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("driver.checkInQRCode")}</DialogTitle>
          <DialogDescription>{t("driver.scanAtStation")}</DialogDescription>
        </DialogHeader>
        <div className="text-center space-y-4">
          <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300">
            <QrCode className="w-32 h-32 mx-auto text-gray-400" />
          </div>
          <div>
            <p className="font-mono text-lg">SW-2024-001</p>
            <p className="text-sm text-gray-500">{t("driver.expiresIn")}</p>
          </div>
          <Button className="w-full">
            <Download className="w-4 h-4 mr-2" /> {t("driver.saveToPhone")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}