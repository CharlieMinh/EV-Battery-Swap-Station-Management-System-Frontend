import React from "react";
import { geocodeAddress } from "../map/geocode";
import { createStation } from "@/services/admin/stationService";
import { X } from "lucide-react";

export interface AddStationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddStationModal: React.FC<AddStationModalProps> = ({
  onClose,
  onSuccess,
}) => {
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
      const coords = await geocodeAddress(fullAddress);

      if (!coords) {
        alert(
          "Không thể lấy tọa độ từ địa chỉ đã nhập. Vui lòng kiểm tra lại."
        );
        setLoading(false);
        return;
      }

      const newStation = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        lat: coords.lat, // 👈 thêm dòng này
        lng: coords.lng, // 👈 thêm dòng này
        isActive: formData.isActive,
      };

      await createStation(newStation);
      alert("Thêm trạm thành công!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating station:", error);
      alert("Đã xảy ra lỗi khi thêm trạm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 flex items-center justify-center p-4">
      {/* Form chính */}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Thêm trạm mới
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Tên trạm
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
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Thành phố
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 mt-3 font-medium transition-colors"
          >
            {loading ? "Đang lưu..." : "Lưu trạm"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddStationModal;
