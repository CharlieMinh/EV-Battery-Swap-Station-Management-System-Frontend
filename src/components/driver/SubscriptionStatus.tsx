import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, Calendar, CheckCircle, Package, XCircle, Zap, Car } from "lucide-react"; // Thêm icon Car
import { useLanguage } from "../LanguageContext";

// ✅ SỬA LẠI INTERFACE: Thêm thông tin xe và swapsLimit
interface SubscriptionInfo {
  id: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isBlocked: boolean;
  currentMonthSwapCount: number;
  swapsLimit: number | null; // Dùng trường này (từ API /mine/all)
  subscriptionPlan: {
    name: string;
    maxSwapsPerMonth?: number; // Trường này có thể vẫn dùng dự phòng
  };
  // Thêm thông tin xe (dựa trên DTO /mine/all)
  vehicles: {
    id: string;
    plate: string;
    model: string;
  }[] | null; // Cho phép mảng vehicles
  vehicleId: string; // Hoặc dùng vehicleId nếu BE trả về
  vehicle: { // Hoặc dùng vehicle (số ít) nếu BE trả về
    id: string;
    plate: string;
    model: string;
  } | null;
}

// ✅ SỬA LẠI PROPS: Nhận một danh sách
interface SubscriptionStatusProps {
  subscriptionInfoList: SubscriptionInfo[]; // Nhận toàn bộ danh sách
}

// Hàm helper để render 1 card gói thuê
function SubscriptionCard({ subscriptionInfo }: { subscriptionInfo: SubscriptionInfo }) {
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
    // Mặc định là inactive nếu không active và không hết hạn (ví dụ: chờ thanh toán)
    return { text: t("driver.subscription.status.inactive"), color: "bg-gray-500", icon: <Package className="w-4 h-4 mr-2" /> };
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString || dateString.startsWith("0001-")) return t("driver.subscription.undefinedDate");
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const status = getStatus();

  // ✅ SỬA LẠI LOGIC HIỂN THỊ LƯỢT ĐỔI
  const swapsUsed = subscriptionInfo.currentMonthSwapCount;
  // Lấy giới hạn từ swapsLimit (ưu tiên) hoặc từ plan
  const swapsLimit = subscriptionInfo.swapsLimit ?? subscriptionInfo.subscriptionPlan?.maxSwapsPerMonth;
  const swapsText = swapsLimit ? `${swapsUsed} / ${swapsLimit}` : `${swapsUsed} / ∞`; // Hiển thị ∞ nếu không có giới hạn

  // Lấy thông tin xe (ưu tiên vehicle, rồi vehicles[0])
  const vehicle = subscriptionInfo.vehicle || (subscriptionInfo.vehicles && subscriptionInfo.vehicles[0]);

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl font-bold text-gray-800 tracking-tight text-center">
          {subscriptionInfo.subscriptionPlan.name}
        </CardTitle>

      </CardHeader>

      <CardContent className="space-y-3 p-0">
        {/* ✅ THÊM THÔNG TIN XE */}
        {vehicle && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
            <span className="font-semibold text-gray-600 flex items-center">
              Biển số xe:
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
          {/* ✅ SỬA LẠI HIỂN THỊ LƯỢT ĐỔI */}
          <span className="font-bold text-lg text-blue-600">{swapsText}</span>
        </div>
      </CardContent>
    </Card>
  );
}


// ✅ SỬA LẠI COMPONENT CHÍNH
export function SubscriptionStatus({ subscriptionInfoList }: SubscriptionStatusProps) {
  const { t } = useLanguage();

  // Lọc ra chỉ các gói đang active
  const activeSubscriptions = subscriptionInfoList.filter(sub => sub.isActive);

  if (activeSubscriptions.length === 0) {
    // Nếu không có gói nào active (giữ lại giao diện cũ)
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

  // Nếu có gói active, lặp và render danh sách Card
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16 mt-8 space-y-6">
      <h2 className="text-3xl font-bold text-center text-gray-800 tracking-tight">
        {t("driver.subscription.title")}
      </h2>

      {/* Tạo lưới cho các Card gói thuê */}
      <div className="grid grid-cols-1 gap-6">
        {activeSubscriptions.map(subInfo => (
          <SubscriptionCard key={subInfo.id} subscriptionInfo={subInfo} />
        ))}
      </div>
    </div>
  );
}