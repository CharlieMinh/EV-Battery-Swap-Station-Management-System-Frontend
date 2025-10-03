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
import { QrCode } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface SwapStatusProps {
  onQRDialog: () => void;
}

export function SwapStatus({ onQRDialog }: SwapStatusProps) {
  const { t } = useLanguage();

  return (
    <Card className="border border-orange-500 rounded-lg">
      <CardHeader>
        <CardTitle className="text-orange-500 font-bold">{t("driver.activeReservation")}</CardTitle>
        <CardDescription>{t("driver.activeReservationDesc")}</CardDescription>
      </CardHeader>
      <CardContent >
        <div className="text-center space-y-4 text-orange-500">
          <Badge className="bg-green-100 text-green-800">
            {t("driver.confirmed")}
          </Badge>
          <div>
            <h3 className="text-lg font-medium">Downtown Hub</h3>
            <p className="text-gray-500">{t("driver.today")} at 14:30</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <QrCode className="w-24 h-24 mx-auto text-gray-400 mb-2 " />
            <p className="font-mono">SW-2024-001</p>
          </div>
          <div className="flex space-x-2">
            <Button className="flex-1 bg-orange-500" onClick={onQRDialog}>
              <QrCode className="w-4 h-4 mr-2" /> {t("driver.checkIn")}
            </Button>
            <Button className="bg-orange-500 text-white" variant="outline">{t("driver.directions")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}