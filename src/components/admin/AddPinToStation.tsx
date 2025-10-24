import { useEffect, useState } from "react";
import {
  fetchAllBatteries,
  type Battery,
  addBatteryToStation,
} from "@/services/admin/batteryService";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";

interface AddPinToStationProps {
  stationId: string;
  stationName: string;
  batteryModelName?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPinToStation({
  stationId,
  stationName,
  batteryModelName,
  onClose,
  onSuccess,
}: AddPinToStationProps) {
  const [batteryModels, setBatteryModels] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadBatteries = async () => {
      try {
        const batteries: Battery[] = await fetchAllBatteries();

        // ✅ Lấy danh sách unique mẫu pin từ dữ liệu Battery
        const uniqueModels = Array.from(
          new Map(
            batteries.map((b) => [
              b.batteryModelId,
              { id: b.batteryModelId, name: b.batteryModelName },
            ])
          ).values()
        );

        setBatteryModels(uniqueModels);
      } catch (error) {
        console.error("Không thể tải danh sách pin:", error);
        toast.error("Không thể tải danh sách pin");
      }
    };

    loadBatteries();
  }, []);

  useEffect(() => {
    if (batteryModelName && batteryModels.length > 0) {
      const foundModel = batteryModels.find((m) => m.name === batteryModelName);
      if (foundModel) setSelectedModelId(foundModel.id);
    }
  }, [batteryModelName, batteryModels]);

  const handleAddBattery = async () => {
    if (!selectedModelId) {
      toast.warning("Vui lòng chọn mẫu pin");
      return;
    }

    console.log("Payload gửi lên API:", {
      stationId,
      batteryModelId: selectedModelId,
      quantity,
    });

    setLoading(true);
    try {
      await addBatteryToStation({
        stationId,
        batteryModelId: selectedModelId,
        quantity,
      });

      toast.success("Thêm pin vào trạm thành công!");
      onClose();
    } catch (error) {
      toast.error("Thêm pin thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-center">Thêm pin vào trạm</h2>
      <p className="text-center font-medium">
        Trạm: <span className="text-orange-500">{stationName}</span>
      </p>

      {/* Mẫu pin */}
      <div>
        <label className="block text-sm font-medium mb-2">Mẫu pin</label>
        <Select onValueChange={setSelectedModelId} value={selectedModelId}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn mẫu pin" />
          </SelectTrigger>
          <SelectContent>
            {batteryModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Số lượng */}
      <div>
        <label className="block text-sm font-medium mb-2">Số lượng</label>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        />
      </div>

      {/* Nút hành động */}
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button
          onClick={handleAddBattery}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-700"
        >
          {loading ? "Đang thêm..." : "Thêm pin"}
        </Button>
      </div>
    </div>
  );
}
