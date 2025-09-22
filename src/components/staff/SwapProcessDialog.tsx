import React from "react";
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
import {
  QrCode,
  ShieldCheck,
  Battery,
  CheckCircle,
  DollarSign,
  Printer,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface SwapProcessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPOSDialog: () => void;
}

export function SwapProcessDialog({
  isOpen,
  onClose,
  onPOSDialog,
}: SwapProcessDialogProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("staff.batterySwapProcess")}</DialogTitle>
          <DialogDescription>
            {t("staff.batterySwapProcessDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("staff.customerInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("staff.name")}</Label>
                  <p className="font-medium">Alex Chen</p>
                </div>
                <div>
                  <Label>{t("staff.vehicle")}</Label>
                  <p className="font-medium">Tesla Model 3 2023</p>
                </div>
                <div>
                  <Label>{t("staff.bookingCode")}</Label>
                  <p className="font-mono">SW-2024-001</p>
                </div>
                <div>
                  <Label>{t("staff.batteryModel")}</Label>
                  <p className="font-medium">TM3-75kWh</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">
                  {t("staff.batteryOut")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("staff.currentBattery")}:</span>
                    <span className="font-medium">Customer's Battery</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.chargeLevel")}:</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.destinationSlot")}:</span>
                    <span className="font-medium">A2 (Charging)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">
                  {t("staff.batteryIn")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("staff.newBattery")}:</span>
                    <span className="font-medium">Slot B3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.chargeLevel")}:</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.health")}:</span>
                    <span className="font-medium text-green-600">96%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>{t("staff.qrCodeScanned")}</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5" />
              <span>{t("staff.pinVerified")}</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center space-x-2">
              <Battery className="w-5 h-5" />
              <span>{t("staff.batterySwapComplete")}</span>
              <Button size="sm">{t("staff.markComplete")}</Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onPOSDialog}>
                <DollarSign className="w-4 h-4 mr-2" />{" "}
                {t("staff.processPayment")}
              </Button>
              <Button onClick={onClose}>
                <Printer className="w-4 h-4 mr-2" />{" "}
                {t("staff.completeAndPrint")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
