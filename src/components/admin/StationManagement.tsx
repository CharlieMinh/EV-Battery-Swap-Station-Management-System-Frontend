import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { MapPin, Filter, Plus, Eye, Edit, Settings } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import {
  countHistoryStationByName,
  fetchStations,
  Station,
} from "@/services/admin/stationService";
import AddStationModal from "./AddStationModal";
import { DetailOfStation } from "./DetailOfStation";

interface StationManagementProps {
  stationPerformance: Station[];
}

export function StationManagement() {
  const { t } = useLanguage();
  const [stationPerformance, setStationPerformance] = useState<Station[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );
  const [swapCounts, setSwapCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Simulate fetching data from an API
    const getAllStations = async () => {
      try {
        const response = await fetchStations(1, 20);
        const stations = response.items;
        setStationPerformance(stations);

        const counts = await Promise.all(
          stations.map(async (station: any) => {
            const res = await countHistoryStationByName(station.name, 1, 20);
            const count = res.length; // ✅ nằm trong scope này
            return { name: station.name, count };
          })
        );

        // Chuyển kết quả thành object dạng { "Trạm A": 5, "Trạm B": 8 }
        const countMap = counts.reduce((acc, cur) => {
          acc[cur.name] = cur.count;
          return acc;
        }, {} as Record<string, number>);

        console.log(countMap);

        setSwapCounts(countMap);
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
            onClick={() => setIsOpen(true)}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> {t("admin.addStation")}
          </Button>

          {isOpen && (
            <>
              <div className="fixed inset-0 backdrop-blur-sm bg-white/10 z-40"></div>

              <AddStationModal
                onClose={() => setIsOpen(false)}
                onSuccess={() => {
                  // Refresh station list after adding a new station
                  fetchStations(1, 20).then((response) => {
                    setStationPerformance(response.items);
                  });
                }}
              />
            </>
          )}
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
                        <span className="font-medium">
                          {swapCounts[station.name] ?? 0}
                        </span>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedStationId(station.id as string)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {selectedStationId && (
                    <DetailOfStation
                      stationId={selectedStationId}
                      onClose={() => setSelectedStationId(null)}
                    />
                  )}
                  {/* <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button> */}
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
