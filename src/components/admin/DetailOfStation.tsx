import React, { useEffect } from "react";
import { fetchStationById, Station } from "@/services/admin/stationService";
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
} from "lucide-react";

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
  const [stationDetail, setStationDetail] = React.useState<Station | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

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
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-orange-200">
          <div className="flex items-center space-x-4">
            <MapPin className="w-11 h-11 text-orange-600 shrink-0" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                {stationDetail.name}
              </h1>
              <Badge className={`${statusColor} mt-2 text-sm`}>
                {statusText}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 hover:bg-gray-100"
            >
              <List className="w-4 h-4 mr-2" /> Xem Nhật ký ({logCount})
            </Button>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              <Settings className="w-4 h-4 mr-2" /> Chỉnh sửa cấu hình
            </Button>
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
                {stationDetail.id}
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
              <span className="text-gray-900 text-base">
                {stationDetail.city || "N/A"}
              </span>
            </div>
            <div className="flex items-start space-x-2 col-span-1 sm:col-span-2">
              <MapPin className="w-5 h-5 text-red-500 mt-1 shrink-0" />
              <span className="font-semibold text-gray-700 w-32 shrink-0 mt-1">
                Địa chỉ chi tiết:
              </span>
              <span className="text-gray-900 break-words text-base">
                {address || stationDetail.address || "Đang cập nhật"}
              </span>
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
            value={swaps.toLocaleString()}
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
            value={`${currentBatteries}/${maxBatteries}`}
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
      </div>
    </div>
  );
}

export default DetailOfStation;
