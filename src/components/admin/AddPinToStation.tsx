import { useEffect, useState } from "react";
import { fetchModelBattery } from "@/services/admin/batteryService";
import { addBatteryToStation } from "@/services/admin/batteryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";

interface AddPinToStationProps {
  stationId: string;
  stationName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPinToStation({
  stationId,
  stationName,
  onClose,
  onSuccess,
}: AddPinToStationProps) {
  const [batteryModels, setBatteryModels] = useState<
    { id: string; name: string }[]
  >([]);
  const [quantities, setQuantities] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await fetchModelBattery();
        const formatted = models.map((m) => ({ id: m.id, name: m.name }));
        setBatteryModels(formatted);

        // Khởi tạo số lượng mặc định = ''
        const initQuantities: { [key: string]: string } = {};
        formatted.forEach((m) => {
          initQuantities[m.id] = "";
        });
        setQuantities(initQuantities);
      } catch (error) {
        console.error("Không thể tải danh sách mẫu pin:", error);
        toast.error("Không thể tải danh sách mẫu pin");
      }
    };
    loadModels();
  }, []);

  const handleChangeQuantity = (modelId: string, value: string) => {
    // Chỉ cho phép nhập số hoặc xóa hết
    if (/^\d*$/.test(value)) {
      setQuantities((prev) => ({ ...prev, [modelId]: value }));
    }
  };

  const handleAddBatteries = async () => {
    const payload = Object.entries(quantities)
      .filter(([_, qty]) => qty !== "" && parseInt(qty) > 0)
      .map(([modelId, qty]) => ({
        batteryModelId: modelId,
        quantity: parseInt(qty),
      }));

    if (payload.length === 0) {
      toast.warning("Vui lòng nhập số lượng cho ít nhất một loại pin");
      return;
    }

    setLoading(true);
    try {
      for (const item of payload) {
        await addBatteryToStation({
          stationId,
          batteryModelId: item.batteryModelId,
          quantity: item.quantity,
        });
      }
      toast.success("Thêm pin vào trạm thành công!");
      onClose();
      onSuccess();
    } catch (error) {
      console.error(error);
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

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {batteryModels.map((model) => (
          <div key={model.id} className="flex items-center justify-between">
            <span className="font-medium">{model.name}</span>
            <Input
              type="text"
              value={quantities[model.id]}
              onChange={(e) => handleChangeQuantity(model.id, e.target.value)}
              className="w-24"
              placeholder="0"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button
          onClick={handleAddBatteries}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-700"
        >
          {loading ? "Đang thêm..." : "Thêm pin"}
        </Button>
      </div>
    </div>
  );
}
