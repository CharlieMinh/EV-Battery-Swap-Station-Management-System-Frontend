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
    className={`bg-white shadow-xl border border-orange-100 rounded-xl p-6 transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

// Component hiển thị chỉ số thống kê
const StatItem: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
}> = ({ icon: Icon, title, value, color }) => (
  <Card className="flex flex-col items-start p-5 hover:shadow-2xl hover:border-orange-300 cursor-default">
    <Icon className={`w-7 h-7 ${color} mb-2`} />
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
  </Card>
);

// Hàm định dạng tiền tệ
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
  // Cắt bỏ phần giây (ví dụ: "08:00:00" thành "08:00")
  // Nếu chuỗi có độ dài lớn hơn 5 (HH:MM:SS), cắt 5 ký tự đầu tiên
  if (timeString.length > 5) {
    return timeString.substring(0, 5);
  }
  return timeString;
};

export function DetailOfStation({ stationId, onClose }: DetailOfStationProps) {
  const [stationDetail, setStationDetail] = React.useState<Station | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);

  // 🧠 Hàm ngăn sự kiện click trong modal lan ra ngoài
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

  // 🌀 Loading state
  if (loading)
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg text-gray-700">
          Đang tải dữ liệu...
        </div>
      </div>
    );

  // ❌ Không có dữ liệu
  if (!stationDetail)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
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
    // Các trường mới từ API
    address,
    openTime,
    closeTime,
    phoneNumber,
    primaryImageUrl,
    // Giữ lại các trường hiệu suất với giá trị mặc định để tránh lỗi UI
    swaps = 0,
    revenue = 0,
    currentBatteries = 0,
    maxBatteries = 0,
    logCount = 0,
  } = stationDetail as any;

  // Đảm bảo dữ liệu thời gian luôn có giá trị
  const openingTime = formatTime(openTime);
  const closingTime = formatTime(closeTime);

  const statusText = stationDetail.isActive ? "Hoạt động" : "Ngừng hoạt động";
  const statusColor = stationDetail.isActive
    ? "bg-green-500 text-white"
    : "bg-red-500 text-white";

  // ✅ Modal layout chính
  return (
    <div
      className="fixed inset-0 z-50 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform scale-100 transition-transform duration-300"
        onClick={handleModalClick}
      >
        {/* 🔘 Nút đóng */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-orange-700 transition-colors z-10 p-2 bg-white rounded-full shadow-lg border border-gray-100"
          onClick={onClose}
          aria-label="Đóng modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 📄 Nội dung chi tiết */}
        <div className="space-y-8 p-6 sm:p-10 md:p-12">
          {/* Header và Nút Hành động */}
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
            {/* Các nút hành động */}
            <div className="flex space-x-3 mt-4 sm:mt-0 shrink-0">
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

          {/* HÌNH ẢNH VÀ THÔNG TIN CƠ BẢN */}
          <div>
            {/* Cột 1: Hình ảnh */}
            {/* <div className="md:col-span-1">
              <Card className="p-0 overflow-hidden h-full">
                {primaryImageUrl ? (
                  <img
                    src={primaryImageUrl}
                    alt={`Ảnh trạm ${stationDetail.name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).onerror = null;
                      (
                        e.target as HTMLImageElement
                      ).src = `https://placehold.co/400x300/fec89a/333?text=Không+có+ảnh+trạm`;
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-40 bg-gray-200 text-gray-500 p-4">
                    <Image className="w-8 h-8 mb-2" />
                    <span>Chưa có ảnh chính</span>
                  </div>
                )}
              </Card>
            </div> */}

            {/* Cột 2 & 3: Thông tin chi tiết */}
            <Card className="md:col-span-2 p-8 bg-gray-50 border-gray-200">
              <h2 className="text-2xl font-bold mb-5 text-orange-700 border-b-2 border-orange-100 pb-3">
                Thông tin cơ bản
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 text-sm">
                {/* Mã Trạm */}
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Mã trạm:
                  </span>
                  <span className="text-gray-900 font-mono text-base">
                    {stationDetail.id}
                  </span>
                </div>

                {/* Thời gian hoạt động */}
                <div className="flex items-center space-x-4 whitespace-nowrap">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Thời gian hoạt động:
                  </span>
                  <span className="text-gray-900 text-base">
                    {openingTime} - {closingTime}
                  </span>
                </div>

                {/* Số điện thoại */}
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-teal-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Số điện thoại:
                  </span>
                  <span className="text-gray-900 text-base">
                    {phoneNumber || "Không có"}
                  </span>
                </div>

                {/* Thành phố */}
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-gray-700 w-32 shrink-0">
                    Thành phố:
                  </span>
                  <span className="text-gray-900 text-base">
                    {stationDetail.city || "N/A"}
                  </span>
                </div>

                {/* Địa điểm (Address) */}
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
          </div>

          {/* Các chỉ số hiệu suất (Dùng giá trị 0 vì API mới không có) */}
          <h2 className="text-2xl font-bold pt-2 text-gray-700 border-b-2 border-gray-100 pb-3">
            Hiệu suất & Dung lượng (Dữ liệu chưa có)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="flex justify-end pt-6 border-t border-gray-100">
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
    </div>
  );
}

export default DetailOfStation;
