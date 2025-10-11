import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RefreshCw, Wrench, FileText, Filter, Plus, Battery, Layers, AlertTriangle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Battery as BatteryType } from "../../services/staffApi";

interface BatteryInventoryProps {
  batteries: BatteryType[];
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
  const [filterBy, setFilterBy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("slot");

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

  // Phân loại theo dung lượng
  const getCapacityCategory = (health: number) => {
    if (health >= 90) return "high";
    if (health >= 70) return "medium";
    if (health >= 50) return "low";
    return "critical";
  };

  // Phân loại theo model
  const getModelCategory = (model: string) => {
    if (model.includes("Tesla")) return "tesla";
    if (model.includes("BYD")) return "byd";
    if (model.includes("VinFast")) return "vinfast";
    return "other";
  };

  // Phân loại theo tình trạng
  const getConditionCategory = (battery: BatteryType) => {
    if (battery.status === "maintenance") return "maintenance";
    if (battery.health < 50) return "critical";
    if (battery.temperature > 45) return "overheated";
    if (battery.cycles > 1000) return "aged";
    return "good";
  };

  // Lọc và sắp xếp pin
  const filteredAndSortedBatteries = useMemo(() => {
    let filtered = batteries;

    // Lọc theo dung lượng
    if (filterBy === "capacity-high") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "high");
    } else if (filterBy === "capacity-medium") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "medium");
    } else if (filterBy === "capacity-low") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "low");
    } else if (filterBy === "capacity-critical") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "critical");
    }
    // Lọc theo model
    else if (filterBy === "model-tesla") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "tesla");
    } else if (filterBy === "model-byd") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "byd");
    } else if (filterBy === "model-vinfast") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "vinfast");
    } else if (filterBy === "model-other") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "other");
    }
    // Lọc theo tình trạng
    else if (filterBy === "condition-maintenance") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "maintenance");
    } else if (filterBy === "condition-critical") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "critical");
    } else if (filterBy === "condition-overheated") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "overheated");
    } else if (filterBy === "condition-aged") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "aged");
    } else if (filterBy === "condition-good") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "good");
    }

    // Sắp xếp
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "health":
          return b.health - a.health;
        case "cycles":
          return b.cycles - a.cycles;
        case "temperature":
          return b.temperature - a.temperature;
        case "voltage":
          return b.voltage - a.voltage;
        case "model":
          return a.model.localeCompare(b.model);
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return a.slot.localeCompare(b.slot);
      }
    });
  }, [batteries, filterBy, sortBy]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = batteries.length;
    const highCapacity = batteries.filter(b => getCapacityCategory(b.health) === "high").length;
    const mediumCapacity = batteries.filter(b => getCapacityCategory(b.health) === "medium").length;
    const lowCapacity = batteries.filter(b => getCapacityCategory(b.health) === "low").length;
    const criticalCapacity = batteries.filter(b => getCapacityCategory(b.health) === "critical").length;
    
    const teslaCount = batteries.filter(b => getModelCategory(b.model) === "tesla").length;
    const bydCount = batteries.filter(b => getModelCategory(b.model) === "byd").length;
    const vinfastCount = batteries.filter(b => getModelCategory(b.model) === "vinfast").length;
    const otherCount = batteries.filter(b => getModelCategory(b.model) === "other").length;

    const maintenanceCount = batteries.filter(b => getConditionCategory(b) === "maintenance").length;
    const criticalCount = batteries.filter(b => getConditionCategory(b) === "critical").length;
    const overheatedCount = batteries.filter(b => getConditionCategory(b) === "overheated").length;
    const agedCount = batteries.filter(b => getConditionCategory(b) === "aged").length;
    const goodCount = batteries.filter(b => getConditionCategory(b) === "good").length;

    return {
      total,
      capacity: { highCapacity, mediumCapacity, lowCapacity, criticalCapacity },
      models: { teslaCount, bydCount, vinfastCount, otherCount },
      conditions: { maintenanceCount, criticalCount, overheatedCount, agedCount, goodCount }
    };
  }, [batteries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border border-orange-200 rounded-lg bg-gray-50 p-4 mb-2">
        <h2 className="text-2xl font-bold text-orange-600">
          {t("staff.batteryInventory")}
        </h2>
        <div className="flex space-x-2">
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg border-none" onClick={onNewInspection}>
            <Plus className="w-4 h-4 mr-2 text-white" /> {t("staff.newInspection")}
          </Button>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thống kê theo dung lượng */}
        <Card className="border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Battery className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-800">Phân loại theo dung lượng</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Cao (≥90%):</span>
                <span className="font-medium">{stats.capacity.highCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Trung bình (70-89%):</span>
                <span className="font-medium">{stats.capacity.mediumCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Thấp (50-69%):</span>
                <span className="font-medium">{stats.capacity.lowCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Nguy hiểm (&lt;50%):</span>
                <span className="font-medium">{stats.capacity.criticalCapacity}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê theo model */}
        <Card className="border border-green-200 rounded-lg bg-green-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Layers className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-green-800">Phân loại theo model</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Tesla:</span>
                <span className="font-medium">{stats.models.teslaCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">BYD:</span>
                <span className="font-medium">{stats.models.bydCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">VinFast:</span>
                <span className="font-medium">{stats.models.vinfastCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Khác:</span>
                <span className="font-medium">{stats.models.otherCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê theo tình trạng */}
        <Card className="border border-red-200 rounded-lg bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="font-semibold text-red-800">Phân loại theo tình trạng</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Tốt:</span>
                <span className="font-medium">{stats.conditions.goodCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Cũ (&gt;1000 chu kỳ):</span>
                <span className="font-medium">{stats.conditions.agedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Quá nóng (&gt;45°C):</span>
                <span className="font-medium">{stats.conditions.overheatedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Nguy hiểm:</span>
                <span className="font-medium">{stats.conditions.criticalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bảo trì:</span>
                <span className="font-medium">{stats.conditions.maintenanceCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bộ lọc và sắp xếp */}
      <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
            </div>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn tiêu chí lọc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ({stats.total})</SelectItem>
                <SelectItem value="capacity-high">Dung lượng cao ({stats.capacity.highCapacity})</SelectItem>
                <SelectItem value="capacity-medium">Dung lượng trung bình ({stats.capacity.mediumCapacity})</SelectItem>
                <SelectItem value="capacity-low">Dung lượng thấp ({stats.capacity.lowCapacity})</SelectItem>
                <SelectItem value="capacity-critical">Dung lượng nguy hiểm ({stats.capacity.criticalCapacity})</SelectItem>
                <SelectItem value="model-tesla">Model Tesla ({stats.models.teslaCount})</SelectItem>
                <SelectItem value="model-byd">Model BYD ({stats.models.bydCount})</SelectItem>
                <SelectItem value="model-vinfast">Model VinFast ({stats.models.vinfastCount})</SelectItem>
                <SelectItem value="model-other">Model khác ({stats.models.otherCount})</SelectItem>
                <SelectItem value="condition-good">Tình trạng tốt ({stats.conditions.goodCount})</SelectItem>
                <SelectItem value="condition-aged">Pin cũ ({stats.conditions.agedCount})</SelectItem>
                <SelectItem value="condition-overheated">Quá nóng ({stats.conditions.overheatedCount})</SelectItem>
                <SelectItem value="condition-critical">Nguy hiểm ({stats.conditions.criticalCount})</SelectItem>
                <SelectItem value="condition-maintenance">Bảo trì ({stats.conditions.maintenanceCount})</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slot">Slot</SelectItem>
                <SelectItem value="health">Dung lượng</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="status">Trạng thái</SelectItem>
                <SelectItem value="cycles">Chu kỳ</SelectItem>
                <SelectItem value="temperature">Nhiệt độ</SelectItem>
                <SelectItem value="voltage">Điện áp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách pin đã lọc */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedBatteries.map((battery) => {
          const capacityCategory = getCapacityCategory(battery.health);
          const modelCategory = getModelCategory(battery.model);
          const conditionCategory = getConditionCategory(battery);
          
          return (
            <Card
              key={battery.id}
              className={`border border-orange-200 rounded-lg bg-white shadow-sm cursor-pointer transition-colors ${
                selectedBattery === battery.id ? "border-blue-500 bg-blue-50" : ""
              } ${
                conditionCategory === "critical" ? "border-red-300 bg-red-50" :
                conditionCategory === "overheated" ? "border-orange-300 bg-orange-50" :
                conditionCategory === "aged" ? "border-yellow-300 bg-yellow-50" :
                conditionCategory === "maintenance" ? "border-gray-300 bg-gray-50" :
                ""
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
                    <div className="flex space-x-1 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          capacityCategory === "high" ? "bg-green-100 text-green-700" :
                          capacityCategory === "medium" ? "bg-yellow-100 text-yellow-700" :
                          capacityCategory === "low" ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}
                      >
                        {capacityCategory === "high" ? "Cao" :
                         capacityCategory === "medium" ? "TB" :
                         capacityCategory === "low" ? "Thấp" : "Nguy hiểm"}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          modelCategory === "tesla" ? "bg-blue-100 text-blue-700" :
                          modelCategory === "byd" ? "bg-green-100 text-green-700" :
                          modelCategory === "vinfast" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {modelCategory === "tesla" ? "Tesla" :
                         modelCategory === "byd" ? "BYD" :
                         modelCategory === "vinfast" ? "VinFast" : "Khác"}
                      </Badge>
                      {conditionCategory !== "good" && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            conditionCategory === "aged" ? "bg-yellow-100 text-yellow-700" :
                            conditionCategory === "overheated" ? "bg-orange-100 text-orange-700" :
                            conditionCategory === "critical" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {conditionCategory === "aged" ? "Cũ" :
                           conditionCategory === "overheated" ? "Nóng" :
                           conditionCategory === "critical" ? "Nguy hiểm" :
                           "Bảo trì"}
                        </Badge>
                      )}
                    </div>
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
                    <span className={battery.temperature > 45 ? "text-red-600 font-medium" : ""}>
                      {battery.temperature}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.lastSwap")}:</span>
                    <span>{battery.lastSwap}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <Progress 
                    value={battery.health} 
                    className={`h-2 mb-2 ${
                      capacityCategory === "high" ? "bg-green-100 [&>div]:bg-green-500" :
                      capacityCategory === "medium" ? "bg-yellow-100 [&>div]:bg-yellow-500" :
                      capacityCategory === "low" ? "bg-orange-100 [&>div]:bg-orange-500" :
                      "bg-red-100 [&>div]:bg-red-500"
                    }`} 
                  />
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
          );
        })}
      </div>
    </div>
  );
}
