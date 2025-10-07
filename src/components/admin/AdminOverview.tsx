import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, Activity, Users, Gauge } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface RevenueData {
  month: string;
  revenue: number;
  swaps: number;
  growth: number;
}

interface BatteryHealth {
  range: string;
  count: number;
  color: string;
}

interface KPIData {
  avgSwapTime: number;
  systemUptime: number;
  customerSatisfaction: number;
  batteryEfficiency: number;
}

interface AdminOverviewProps {
  revenueData: RevenueData[];
  batteryHealth: BatteryHealth[];
  kpiData: KPIData;
}

export function AdminOverview({
  revenueData,
  batteryHealth,
  kpiData,
}: AdminOverviewProps) {
  const { t } = useLanguage();

  const pieData = batteryHealth.map((b) => ({
    name: b.range,
    value: b.count,
    color: b.color,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-orange-200 rounded-lg">
          <CardHeader>
            <CardTitle className="text-orange-600">
              {t("admin.revenueTrends")}
            </CardTitle>
            <CardDescription>{t("admin.revenueTrendsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) => `$${value.toLocaleString("en-US")}`}
                />
                <Tooltip
                  formatter={(value) => [
                    `$${(value as number).toLocaleString("en-US")}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="#dbeafe"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 rounded-lg">
          <CardHeader>
            <CardTitle className="text-orange-600">
              {t("admin.batteryHealthDistribution")}
            </CardTitle>
            <CardDescription>
              {t("admin.batteryHealthDistributionDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="count"
                >
                  {batteryHealth.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {batteryHealth.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm">
                    {entry.range}: {entry.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center border border-orange-200 rounded-lg">
            <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-lg font-bold">{kpiData.avgSwapTime}min</p>
            <p className="text-sm text-gray-500">{t("admin.avgSwapTime")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center border border-orange-200 rounded-lg">
            <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-bold">{kpiData.systemUptime}%</p>
            <p className="text-sm text-gray-500">{t("admin.systemUptime")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center border border-orange-200 rounded-lg">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-lg font-bold">
              {kpiData.customerSatisfaction}/5
            </p>
            <p className="text-sm text-gray-500">{t("admin.customerRating")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center border border-orange-200 rounded-lg">
            <Gauge className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-lg font-bold">{kpiData.batteryEfficiency}%</p>
            <p className="text-sm text-gray-500">
              {t("admin.batteryEfficiency")}
            </p>
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
