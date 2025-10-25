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
  const { t, formatCurrency } = useLanguage();

  // Gom dữ liệu thống kê vào mảng để dễ quản lý và mở rộng
  const stats = [
    {
      icon: BarChart3,
      value: dailyStats.totalSwaps,
      label: t("staff.todaysSwaps"),
      iconColor: "text-blue-500",
    },
    {
      icon: DollarSign,
      value: formatCurrency(dailyStats.revenue),
      label: t("staff.revenue"),
      iconColor: "text-green-500",
    },
    {
      icon: Clock,
      value: `${dailyStats.avgSwapTime.toFixed(2)}m`,
      label: t("staff.avgTime"),
      iconColor: "text-purple-500",
    },
    {
      icon: Users,
      value: `${dailyStats.customerRating.toFixed(2)}/5`,
      label: t("staff.rating"),
      iconColor: "text-orange-500",
    },
    {
      icon: AlertTriangle,
      value: dailyStats.lowBatteryAlerts,
      label: t("staff.lowBattery"),
      iconColor: "text-yellow-500",
    },
    {
      icon: Wrench,
      value: dailyStats.maintenanceNeeded,
      label: t("staff.maintenance"),
      iconColor: "text-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 m-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="border border-orange-200 rounded-lg hover:shadow-md transition-all duration-300"
          >
            <CardContent className="p-4 text-center">
              <Icon className={`w-8 h-8 ${stat.iconColor} mx-auto mb-2`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-orange-500">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
