import React from "react";
import { Card, CardContent } from "../ui/card";
import {
  BarChart3,
  DollarSign,
  Clock,
  Users,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { DailyStats } from "../../services/staffApi";

interface StaffDashboardProps {
  dailyStats: DailyStats;
}

export function StaffDashboard({ dailyStats }: StaffDashboardProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 m-6 mb-8">
      <Card className="border border-orange-200 rounded-lg">
        <CardContent className="p-4 text-center">
          <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{dailyStats.totalSwaps}</p>
          <p className="text-sm text-orange-500">{t("staff.todaysSwaps")}</p>
        </CardContent>
      </Card>
      <Card className="border border-orange-200 rounded-lg">
        <CardContent className="p-4 text-center">
          <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">${dailyStats.revenue.toLocaleString()}</p>
          <p className="text-sm text-orange-500">{t("staff.revenue")}</p>
        </CardContent>
      </Card>
      <Card className="border border-orange-200 rounded-lg">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{dailyStats.avgSwapTime.toFixed(2)}m</p>
          <p className="text-sm text-orange-500">{t("staff.avgTime")}</p>
        </CardContent>
      </Card>
      <Card className="border border-orange-200 rounded-lg">
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{dailyStats.customerRating.toFixed(2)}/5</p>
          <p className="text-sm text-orange-500">{t("staff.rating")}</p>
        </CardContent>
      </Card>
      <Card className="border border-orange-200 rounded-lg">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{dailyStats.lowBatteryAlerts}</p>
          <p className="text-sm text-orange-500">{t("staff.lowBattery")}</p>
        </CardContent>
      </Card>
      <Card className="border border-orange-200 rounded-lg">
        <CardContent className="p-4 text-center">
          <Wrench className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{dailyStats.maintenanceNeeded}</p>
          <p className="text-sm text-orange-500">{t("staff.maintenance")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
