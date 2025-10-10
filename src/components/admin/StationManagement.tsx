import React, { useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { MapPin, Filter, Plus, Eye, Edit, Settings } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { fetchStations } from "@/services/stationService";
import { Station } from "@/services/stationService";

interface StationManagementProps {
  stationPerformance: Station[];
}

export function StationManagement() {
  const { t } = useLanguage();
  const [stationPerformance, setStationPerformance] = React.useState<Station[]>(
    []
  );

  useEffect(() => {
    // Simulate fetching data from an API
    const getAllStations = async () => {
      try {
        const response = await fetchStations(1, 20);
        setStationPerformance(response.items);
        console.log("Fetched stations:", response.items);
      } catch (error) {
        console.error("Error fetching stations:", error);
        throw error;
      }
    };
    getAllStations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-orange-500 font-bold">
          {t("admin.stationManagement")}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> {t("admin.filter")}
          </Button>
          <Button
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> {t("admin.addStation")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {stationPerformance.map((station, index) => (
          <Card key={index}>
            <CardContent className="p-6 border border-orange-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                    <Badge
                      className={
                        station.isActive === true
                          ? "bg-green-400 text-white"
                          : "bg-red-500 text-white "
                      }
                    >
                      {t(`admin.${station.isActive}`)}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-lg text-orange-500 font-medium">
                      {station.name}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">
                          {t("admin.swaps")}:{" "}
                        </span>
                        {/* <span className="font-medium">{station.swaps}</span> */}
                      </div>
                      <div>
                        <span className="text-gray-500">
                          {t("admin.revenue")}:{" "}
                        </span>
                        {/* <span className="font-medium">
                          ${station.revenue.toLocaleString()}
                        </span> */}
                      </div>
                      <div>
                        <span className="text-gray-500">Số pin: </span>
                        <span className="font-medium">17/20</span>
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
              {/* <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>{t("admin.utilization")}</span>
                  <span>{station.utilization}%</span>
                </div>
                <Progress
                  value={station.utilization}
                  className="h-2 bg-orange-100 [&>div]:bg-orange-500 rounded-full"
                />
              </div> */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
