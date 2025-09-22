import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Wrench, Calendar, Clock, Download } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface BatteryFleetManagementProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export function BatteryFleetManagement({
  selectedTimeframe,
  onTimeframeChange,
}: BatteryFleetManagementProps) {
  const { t } = useLanguage();

  const stationAllocation = [
    { name: "Downtown Hub", current: 17, total: 20, utilization: 85 },
    { name: "Mall Station", current: 12, total: 15, utilization: 80 },
    { name: "Airport Terminal", current: 20, total: 25, utilization: 80 },
    { name: "Highway Rest Stop", current: 18, total: 20, utilization: 90 },
    { name: "University Campus", current: 10, total: 12, utilization: 83 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {t("admin.batteryFleetManagement")}
        </h2>
        <div className="flex space-x-2">
          <Select value={selectedTimeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t("admin.sevenDays")}</SelectItem>
              <SelectItem value="30">{t("admin.thirtyDays")}</SelectItem>
              <SelectItem value="90">{t("admin.ninetyDays")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> {t("admin.export")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.fleetOverview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>{t("admin.totalBatteries")}:</span>
                <span className="font-medium">263</span>
              </div>
              <div className="flex justify-between">
                <span>{t("admin.healthy")}:</span>
                <span className="font-medium text-green-600">145</span>
              </div>
              <div className="flex justify-between">
                <span>{t("admin.degraded")}:</span>
                <span className="font-medium text-yellow-600">87</span>
              </div>
              <div className="flex justify-between">
                <span>{t("admin.critical")}:</span>
                <span className="font-medium text-red-600">31</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.maintenanceSchedule")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <Wrench className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t("admin.urgentBatteries")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("admin.immediateAttention")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t("admin.thisWeekBatteries")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("admin.scheduledMaintenance")}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t("admin.nextMonthBatteries")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("admin.routineInspection")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.batteryAllocation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stationAllocation.map((station, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{station.name}</span>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={station.utilization}
                      className="w-16 h-2"
                    />
                    <span className="text-sm">
                      {station.current}/{station.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              {t("admin.optimizeAllocation")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
