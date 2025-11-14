import React from "react";
import { geocodeAddress } from "../map/geocode";
import { createStation } from "@/services/admin/stationService";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";

export interface AddStationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddStationModal: React.FC<AddStationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = React.useState({
    name: "",
    address: "",
    city: "",
    isActive: true,
  });

  const [loading, setLoading] = React.useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullAddress = `${formData.address}, ${formData.city}`;
      console.log("🔍 Đang geocode địa chỉ:", fullAddress);

      const coords = await geocodeAddress(fullAddress, formData.city);

      if (!coords) {
        toast.error(t("admin.geocodeError"));
        setLoading(false);
        return;
      }

      console.log("📍 Tọa độ tìm được:", coords);

      const newStation = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        lat: coords.lat,
        lng: coords.lng,
        isActive: formData.isActive,
      };

      await createStation(newStation);
      toast.success(t("admin.addStationSuccess"));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Lỗi khi tạo trạm:", error);
      toast.error(t("admin.addStationError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative animate-fade-in">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {t("admin.addNewStation")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              {t("admin.stationNameLabel")}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              {t("admin.addressLabel")}
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t("admin.addressPlaceholder")}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              {t("admin.cityLabel")}
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder={t("admin.cityPlaceholder")}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white rounded-lg py-2 mt-3 font-medium transition-colors ${
              loading
                ? "bg-orange-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {loading ? t("admin.saving") : t("admin.saveStation")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStationModal;
