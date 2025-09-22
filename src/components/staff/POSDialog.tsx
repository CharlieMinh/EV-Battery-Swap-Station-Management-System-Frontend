import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { CreditCard, QrCode, DollarSign, Printer } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface POSDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function POSDialog({ isOpen, onClose }: POSDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("staff.pointOfSale")}</DialogTitle>
          <DialogDescription>{t("staff.pointOfSaleDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold">$25.00</h3>
                <p className="text-gray-600">{t("staff.batterySwapService")}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button className="w-full h-16 text-lg">
              <CreditCard className="w-5 h-5 mr-2" /> {t("staff.cardPayment")}
            </Button>
            <Button variant="outline" className="w-full h-16 text-lg">
              <QrCode className="w-5 h-5 mr-2" /> {t("staff.qrPayment")}
            </Button>
            <Button variant="outline" className="w-full h-16 text-lg">
              <DollarSign className="w-5 h-5 mr-2" /> {t("staff.cashPayment")}
            </Button>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onClose}>
              <Printer className="w-4 h-4 mr-2" /> {t("staff.printReceipt")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
