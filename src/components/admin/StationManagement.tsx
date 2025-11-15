import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { MapPin, Filter, Plus, Eye } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import {
  fetchBatteryCountByStation,
  countHistoryStationById,
  fetchStations,
  Station,
} from "@/services/admin/stationService";
import AddStationModal from "./AddStationModal";
import { DetailOfStation } from "./DetailOfStation";

export function StationManagement() {
  const { t } = useLanguage();

  const [stationPerformance, setStationPerformance] = useState<Station[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );
  const [swapCounts, setSwapCounts] = useState<Record<string, number>>({});
  const [batteryCount, setBatteryCount] = useState<Record<string, number>>({});

  // 🧭 Phân trang
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // 🧡 Filter
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");

  // 🔄 Lấy danh sách trạm
  useEffect(() => {
    const getStations = async () => {
      try {
        const response = await fetchStations(page, pageSize);
        const stations = response.items;
        setStationPerformance(stations);
        setTotalPages(response.totalPages || 1);

        // Đếm số lượt đổi pin
        const counts = await Promise.all(
          stations.map(async (station: any) => {
            const transactions = await countHistoryStationById(
              station.id,
              1,
              20
            );
            return { id: station.id, count: transactions };
          })
        );

        const countMap = counts.reduce((acc, cur) => {
          acc[cur.id] = cur.count;
          return acc;
        }, {} as Record<string, number>);
        setSwapCounts(countMap);

        // Đếm số pin
        const batteryCounts: Record<string, number> = {};
        await Promise.all(
          stations.map(async (station: any) => {
            const count = await fetchBatteryCountByStation(station.id);
            batteryCounts[station.id] = count ?? 0;
          })
        );
        setBatteryCount(batteryCounts);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };

    getStations();
  }, [page, pageSize]);

  // Lọc theo tên
  const filteredStations = stationPerformance.filter((station) =>
    station.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-orange-500 font-bold">
          {t("admin.stationManagement")}
        </h2>
        <div className="flex space-x-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="w-4 h-4 mr-2" /> {t("admin.filter")}
          </Button>

          {showFilter && (
            <Input
              type="text"
              placeholder={t("admin.enterStationName")}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-48"
            />
          )}

          <Button
            onClick={() => setIsOpen(true)}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> {t("admin.addStation")}
          </Button>

          {isOpen && (
            <>
              <div className="fixed inset-0 bg-black/40 z-40"></div>
              <AddStationModal
                onClose={() => setIsOpen(false)}
                onSuccess={() => {
                  fetchStations(page, pageSize).then((response) => {
                    setStationPerformance(response.items);
                    setTotalPages(response.totalPages || 1);
                  });
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Danh sách trạm */}
      <div className="grid gap-4">
        {filteredStations.length === 0 ? (
          <p className="text-gray-500 italic text-center py-6">
            {t("admin.noMatchingStations")}
          </p>
        ) : (
          filteredStations.map((station) => (
            <Card key={station.id}>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-1" />
                      <Badge
                        className={
                          station.isActive
                            ? "bg-green-400 text-white"
                            : "bg-red-500 text-white"
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
                            {swapCounts[station.id] ?? 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            {t("admin.revenue")}:{" "}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t("admin.batteryCount")}</span>
                          <span className="font-medium">
                            {batteryCount[station.id] ?? 0}
                          </span>
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
                    {selectedStationId === station.id && (
                      <DetailOfStation
                        stationId={selectedStationId}
                        onClose={() => setSelectedStationId(null)}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Phân trang */}
      <div className="flex justify-center items-center space-x-3 mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("admin.prev")}
        </Button>

        <div className="flex items-center space-x-1">
          <span className="text-gray-700 text-sm">{t("admin.page")}</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => {
              const newPage = Number(e.target.value);
              if (newPage >= 1 && newPage <= totalPages) {
                setPage(newPage);
              }
            }}
            className="w-16 text-center text-sm"
          />
          <span className="text-gray-700 text-sm">/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("admin.next")}
        </Button>
      </div>
    </div>
  );
}
