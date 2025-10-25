import React, { useEffect, useState } from "react";
import {
  fetchBatteryCountByStation,
  countHistoryStationByName,
  fetchStationById,
  Station,
  updateStation,
  StationDetail,
} from "@/services/admin/stationService";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  X,
  MapPin,
  List,
  Settings,
  Image,
  Zap,
  Clock,
  Phone,
  DollarSign,
  BatteryCharging,
  ArrowLeft,
} from "lucide-react";
import { geocodeAddress } from "../map/geocode";
import { toast } from "react-toastify";
import { StationHistoryList } from "./StationHistoryList";

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white shadow-md border border-orange-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const StatItem: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
}> = ({ icon: Icon, title, value, color }) => (
  <Card className="flex flex-col items-start justify-center p-5 cursor-default">
    <Icon className={`w-7 h-7 ${color} mb-2`} />
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
  </Card>
);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
};

interface DetailOfStationProps {
  stationId: string;
  onClose: () => void;
}

const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return "N/A";
  return timeString.length > 5 ? timeString.substring(0, 5) : timeString;
};

export function DetailOfStation({ stationId, onClose }: DetailOfStationProps) {
  const [stationDetail, setStationDetail] = useState<StationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"info" | "history">("info");

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    lat: 0,
    lng: 0,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const getStationDetails = async () => {
      try {
        const response = await fetchStationById(stationId);
        setStationDetail(response);
      } catch (error) {
        console.error("Error fetching station details:", error);
      } finally {
        setLoading(false);
      }
    };
    getStationDetails();
  }, [stationId]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (isEditing && formData.address && formData.city) {
      const timeout = setTimeout(async () => {
        try {
          const fullAddress = `${formData.address}, ${formData.city}`;
          const coords = await geocodeAddress(fullAddress);
          if (coords) {
            setFormData((prev) => ({
              ...prev,
              lat: coords.lat,
              lng: coords.lng,
            }));
          }
        } catch (error) {
          console.error("Không thể geocode địa chỉ mới:", error);
        }
      }, 800); // debounce tránh spam API
      return () => clearTimeout(timeout);
    }
  }, [formData.address, formData.city, isEditing]);

  const [batteryCount, setBatteryCount] = useState<number | 0>(0);

  useEffect(() => {
    async function loadBatteryCount() {
      const count = await fetchBatteryCountByStation(stationId);
      setBatteryCount(count ?? 0);
    }
    loadBatteryCount();
  }, [stationId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedData = { ...stationDetail, ...formData };
      await updateStation(stationId, updatedData);
      setStationDetail(updatedData as StationDetail);
      setIsEditing(false);
      toast.success("Cập nhật trạm thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật trạm:", error);
      toast.error("Không thể lưu thay đổi, vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  const [swapCounts, setSwapCounts] = useState<number>(0);
  useEffect(() => {
    if (!stationDetail?.name) return;

    const getSwapDetail = async () => {
      try {
        const response = await countHistoryStationByName(
          stationDetail.name,
          1,
          20
        );
        setSwapCounts(response.length);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu đổi pin:", error);
        setSwapCounts(0);
      }
    };
    getSwapDetail();
  }, [stationDetail?.name]);

  if (loading)
    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg text-gray-700">
          Đang tải dữ liệu...
        </div>
      </div>
    );

  if (!stationDetail)
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg text-gray-700">
          Không tìm thấy dữ liệu trạm.
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    );

  const {
    address,
    openTime,
    closeTime,
    phoneNumber,
    swaps = 0,
    revenue = 0,
    currentBatteries = 0,
    maxBatteries = 0,
    logCount = 0,
  } = stationDetail as any;

  const openingTime = formatTime(openTime);
  const closingTime = formatTime(closeTime);

  const statusText = stationDetail.isActive ? "Hoạt động" : "Ngừng hoạt động";
  const statusColor = stationDetail.isActive
    ? "bg-green-500 text-white"
    : "bg-red-500 text-white";

  const handleEditClick = () => {
    if (!stationDetail) return;
    setFormData({
      name: stationDetail?.name || "",
      address: stationDetail?.address || "",
      city: stationDetail?.city || "",
      isActive: stationDetail?.isActive || true,
      lat: stationDetail.coordinates?.lat ?? 0,
      lng: stationDetail.coordinates?.lng ?? 0,
    });
    setIsEditing(true);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/5 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-10 border border-gray-100"
        onClick={handleModalClick}
      >
        {/* 🔘 Nút đóng */}
        <button
          onClick={() => {
            if (mode === "history") {
              setMode("info");
            } else {
              onClose();
            }
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {mode === "info" ? (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-orange-200">
              <div className="flex items-center space-x-4">
                <MapPin className="w-11 h-11 text-orange-600 shrink-0" />
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="text-3xl font-extrabold text-gray-900 border-b-2 border-orange-400 focus:outline-none bg-transparent"
                    />
                  ) : (
                    <h1 className="text-3xl font-extrabold text-gray-900">
                      {stationDetail.name}
                    </h1>
                  )}
                  {isEditing ? (
                    <div className="mt-2">
                      <select
                        value={formData.isActive ? "1" : "0"}
                        onChange={(e) =>
                          handleChange("isActive", e.target.value === "1")
                        }
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                      >
                        <option value="1">Hoạt động</option>
                        <option value="0">Ngừng hoạt động</option>
                      </select>
                    </div>
                  ) : (
                    <Badge
                      className={`${
                        stationDetail.isActive
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      } mt-2 text-sm`}
                    >
                      {stationDetail.isActive ? "Hoạt động" : "Ngừng hoạt động"}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-100"
                  onClick={() => setMode("history")}
                >
                  <List className="w-4 h-4 mr-2" /> Xem Nhật ký ({logCount})
                </Button>
                {!isEditing ? (
                  <Button
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={handleEditClick}
                  >
                    <Settings className="w-4 h-4 mr-2" /> Chỉnh sửa cấu hình
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-100"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: stationDetail.name,
                          address: stationDetail.address,
                          city: stationDetail.city,
                          isActive: stationDetail.isActive,
                          lat: stationDetail.coordinates?.lat,
                          lng: stationDetail.coordinates?.lng,
                        });
                      }}
                    >
                      Hủy thay đổi
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <Card className="mt-8 bg-white border border-orange-100">
              <h2 className="text-2xl font-bold mb-5 text-orange-700 border-b pb-3 border-orange-100">
                Thông tin cơ bản
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 text-sm">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Mã trạm:
                  </span>
                  <span className="text-gray-900 font-mono text-base">
                    {stationDetail.displayId}
                  </span>
                </div>
                <div className="flex items-center space-x-4 whitespace-nowrap">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Thời gian hoạt động:
                  </span>
                  <span className="text-gray-900 text-base">
                    {openingTime} - {closingTime}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-teal-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Số điện thoại:
                  </span>
                  <span className="text-gray-900 text-base">
                    {phoneNumber || "Không có"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Thành phố:
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="border-b border-gray-400 flex-1 focus:outline-none"
                    />
                  ) : (
                    <span className="text-gray-900">{stationDetail.city}</span>
                  )}
                </div>
                <div className="flex items-start space-x-2 col-span-1 sm:col-span-2">
                  <MapPin className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0 mt-1">
                    Địa chỉ chi tiết:
                  </span>
                  {isEditing ? (
                    <input
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="border-b border-gray-400 flex-1 focus:outline-none"
                    />
                  ) : (
                    <span className="text-gray-900 break-words text-base">
                      {stationDetail.address}
                    </span>
                  )}
                </div>
              </div>
            </Card>

            {/* Hiệu suất & Dung lượng */}
            <h2 className="text-2xl font-bold pt-8 text-gray-700 border-b pb-3 border-gray-100">
              Hiệu suất & Dung lượng (Dữ liệu chưa có)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
              <StatItem
                icon={Zap}
                title="Tổng lượt đổi pin"
                value={swapCounts.toLocaleString()}
                color="text-blue-600"
              />
              <StatItem
                icon={DollarSign}
                title="Doanh thu (tháng)"
                value={formatCurrency(revenue)}
                color="text-green-600"
              />
              <StatItem
                icon={BatteryCharging}
                title="Số pin hiện có"
                value={`${batteryCount}`}
                color="text-orange-600"
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-8 border-t mt-10 border-gray-100">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-300 hover:bg-gray-100"
              >
                Đóng
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-3 border-b pb-4 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode("info")}
                className="border-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
              </Button>
              <h2 className="text-2xl font-bold text-gray-800">
                Lịch sử giao dịch – {stationDetail.name}
              </h2>
            </div>
            <StationHistoryList stationName={stationDetail.name} />
          </>
        )}
      </div>
    </div>
  );
}

export default DetailOfStation;
