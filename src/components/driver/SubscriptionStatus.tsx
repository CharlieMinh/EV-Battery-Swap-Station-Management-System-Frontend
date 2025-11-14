import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { AlertTriangle, Calendar, CheckCircle, Package, XCircle, Zap, Car, Ban, Loader2 } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import axios from "axios";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

interface SubscriptionInfo {
  id: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isBlocked: boolean;
  currentMonthSwapCount: number;
  swapsLimit: number | null;
  subscriptionPlan: {
    name: string;
    batteryModelId?: string;
    maxSwapsPerMonth?: number;
  };
  vehicles: {
    id: string;
    plate: string;
    model: string;
  }[] | null;
  vehicleId: string;
  vehicle: {
    id: string;
    plate: string;
    model: string;
  } | null;
}

interface SubscriptionStatusProps {
  subscriptionInfoList: SubscriptionInfo[];
  onRefresh?: () => void;
}

function SubscriptionCard({
  subscriptionInfo,
  onCancel
}: {
  subscriptionInfo: SubscriptionInfo;
  onCancel: () => void;
}) {
  const { t } = useLanguage();

  const getStatus = () => {
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
    if (!dateString || dateString.startsWith("0001-")) return t("driver.subscription.undefinedDate");
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const status = getStatus();

  const swapsUsed = subscriptionInfo.currentMonthSwapCount;
  const swapsLimit = subscriptionInfo.swapsLimit ?? subscriptionInfo.subscriptionPlan?.maxSwapsPerMonth;
  const swapsText = swapsLimit ? `${swapsUsed} / ${swapsLimit}` : `${swapsUsed} / ∞`;

  const vehicle = subscriptionInfo.vehicle || (subscriptionInfo.vehicles && subscriptionInfo.vehicles[0]);

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-bold text-gray-800 tracking-tight text-center">
          {subscriptionInfo.subscriptionPlan.name}
        </CardTitle>

      </CardHeader>

      <CardContent className="space-y-3 p-0">
        {vehicle && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
            <span className="font-semibold text-gray-600 flex items-center">
              {t("driver.subscription.vehiclePlate")}
            </span>
            <span className="font-bold text-base text-gray-900">
              {vehicle.plate}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600">{t("driver.subscription.statusLabel")}</span>
          <Badge className={`text-white ${status.color} hover:${status.color} text-sm py-1 px-3 shadow-md`}>
            {status.icon} {status.text}
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" /> {t("driver.subscription.startDate")}
          </span>
          <span className="font-medium text-gray-800">{formatDate(subscriptionInfo.startDate)}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-red-500" /> {t("driver.subscription.endDate")}
          </span>
          <span className="font-medium text-gray-800">{formatDate(subscriptionInfo.endDate)}</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <span className="font-semibold text-gray-600 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-500" /> {t("driver.subscription.monthlySwaps")}
          </span>
          <span className="font-bold text-lg text-blue-600">{swapsText}</span>
        </div>

        {subscriptionInfo.isActive && (
          <div className="mt-4 pt-4 border-t border-orange-200">
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            >
              <Ban className="w-4 h-4 mr-2" />
              {t("driver.subscription.cancelButton")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export function SubscriptionStatus({ subscriptionInfoList, onRefresh }: SubscriptionStatusProps) {
  const { t } = useLanguage();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelClick = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSubscriptionId) return;

    setIsCancelling(true);
    try {
      const response = await axios.put(
        "http://localhost:5194/api/v1/subscriptions/mine/cancel",
        {},
        { withCredentials: true }
      );

      setShowCancelDialog(false);
      setSelectedSubscriptionId(null);

      await Swal.fire({
        icon: "success",
        title: t("driver.subscription.cancelSuccess"),
        text: response.data.message || t("driver.subscription.cancelSuccessMessage"),
        confirmButtonColor: "#f97316",
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || t("driver.subscription.errorCancelFailed");
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const activeSubscriptions = subscriptionInfoList.filter(sub => sub.isActive);

  if (activeSubscriptions.length === 0) {
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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 mt-8 space-y-6">
      <h2 className="text-3xl font-bold text-center text-gray-800 tracking-tight">
        {t("driver.subscription.title")}
      </h2>

      <div className="grid grid-cols-1 gap-6">
        {activeSubscriptions.map(subInfo => (
          <SubscriptionCard
            key={subInfo.id}
            subscriptionInfo={subInfo}
            onCancel={() => handleCancelClick(subInfo.id)}
          />
        ))}
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {t("driver.subscription.confirmCancelTitle")}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 pt-2">
              {t("driver.subscription.confirmCancelMessage")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-6">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              {t("driver.subscription.buttonKeep")}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("driver.subscription.buttonConfirmCancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}