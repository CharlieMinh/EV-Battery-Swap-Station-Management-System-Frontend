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
import { Battery } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface Swap {
  id: string;
  station: string;
  date: string;
  time: string;
  amount: number;
  status: string;
}

interface SwapHistoryProps {
  recentSwaps: Swap[];
}

export function SwapHistory({ recentSwaps }: SwapHistoryProps) {
  const { t } = useLanguage();

  return (
    <Card className="border  border-orange-500 rounded-lg">
      <CardHeader>
        <CardTitle className="text-orange-500 font-bold">{t("driver.swapHistory")}</CardTitle>
        <CardDescription>{t("driver.swapHistoryDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentSwaps.map((swap) => (
            <div
              key={swap.id}
              className="flex items-center justify-between p-4 border  border-orange-300 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Battery className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium">{swap.station}</p>
                  <p className="text-sm text-gray-500">
                    {swap.date} at {swap.time}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${swap.amount}</p>
                <Badge variant="secondary">{t(`driver.${swap.status}`)}</Badge>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4 border-orange-300 rounded-lg">
          {t("driver.viewAllHistory")}
        </Button>
      </CardContent>
    </Card>
  );
}