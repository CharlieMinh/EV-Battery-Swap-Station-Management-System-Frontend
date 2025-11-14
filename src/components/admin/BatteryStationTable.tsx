import React, { useEffect, useMemo, useState } from "react";
import { fetchAllBatteries, Battery } from "@/services/admin/batteryService";
import {
  fetchModelBattery,
  BatteryModel,
} from "@/services/admin/batteryService";
import { fetchStations } from "@/services/admin/stationService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddPinToStation } from "./AddPinToStation";
import { useLanguage } from "../LanguageContext";

interface BatteryStationTableProps {
  onDataUpdate?: () => void;
}

export function BatteryStationTable({
  onDataUpdate,
}: BatteryStationTableProps) {
  const { t } = useLanguage();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [models, setModels] = useState<BatteryModel[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [openModal, setOpenModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);

  // Phân trang
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [pageSize] = useState(10);

  // Filter theo tên
  const [filterText, setFilterText] = useState("");

  const filteredStationsByName = useMemo(() => {
    return stations.filter((s) =>
      s.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [stations, filterText]);

  const totalPages = Math.ceil(filteredStationsByName.length / pageSize);

  // Đồng bộ inputPage với page khi page thay đổi
  useEffect(() => {
    setInputPage(page);
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batteriesData, modelsData, stationsData] = await Promise.all([
        fetchAllBatteries(),
        fetchModelBattery(),
        fetchStations(1, 1000),
      ]);

      setBatteries(batteriesData);
      setModels(modelsData);
      setStations(stationsData.items);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBatteries = useMemo(() => {
    if (selectedModel === "all") return batteries;
    return batteries.filter((b) => b.batteryModelName === selectedModel);
  }, [batteries, selectedModel]);

  const stationStats = useMemo(() => {
    return filteredStationsByName.map((s) => {
      const pins = filteredBatteries.filter((b) => b.stationId === s.id);
      return {
        stationId: s.id,
        stationName: s.name,
        total: pins.length,
        inUse: pins.filter((b) => b.status === "InUse").length,
        charging: pins.filter((b) => b.status === "Charging").length,
        full: pins.filter((b) => b.status === "Full").length,
        maintenance: pins.filter((b) => b.status === "Maintenance").length,
        reserved: pins.filter((b) => b.status === "Reserved").length,
      };
    });
  }, [filteredStationsByName, filteredBatteries]);

  const paginatedStations = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return stationStats.slice(start, end);
  }, [stationStats, page, pageSize]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        {t("admin.loadingData")}
      </div>
    );

  return (
    <>
      <Card className="mt-6 shadow-md border border-orange-200 w-full">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold text-orange-500">
            {t("admin.batteryStationInfo")}
          </CardTitle>

          <div className="mt-3 sm:mt-0 flex items-center space-x-2">
            <Input
              type="text"
              placeholder={t("admin.searchByStationName")}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-56"
            />

            <Select onValueChange={setSelectedModel} defaultValue="all">
              <SelectTrigger className="w-56">
                <SelectValue placeholder={t("admin.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.all")}</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {stationStats.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              {t("admin.noStationData")}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3 text-left">{t("admin.stationLabel")}</th>
                      <th className="p-3 text-center">{t("admin.totalBatteries")}</th>
                      <th className="p-3 text-center">{t("admin.inUse")}</th>
                      <th className="p-3 text-center">{t("admin.charging")}</th>
                      <th className="p-3 text-center">{t("admin.ready")}</th>
                      <th className="p-3 text-center">{t("admin.maintenance")}</th>
                      <th className="p-3 text-center">{t("admin.reserved")}</th>
                      <th className="p-3 text-center">{t("admin.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStations.map((s, idx) => (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="p-3">{s.stationName}</td>
                        <td className="p-3 text-center font-medium">
                          {s.total}
                        </td>
                        <td className="p-3 text-center text-blue-600">
                          {s.inUse}
                        </td>
                        <td className="p-3 text-center text-teal-600">
                          {s.charging}
                        </td>
                        <td className="p-3 text-center text-green-600">
                          {s.full}
                        </td>
                        <td className="p-3 text-center text-red-600">
                          {s.maintenance}
                        </td>
                        <td className="p-3 text-center text-yellow-600">
                          {s.reserved}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStation(s);
                              setOpenModal(true);
                            }}
                          >
                            {t("admin.providePin")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
                    value={inputPage}
                    onChange={(e) => setInputPage(e.target.valueAsNumber)}
                    onBlur={() => {
                      let newPage = inputPage;
                      if (isNaN(newPage) || newPage < 1) newPage = 1;
                      if (newPage > totalPages) newPage = totalPages;
                      setPage(newPage);
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
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogOverlay className="bg-white/50 backdrop-blur-md fixed inset-0" />
        <DialogContent
          className="max-w-lg bg-white/90 backdrop-blur-md border border-orange-200 shadow-xl rounded-2xl"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{t("admin.addBatteryToStation")}</DialogTitle>
          <AddPinToStation
            stationId={selectedStation?.stationId}
            stationName={selectedStation?.stationName}
            onClose={() => setOpenModal(false)}
            onSuccess={() => {
              loadData();
              onDataUpdate?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
