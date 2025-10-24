import React, { useEffect, useMemo, useState } from "react";
import { fetchAllBatteries, Battery } from "@/services/admin/batteryService";
import {
  fetchModelBattery,
  BatteryModel,
} from "@/services/admin/batteryService";
import { fetchStations } from "@/services/admin/stationService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

interface BatteryStationTableProps {
  onDataUpdate?: () => void; // callback khi dữ liệu thay đổi
}

export function BatteryStationTable({
  onDataUpdate,
}: BatteryStationTableProps) {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [models, setModels] = useState<BatteryModel[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [openModal, setOpenModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [batteriesData, modelsData, stationsData] = await Promise.all([
        fetchAllBatteries(),
        fetchModelBattery(),
        fetchStations(1, 1000), // ví dụ lấy page 1, pageSize lớn để lấy tất cả
      ]);

      setBatteries(batteriesData);
      setModels(modelsData);
      setStations(stationsData.items); // mappedItems trong fetchStations
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc pin theo model
  const filtered = useMemo(() => {
    if (selectedModel === "all") return batteries;
    return batteries.filter((b) => b.batteryModelName === selectedModel);
  }, [batteries, selectedModel]);

  // Gom nhóm theo trạm dựa trên stations
  const stationStats = useMemo(() => {
    return stations.map((s) => {
      const pins = filtered.filter((b) => b.stationId === s.id);
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
  }, [stations, filtered]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải dữ liệu...
      </div>
    );

  return (
    <>
      <Card className="mt-6 shadow-md border border-orange-200 w-full">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold text-orange-500">
            🔋 Thông tin pin các trạm
          </CardTitle>

          <div className="mt-3 sm:mt-0">
            <Select onValueChange={setSelectedModel} defaultValue="all">
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
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
              Không có dữ liệu trạm nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-3 text-left">Trạm</th>
                    <th className="p-3 text-center">Tổng pin</th>
                    <th className="p-3 text-center">Đang sử dụng</th>
                    <th className="p-3 text-center">Đang sạc</th>
                    <th className="p-3 text-center">Đã sẵn sàng</th>
                    <th className="p-3 text-center">Bảo trì</th>
                    <th className="p-3 text-center">Đặt trước</th>
                    <th className="p-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {stationStats.map((s, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-3">{s.stationName}</td>
                      <td className="p-3 text-center font-medium">{s.total}</td>
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
                          Cung cấp pin
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogOverlay className="bg-white/50 backdrop-blur-md fixed inset-0" />
        <DialogContent
          className="max-w-lg bg-white/90 backdrop-blur-md border border-orange-200 shadow-xl rounded-2xl"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Thêm pin vào trạm</DialogTitle>
          <AddPinToStation
            stationId={selectedStation?.stationId}
            stationName={selectedStation?.stationName}
            // batteryModelName={selectedModel === "all" ? null : selectedModel}
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
