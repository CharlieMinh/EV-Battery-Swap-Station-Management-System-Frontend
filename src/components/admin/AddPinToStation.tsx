import { useEffect, useState } from "react";
import { fetchModelBattery } from "@/services/admin/batteryService";
import { addBatteryToStation } from "@/services/admin/batteryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";

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
  const { t } = useLanguage();
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
        console.error(t("admin.cannotLoadBatteryModels"), error);
        toast.error(t("admin.cannotLoadBatteryModels"));
      }
    };
    loadModels();
  }, [t]);

  const handleChangeQuantity = (modelId: string, value: string) => {
    // Loại bỏ tất cả ký tự không phải số
    const numericValue = value.replace(/[^\d]/g, "");
    // Chỉ cho phép nhập số hoặc xóa hết
    if (numericValue === "" || /^\d+$/.test(numericValue)) {
      // Format ngay với dấu chấm khi nhập
      if (numericValue === "") {
        setQuantities((prev) => ({ ...prev, [modelId]: "" }));
      } else {
        const formatted = Number(numericValue).toLocaleString("vi-VN");
        setQuantities((prev) => ({ ...prev, [modelId]: formatted }));
      }
    }
  };

  const handleAddBatteries = async () => {
    const payload = Object.entries(quantities)
      .filter(([_, qty]) => qty !== "" && qty !== "0")
      .map(([modelId, qty]) => {
        // Parse số từ chuỗi có dấu chấm (loại bỏ dấu chấm trước khi parse)
        const numericValue = qty.replace(/[.\s]/g, "");
        const quantity = parseInt(numericValue);
        return {
          batteryModelId: modelId,
          quantity: quantity,
        };
      })
      .filter((item) => item.quantity > 0);

    if (payload.length === 0) {
      toast.warning(t("admin.enterAtLeastOneBattery"));
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
      toast.success(t("admin.addBatterySuccess"));
      onClose();
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.addBatteryFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-center">{t("admin.addBatteryToStation")}</h2>
      <p className="text-center font-medium">
        {t("admin.stationLabel")}: <span className="text-orange-500">{stationName}</span>
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
          {t("admin.cancel")}
        </Button>
        <Button
          onClick={handleAddBatteries}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-700"
        >
          {loading ? t("admin.adding") : t("admin.addBattery")}
        </Button>
      </div>
    </div>
  );
}
