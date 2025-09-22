import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { RefreshCw, Wrench, FileText, Filter, Plus } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface Battery {
  id: string;
  slot: string;
  status: "full" | "charging" | "maintenance" | "empty";
  health: number;
  voltage: number;
  cycles: number;
  lastSwap: string;
  model: string;
  temperature: number;
}

interface BatteryInventoryProps {
  batteries: Battery[];
  selectedBattery: string | null;
  onBatterySelect: (batteryId: string) => void;
  onNewInspection: () => void;
}

export function BatteryInventory({
  batteries,
  selectedBattery,
  onBatterySelect,
  onNewInspection,
}: BatteryInventoryProps) {
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "full":
        return "bg-green-500";
      case "charging":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-red-500";
      case "empty":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-green-600";
    if (health >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("staff.batteryInventory")}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> {t("staff.filter")}
          </Button>
          <Button size="sm" onClick={onNewInspection}>
            <Plus className="w-4 h-4 mr-2" /> {t("staff.newInspection")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {batteries.map((battery) => (
          <Card
            key={battery.id}
            className={`cursor-pointer transition-colors ${
              selectedBattery === battery.id ? "border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => onBatterySelect(battery.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium">
                    {t("staff.slot")} {battery.slot}
                  </h3>
                  <p className="text-sm text-gray-500">{battery.model}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(
                      battery.status
                    )}`}
                  ></div>
                  <Badge variant="secondary">
                    {t(`staff.${battery.status}`)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t("staff.health")}:</span>
                  <span className={getHealthColor(battery.health)}>
                    {battery.health}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("staff.voltage")}:</span>
                  <span>{battery.voltage}V</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("staff.cycles")}:</span>
                  <span>{battery.cycles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("staff.temperature")}:</span>
                  <span>{battery.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("staff.lastSwap")}:</span>
                  <span>{battery.lastSwap}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <Progress value={battery.health} className="h-2 mb-2" />
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" className="flex-1">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Wrench className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
