import {
  fetchStationById,
  fetchBatteryCountByStation,
  type StationDetail,
} from "@/services/admin/stationService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/configs/axios";
import { useLanguage } from "../LanguageContext";
import { Button } from "../ui/button";
import {
  BatteryCharging,
  ArrowLeft,
  MapPin,
} from "lucide-react";

interface StationDetailProps {
  stationId: string;
  onClose: () => void;
}

export function StationDetail({ stationId, onClose }: StationDetailProps) {
  const { t } = useLanguage();
  const [station, setStation] = useState<StationDetail | null>(null);
  const [batteryCount, setBatteryCount] = useState<number>(0);
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
        setError(t("admin.stationNotFound"));
      } finally {
        setLoading(false);
      }
    };
    getStationById();
  }, [stationId]);

  useEffect(() => {
    async function loadBatteryCount() {
      try {
        const count = await fetchBatteryCountByStation(stationId);
        setBatteryCount(count ?? 0);
      } catch (error) {
        console.error("Error fetching battery count:", error);
        setBatteryCount(0);
      }
    }
    if (stationId) {
      loadBatteryCount();
    }
  }, [stationId]);

  const handleBookingClick = async () => {
    try {
      // Gọi API /api/v1/Auth/me để kiểm tra role hiện tại
      const res = await api.get("/api/v1/Auth/me", { withCredentials: true });
      const role = res.data.role;
      if (role === "Driver") {
        navigate("/driver", {
          state: {
            initialSection: "map",
            selectedStation: stationId,
            triggerAction: "setBooking"
          }
        });
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
          {t("admin.loadingData")}
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
    <div className="w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header với gradient */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-200 transition-colors"
          aria-label={t("common.close")}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="pr-10">
          <h3 className="text-xl font-bold mb-2">{station.name}</h3>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span className="text-sm opacity-90">{station.address}</span>
          </div>
        </div>
      </div>

      {/* Content với số pin hiện có */}
      <div className="p-4 space-y-4">
        {/* Current Batteries */}
        <div className="bg-orange-50 p-4 rounded-lg text-center border-2 border-orange-200">
          <BatteryCharging className="text-orange-600 mx-auto mb-2" size={32} />
          <p className="text-sm font-medium text-orange-900 mb-1">{t("admin.currentBatteries")}</p>
          <p className="text-3xl font-bold text-orange-700">{batteryCount}</p>
          <p className="text-xs text-orange-600 mt-1">pin sẵn sàng</p>
        </div>

        {/* Book Button */}
        <Button
          onClick={handleBookingClick}
          className={`w-full font-semibold py-3 rounded-lg shadow-md ${
            batteryCount === 0
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
          disabled={batteryCount === 0}
        >
          {batteryCount === 0 ? "Hết pin" : t("driver.booking.bookNow")}
        </Button>
      </div>
    </div>
  );
}

export default StationDetail;
