import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { MapPin, Filter, Plus, Eye, Edit, Settings } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface Station {
  name: string;
  swaps: number;
  revenue: number;
  utilization: number;
  status: "active" | "maintenance";
}

interface StationManagementProps {
  stationPerformance: Station[];
}

export function StationManagement({
  stationPerformance,
}: StationManagementProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("admin.stationManagement")}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> {t("admin.filter")}
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" /> {t("admin.addStation")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {stationPerformance.map((station, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                    <Badge
                      variant={
                        station.status === "active" ? "default" : "destructive"
                      }
                    >
                      {t(`admin.${station.status}`)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{station.name}</h3>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">
                          {t("admin.swaps")}:{" "}
                        </span>
                        <span className="font-medium">{station.swaps}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          {t("admin.revenue")}:{" "}
                        </span>
                        <span className="font-medium">
                          ${station.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">
                          {t("admin.utilization")}:{" "}
                        </span>
                        <span className="font-medium">
                          {station.utilization}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{t("admin.utilization")}</span>
                  <span>{station.utilization}%</span>
                </div>
                <Progress value={station.utilization} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
