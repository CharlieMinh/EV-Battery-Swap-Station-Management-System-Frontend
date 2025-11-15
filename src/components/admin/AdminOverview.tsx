import { useEffect, useState } from "react";
import { getMonthlyRevenue } from "@/services/admin/payment";
import { useLanguage } from "../LanguageContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Pie,
  Cell,
  PieChart,
} from "recharts";
import { fetchAllBatteries } from "@/services/admin/batteryService";

interface RevenueMonth {
  month: string; // "YYYY-MM"
  revenue: number;
}

export function AdminOverview() {
  const { t } = useLanguage();
  const [revenueData, setRevenueData] = useState<RevenueMonth[]>([]);

  useEffect(() => {
    async function fetchRevenue() {
      const data = await getMonthlyRevenue(); // API trả về [{month: "YYYY-MM", revenue: number}, ...]

      const monthNames = [
        "Tháng 1",
        "Tháng 2",
        "Tháng 3",
        "Tháng 4",
        "Tháng 5",
        "Tháng 6",
        "Tháng 7",
        "Tháng 8",
        "Tháng 9",
        "Tháng 10",
        "Tháng 11",
        "Tháng 12",
      ];

      const currentYear = new Date().getFullYear();

      // Tạo object map để dễ lookup
      const revenueMap: Record<number, number> = {};
      data.forEach((d) => {
        const date = new Date(d.month);
        if (date.getFullYear() === currentYear) {
          revenueMap[date.getMonth()] = d.revenue;
        }
      });

      // Tạo mảng đầy đủ 12 tháng, nếu không có dữ liệu = 0
      const fullData = monthNames.map((name, index) => ({
        month: name,
        revenue: revenueMap[index] || 0,
      }));

      setRevenueData(fullData);
    }

    fetchRevenue();
  }, []);

  const [batteryData, setBatteryData] = useState<
    { name: string; count: number; color: string }[]
  >([]);
  const [batteryTotal, setBatteryTotal] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const allBatteries = await fetchAllBatteries();

        // Đếm số lượng pin theo batteryModelName
        const modelCount: Record<string, number> = {};
        allBatteries.forEach((b) => {
          modelCount[b.batteryModelName] =
            (modelCount[b.batteryModelName] || 0) + 1;
        });

        // Gán màu ngẫu nhiên hoặc theo danh sách cố định
        const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

        const pieData = Object.entries(modelCount).map(
          ([name, count], index) => ({
            name,
            count,
            color: colors[index % colors.length],
          })
        );

        setBatteryData(pieData);
        setBatteryTotal(allBatteries.length);
      } catch (error) {
        console.error("Error loading battery data:", error);
      }
    }
    loadData();
  }, []);

  const totalRevenueThisYear = revenueData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const totalModels = batteryData.length;

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white/90">
          <CardHeader>
            <CardTitle className="text-slate-900">
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
                  width={90}
                  tickFormatter={(value) =>
                    value.toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    })
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    (value as number).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }),
                    "Doanh thu",
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

        <Card className="rounded-3xl border border-slate-100 shadow-sm bg-white/90">
          <CardHeader>
            <CardTitle className="text-slate-900">
              {t("admin.totalStationBatteries") || "Tổng pin các trạm"}
            </CardTitle>
            <CardDescription>
              {t("admin.totalStationBatteriesDesc") ||
                "Biểu đồ thể hiện tổng số lượng pin tại tất cả các trạm"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={batteryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={(entry) => entry.name}
                >
                  {batteryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} pin`, "Số lượng"]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-2 mt-4">
              {batteryData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm">
                    {entry.name}: {entry.count} pin
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
