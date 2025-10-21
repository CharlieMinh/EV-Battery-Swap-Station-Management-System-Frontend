import {
  fetchStationById,
  type StationDetail,
} from "@/services/admin/stationService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/configs/axios";

interface StationDetailProps {
  stationId: string;
  onClose: () => void;
}

export function StationDetail({ stationId, onClose }: StationDetailProps) {
  const [station, setStation] = useState<StationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getStationById = async () => {
      try {
        setLoading(true);
        const data = await fetchStationById(stationId);
        setStation(data);
      } catch (err) {
        console.error(err);
        setError("Không thể tải thông tin trạm");
      } finally {
        setLoading(false);
      }
    };
    getStationById();
  }, [stationId]);

  const handleBookingClick = async () => {
    try {
      // Gọi API /api/v1/Auth/me để kiểm tra role hiện tại
      const res = await api.get("/api/v1/Auth/me", { withCredentials: true });
      const role = res.data.role;

      if (role === "Driver") {
        navigate("/driver");
      } else {
        navigate("/login");
      }
    } catch (err) {
      // Nếu lỗi 401 hoặc không có token thì chuyển sang login
      console.warn("Không xác thực được người dùng, chuyển hướng đến login.");
      navigate("/login");
    }
  };

  if (loading)
    return (
      <div className="p-4 bg-white shadow-lg rounded-lg max-w-sm relative">
        <p className="text-gray-500 animate-pulse">
          Đang tải thông tin trạm...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="p-4 bg-white shadow-lg rounded-lg max-w-sm text-red-500 relative">
        {error}
      </div>
    );

  if (!station) return null;

  return (
    <div className="p-4 bg-white shadow-lg rounded-lg w-full max-w-md relative">
      {/* Nút đóng */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 font-bold text-xl"
      >
        ×
      </button>

      {/* Ảnh */}
      {station.primaryImageUrl && (
        <img
          src={station.primaryImageUrl}
          alt={station.name}
          className="w-full h-60 object-cover rounded-md mb-4"
        />
      )}

      {/* Tên trạm */}
      <h2 className="text-2xl font-bold mb-2">{station.name}</h2>

      {/* Địa chỉ */}
      <p className="text-gray-700 mb-2">{station.address}</p>

      {/* Giờ mở cửa */}
      <p className="text-gray-500 mb-2">
        Giờ hoạt động: {station.openTime} - {station.closeTime}
      </p>

      {/* Trạng thái mở cửa */}
      <p
        className={`font-semibold mb-4 ${
          station.isOpenNow ? "text-green-600" : "text-red-600"
        }`}
      >
        {station.isOpenNow ? "Đang mở cửa" : "Đã đóng cửa"}
      </p>

      {/* Nút Đặt lịch */}
      <button
        onClick={handleBookingClick}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
      >
        Đặt lịch
      </button>
    </div>
  );
}

export default StationDetail;
