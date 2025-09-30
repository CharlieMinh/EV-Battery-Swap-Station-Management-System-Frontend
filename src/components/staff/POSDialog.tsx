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
      <DialogContent className="max-w-md border border-orange-200 rounded-lg bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-orange-600 text-2xl font-bold">
            {t("staff.pointOfSale")}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t("staff.pointOfSaleDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border border-orange-100 rounded-lg bg-gray-50 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-orange-600">$25.00</h3>
                <p className="text-gray-600">{t("staff.batterySwapService")}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button className="w-full h-16 text-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow">
              <CreditCard className="w-5 h-5 mr-2" /> {t("staff.cardPayment")}
            </Button>
            <Button variant="outline" className="w-full h-16 text-lg rounded-lg shadow">
              <QrCode className="w-5 h-5 mr-2" /> {t("staff.qrPayment")}
            </Button>
            <Button variant="outline" className="w-full h-16 text-lg rounded-lg shadow">
              <DollarSign className="w-5 h-5 mr-2" /> {t("staff.cashPayment")}
            </Button>
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" className="rounded-lg" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg" onClick={onClose}>
              <Printer className="w-4 h-4 mr-2" /> {t("staff.printReceipt")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
