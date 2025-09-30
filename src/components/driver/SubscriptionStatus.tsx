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
import { Progress } from "../ui/progress";
import { Settings } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface SubscriptionPlan {
  name: string;
  swapsUsed: number;
  swapsLimit: number;
  renewDate: string;
  price: number;
}

interface SubscriptionStatusProps {
  subscriptionPlan: SubscriptionPlan;
}

export function SubscriptionStatus({
  subscriptionPlan,
}: SubscriptionStatusProps) {
  const { t } = useLanguage();

  return (
    <Card className="border border-orange-500 rounded-lg">
      <CardHeader>
        <CardTitle className="text-orange-500 font-bold">{t("driver.subscriptionStatus")}</CardTitle>
        <CardDescription>{t("driver.subscriptionStatusDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">{subscriptionPlan.name}</span>
            <Badge>{t("driver.active")}</Badge>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{t("driver.swapsUsed")}</span>
              <span>
                {subscriptionPlan.swapsUsed} / {t("driver.unlimited")}
              </span>
            </div>
            <Progress value={20} className="h-2" />
          </div>
          <div className="flex justify-between text-sm">
            <span>{t("driver.nextBilling")}</span>
            <span>{subscriptionPlan.renewDate}</span>
          </div>
          <Button variant="outline" className="w-full">
            <Settings className="w-4 h-4 mr-2" /> {t("driver.managePlan")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
