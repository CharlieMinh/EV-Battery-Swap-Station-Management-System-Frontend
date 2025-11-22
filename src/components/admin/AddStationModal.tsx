import React from "react";
import { geocodeAddress } from "../map/geocode";
import { createStation } from "@/services/admin/stationService";
import { X, Loader2 } from "lucide-react";
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

    const name = formData.name.trim();
    const address = formData.address.trim();
    const city = formData.city.trim();

    // Validate tên trạm: bắt buộc và 1–100 ký tự
    if (!name || name.length < 1 || name.length > 100) {
      toast.error(t("admin.stationNameLengthHint"));
      return;
    }

    // Validate thành phố: bắt buộc
    if (!city) {
      toast.error(t("admin.cityRequired"));
      return;
    }

    // Validate địa chỉ & thành phố: giới hạn 1–256 ký tự
    if (
      !address ||
      address.length < 1 ||
      address.length > 256 ||
      city.length < 1 ||
      city.length > 256
    ) {
      toast.error(t("admin.addressLengthHint"));
      return;
    }

    setLoading(true);

    try {
      const fullAddress = `${address}, ${city}`;
      console.log("🔍 Đang geocode địa chỉ:", fullAddress);

      const coords = await geocodeAddress(fullAddress, city);

      if (!coords) {
        toast.error(t("admin.addressLengthHint"));
        setLoading(false);
        return;
      }

      console.log("📍 Tọa độ tìm được:", coords);

      const newStation = {
        name,
        address,
        city,
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
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-gray-600 text-sm">{t("admin.saving")}</p>
            </div>
          </div>
        )}
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
              maxLength={256}
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
              maxLength={256}
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
              maxLength={256}
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
