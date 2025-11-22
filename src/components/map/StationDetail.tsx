import {
  fetchStationById,
  type StationDetail,
} from "@/services/admin/stationService";
import { countBatteriesByStation } from "@/services/batteryPublicService";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/configs/axios";
import { useLanguage } from "../LanguageContext";
import { Button } from "../ui/button";
import {
  BatteryCharging,
  ArrowLeft,
  MapPin,
  AlertCircle,
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
        // Sử dụng API public mới - Chỉ đếm pin có status = "Full" (sẵn sàng)
        const count = await countBatteriesByStation(stationId, {
          status: "Full"
        });
        setBatteryCount(count);
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
        {/* Current Batteries - UI cải tiến */}
        <div className={`p-5 rounded-xl text-center border-2 transition-all duration-300 ${
          batteryCount === 0
            ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300"
            : batteryCount <= 3
            ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300"
            : "bg-gradient-to-br from-green-50 to-green-100 border-green-300"
        }`}>
          <div className="flex justify-center mb-3">
            <div className={`p-3 rounded-full ${
              batteryCount === 0
                ? "bg-red-100"
                : batteryCount <= 3
                ? "bg-yellow-100"
                : "bg-green-100"
            }`}>
              <BatteryCharging 
                className={`${
                  batteryCount === 0
                    ? "text-red-600"
                    : batteryCount <= 3
                    ? "text-yellow-600"
                    : "text-green-600"
                }`} 
                size={36} 
              />
            </div>
          </div>
          <p className="text-sm font-semibold mb-2 text-gray-700">
            {t("admin.currentBatteries")}
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <p className={`text-4xl font-bold ${
              batteryCount === 0
                ? "text-red-700"
                : batteryCount <= 3
                ? "text-yellow-700"
                : "text-green-700"
            }`}>
              {batteryCount}
            </p>
            <span className={`text-sm font-medium ${
              batteryCount === 0
                ? "text-red-600"
                : batteryCount <= 3
                ? "text-yellow-600"
                : "text-green-600"
            }`}>
              pin
            </span>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            {batteryCount === 0 ? (
              <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                Hết pin
              </span>
            ) : batteryCount <= 3 ? (
              <span className="text-xs font-medium text-yellow-600 flex items-center gap-1">
                <AlertCircle size={14} />
                Số lượng thấp
              </span>
            ) : (
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                ✓ Sẵn sàng
              </span>
            )}
          </div>
        </div>

        {/* Book Button - Cải tiến */}
        <Button
          onClick={handleBookingClick}
          className={`w-full font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 ${
            batteryCount === 0
              ? "bg-gray-400 cursor-not-allowed text-white hover:bg-gray-400"
              : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transform hover:scale-[1.02] active:scale-[0.98]"
          }`}
          disabled={batteryCount === 0}
        >
          {batteryCount === 0 ? (
            <span className="flex items-center justify-center gap-2">
              <AlertCircle size={18} />
              Hết pin - Không thể đặt lịch
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <BatteryCharging size={18} />
              {t("driver.booking.bookNow")}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

export default StationDetail;
