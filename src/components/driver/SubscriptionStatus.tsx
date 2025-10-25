import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, Calendar, CheckCircle, Package, XCircle, Zap } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface SubscriptionInfo {
  id: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isBlocked: boolean;
  currentMonthSwapCount: number;
  subscriptionPlan: {
    name: string;
    maxSwapsPerMonth?: number;
  };
}
interface MonthlyUsage {
  year: number;
  month: number;
  swapCount: number;
}

interface SubscriptionStatusProps {
  subscriptionInfo: SubscriptionInfo | null;
  currentMonthSwapCount?: number;
}

export function SubscriptionStatus({
  subscriptionInfo, currentMonthSwapCount
}: SubscriptionStatusProps) {
  const { t } = useLanguage();

  const getStatus = () => {
    if (!subscriptionInfo) {
      return { text: t("driver.subscription.status.noPlan"), color: "bg-gray-500", icon: <Package className="w-4 h-4 mr-2" /> };
    }
    if (subscriptionInfo.isBlocked) {
      return { text: t("driver.subscription.status.blocked"), color: "bg-red-600", icon: <AlertTriangle className="w-4 h-4 mr-2" /> };
    }
    if (subscriptionInfo.isActive) {
      return { text: t("driver.subscription.status.active"), color: "bg-green-600", icon: <CheckCircle className="w-4 h-4 mr-2" /> };
    }
    if (subscriptionInfo.endDate && new Date(subscriptionInfo.endDate) < new Date()) {
      return { text: t("driver.subscription.status.expired"), color: "bg-yellow-600", icon: <XCircle className="w-4 h-4 mr-2" /> };
    }
    return { text: t("driver.subscription.status.inactive"), color: "bg-gray-500", icon: <Package className="w-4 h-4 mr-2" /> };
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t("driver.subscription.undefinedDate");
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const status = getStatus();

  if (!subscriptionInfo) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-16 mt-8">
        <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-800 tracking-tight">
              {t("driver.subscription.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center text-gray-600">
            <p>{t("driver.subscription.noSubscriptionMessage")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 lg:px-16 mt-8">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-gray-800 tracking-tight">
            {t("driver.subscription.title")}
          </CardTitle>
          <CardDescription className="text-center text-gray-500 pt-2">
            {t("driver.subscription.description")}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
            <span className="font-semibold text-gray-600">{t("driver.subscription.planName")}</span>
            <span className="font-bold text-lg text-orange-600">
              {subscriptionInfo.subscriptionPlan.name}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
            <span className="font-semibold text-gray-600">{t("driver.subscription.statusLabel")}</span>
            <Badge className={`text-white ${status.color} hover:${status.color} text-base py-2 px-4 shadow-md`}>
              {status.icon} {status.text}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
            <span className="font-semibold text-gray-600 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" /> {t("driver.subscription.startDate")}
            </span>
            <span className="font-medium text-gray-800">{formatDate(subscriptionInfo.startDate)}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
            <span className="font-semibold text-gray-600 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-red-500" /> {t("driver.subscription.endDate")}
            </span>
            <span className="font-medium text-gray-800">{formatDate(subscriptionInfo.endDate)}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm">
            <span className="font-semibold text-gray-600 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" /> {t("driver.subscription.monthlySwaps")}
            </span>
            <span className="font-bold text-lg text-blue-600">{currentMonthSwapCount}/{subscriptionInfo.subscriptionPlan.maxSwapsPerMonth}</span>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}