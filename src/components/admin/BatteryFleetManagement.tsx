import React, { useEffect, useState, useMemo } from "react";
import { fetchAllBatteries, Battery } from "@/services/admin/batteryService";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { BatteryStationTable } from "./BatteryStationTable";
import AdminPendingRequests from "./AddPendingRequest";
import { useLanguage } from "../LanguageContext";

// Màu đại diện cho từng trạng thái pin
const STATUS_COLORS: Record<string, string> = {
  Full: "#4CAF50",
  Reserved: "#FFC107",
  InUse: "#2196F3",
  Charging: "#00BCD4",
  Depleted: "#9E9E9E",
  Maintenance: "#F44336",
};

// Danh sách trạng thái chuẩn
const ALL_STATUSES = [
  "Full",
  "Reserved",
  "InUse",
  "Charging",
  "Depleted",
  "Maintenance",
];

export function BatteryFleetManagement() {
  const { t } = useLanguage();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const loadData = async () => {
    try {
      const data = await fetchAllBatteries();
      setBatteries(data);
    } catch (err) {
      console.error("Failed to fetch battery data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reloadTrigger]);

  const handleReload = () => setReloadTrigger((prev) => prev + 1);

  const BATTERY_STATUS_VN: Record<string, string> = {
    Full: t("admin.batteryStatusReady"),
    Reserved: t("admin.batteryStatusReserved"),
    InUse: t("admin.batteryStatusInUse"),
    Charging: t("admin.batteryStatusCharging"),
    Depleted: t("admin.batteryStatusDepleted"),
    Maintenance: t("admin.batteryStatusMaintenance"),
  };

  const statusSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    batteries.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });

    return ALL_STATUSES.map((status) => ({
      name: status,
      value: counts[status] || 0,
      color: STATUS_COLORS[status] || "#999",
    }));
  }, [batteries]);

  // Biểu đồ chỉ hiển thị trạng thái có value > 0
  const chartData = useMemo(
    () => statusSummary.filter((item) => item.value > 0),
    [statusSummary]
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">{t("admin.loadingBatteries")}</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Biểu đồ tổng quan bộ pin */}
        <Card className="shadow-md border border-orange-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-orange-500">
              {t("admin.batteryFleetOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={({ name, value }) =>
                        `${
                          BATTERY_STATUS_VN[name as string] || name
                        } (${value.toLocaleString("vi-VN")})`
                      }
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        typeof value === 'number' ? value.toLocaleString("vi-VN") : value,
                        BATTERY_STATUS_VN[name as string] || name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {t("admin.noBatteryData")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Thông tin chi tiết trạng thái */}
        <Card className="shadow-md border border-orange-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-orange-500">
              {t("admin.batteryStatusDetail")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusSummary.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="font-medium">
                      {BATTERY_STATUS_VN[item.name] || item.name}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {item.value.toLocaleString("vi-VN")} {t("admin.batteryUnit")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminPendingRequests />

      <div className="col-span-full">
        <BatteryStationTable onDataUpdate={handleReload} />
      </div>
    </div>
  );
}
