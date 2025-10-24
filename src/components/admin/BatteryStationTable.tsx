import React, { useEffect, useMemo, useState } from "react";
import { fetchAllBatteries, Battery } from "@/services/admin/batteryService";
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
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddPinToStation } from "./AddPinToStation";

export function BatteryStationTable() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [openModal, setOpenModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  );

  const loadData = async () => {
    try {
      const data = await fetchAllBatteries();
      setBatteries(data);
    } catch (err) {
      console.error("Failed to fetch batteries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Danh sách model duy nhất
  const modelOptions = useMemo(() => {
    return Array.from(new Set(batteries.map((b) => b.batteryModelName)));
  }, [batteries]);

  // Lọc theo model nếu có chọn
  const filtered = useMemo(() => {
    if (selectedModel === "all") return batteries;
    return batteries.filter((b) => b.batteryModelName === selectedModel);
  }, [batteries, selectedModel]);

  // Gom nhóm theo trạm
  const stationStats = useMemo(() => {
    const map = new Map<
      string,
      {
        stationId: string;
        stationName: string;
        total: number;
        inUse: number;
        charging: number;
        full: number;
        maintenance: number;
        reserved: number;
      }
    >();

    filtered.forEach((b) => {
      if (!map.has(b.stationId)) {
        map.set(b.stationId, {
          stationId: b.stationId,
          stationName: b.stationName,
          total: 0,
          inUse: 0,
          charging: 0,
          full: 0,
          maintenance: 0,
          reserved: 0,
        });
      }
      const station = map.get(b.stationId)!;
      station.total += 1;
      if (b.status === "InUse") station.inUse++;
      if (b.status === "Charging") station.charging++;
      if (b.status === "Full") station.full++;
      if (b.status === "Maintenance") station.maintenance++;
      if (b.status === "Reserved") station.reserved++;
    });

    return Array.from(map.values());
  }, [filtered]);

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

          {/* Bộ lọc model */}
          <div className="mt-3 sm:mt-0">
            <Select
              onValueChange={(val) => setSelectedModel(val)}
              defaultValue="all"
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {modelOptions.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
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
        {/* 🌫️ Nền mờ nhẹ */}
        <DialogOverlay className="bg-white/50 backdrop-blur-md fixed inset-0" />

        <DialogContent
          className="max-w-lg bg-white/90 backdrop-blur-md border border-orange-200 shadow-xl rounded-2xl"
          aria-describedby={undefined}
        >
          {/* 🧭 Tiêu đề ẩn (để không báo lỗi a11y nữa) */}
          <DialogTitle className="sr-only">Thêm pin vào trạm</DialogTitle>

          {/* 🧩 Nội dung form */}
          <AddPinToStation
            stationId={selectedStation?.stationId}
            stationName={selectedStation?.stationName}
            batteryModelName={selectedModel === "all" ? null : selectedModel}
            onClose={() => setOpenModal(false)}
            onSuccess={loadData}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
