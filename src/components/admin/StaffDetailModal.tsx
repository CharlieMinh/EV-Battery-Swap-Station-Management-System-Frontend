import {
  fetchStaffById,
  Staff,
  StaffDetails,
} from "@/services/admin/staffAdminService";
import { useEffect, useState } from "react";
import { useLanguage } from "../LanguageContext";
import {
  Loader2,
  User,
  Mail,
  Smartphone,
  Zap,
  Calendar,
  Clock,
  Edit,
  X,
  BarChart,
  Truck,
  Save,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { tr } from "date-fns/locale";
import {
  updateUser,
  UpdateUserPayload,
} from "@/services/admin/customerAdminService";
import { toast } from "react-toastify";
import { set } from "date-fns";
import { fetchStations } from "@/services/admin/stationService";

const StatItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 py-4 px-3 flex flex-col items-center text-center cursor-default">
    <Icon className={`w-6 h-6 ${color} mb-3`} />
    <p className="text-sm text-gray-500 font-medium leading-tight mb-3">
      {label}
    </p>
    <p className="text-xl font-bold text-gray-900 mt-0.5 leading-tight">
      {value}
    </p>
  </div>
);

const formatDateTime = (isoString: any) => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    // Format: DD/MM/YYYY HH:MM:SS
    const datePart = date.toLocaleDateString("vi-VN");
    const timePart = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `${datePart} ${timePart}`;
  } catch {
    return "Invalid Date";
  }
};

const getRoleNumber = (role: string | number): number => {
  if (typeof role === "number") return role;
  switch (role) {
    case "Driver":
      return 0;
    case "Staff":
      return 1;
    case "Admin":
      return 2;
    default:
      return parseInt(role) || 0;
  }
};

const getRoleText = (role: string | number): string => {
  const roleNum = typeof role === "number" ? role : getRoleNumber(role);
  switch (roleNum) {
    case 0:
      return "Tài xế";
    case 1:
      return "Nhân viên";
    case 2:
      return "Quản lý";
    default:
      return "N/A";
  }
};

const formatNumber = (num: any) => (num ? num.toLocaleString("vi-VN") : "0");

interface StaffDetailModalProps {
  staff: Staff | null;
  onClose: () => void;
}

const StaffDetailModal = ({ staff, onClose }: StaffDetailModalProps) => {
  const { t } = useLanguage();
  const [staffDetail, setStaffDetail] = useState<StaffDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    role: "0",
    profilePicture: "",
    status: "0",
    stationId: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!staff || !staff.id) return;

    const getStaffById = async () => {
      setLoading(true);
      setStaffDetail(null);

      try {
        const data = await fetchStaffById(staff.id);
        setStaffDetail(data);

        const roleValue = getRoleNumber(data.role || "0").toString();
        const statusValue =
          data.status === "Active" || data.status === "0" ? "0" : "1";
        setFormData({
          name: data.name || "",
          phoneNumber: data.phoneNumber || "",
          role: roleValue,
          profilePicture: data.profilePicture || "",
          status: statusValue,
          stationId: data.stationId || "",
        });
      } catch (error) {
        console.error("Error fetching staff detail:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    };
    getStaffById();
  }, [staff, onClose]);

  const handleSave = async () => {
    if (!staffDetail) return;

    try {
      setLoading(true);
      const payload: UpdateUserPayload = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        profilePicture: formData.profilePicture,
        status: formData.status,
        stationId: formData.stationId,
      };
      const updateStaff = await updateUser(staffDetail.id, payload);
      toast.success(t("admin.updateSuccess"));
      setStaffDetail({
        ...staffDetail,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        profilePicture: formData.profilePicture,
        role: getRoleText(formData.role),
        status: formData.status === "0" ? "Active" : "Inactive",
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
    setIsEditing(false);
  };

  const [stations, setStations] = useState<any[]>([]);
  useEffect(() => {
    async function getStationList() {
      try {
        const stationList = await fetchStations(1, 20);
        setStations(stationList.items || stationList);
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
    getStationList();
  }, []);

  if (!staff) return;

  if (loading || !staffDetail) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-10 shadow-2xl flex flex-col items-center justify-center w-full max-w-sm">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-4" />
          <p className="text-gray-700 font-medium">
            {t("admin.loadingDetails")}
          </p>
        </div>
      </div>
    );
  }

  const getDisplayValue = (key: string) => {
    switch (key) {
      case "name":
        return formData.name || staffDetail.name;
      case "phoneNumber":
        return formData.phoneNumber || staffDetail.phoneNumber;
      case "role":
        return getRoleText(formData.role);
      case "profilePicture":
        return formData.profilePicture || staffDetail.profilePicture;
      case "status":
        return formData.status === "0" ? "Đang hoạt động" : "Ngừng hoạt động";
      default:
        return "";
    }
  };

  const data = [
    {
      key: "name",
      icon: User,
      label: t("admin.name"),
      value: getDisplayValue("name"),
      editable: true,
    },
    {
      key: "email",
      icon: Mail,
      label: t("admin.email"),
      value: staffDetail.email,
    },
    {
      key: "phoneNumber",
      icon: Smartphone,
      label: t("admin.phone"),
      value: getDisplayValue("phoneNumber"),
      editable: true,
    },
    {
      key: "role",
      icon: Zap,
      label: t("admin.role"),
      value: getDisplayValue("role"),
      editable: true,
    },
    {
      key: "status",
      icon: Zap,
      label: t("admin.status"),
      value: getDisplayValue("status"),
      editable: true,
    },
    {
      icon: Calendar,
      label: t("admin.createdAt"),
      value: formatDateTime(staffDetail.createdAt),
    },
    {
      key: "stationId",
      icon: Truck,
      label: t("admin.station"),
      value:
        stations.find((s) => s.id === formData.stationId)?.name ||
        "Chưa có trạm",
      editable: true,
    },
    {
      icon: Clock,
      label: t("admin.lastLogin"),
      value: formatDateTime(staffDetail.lastLogin),
    },
  ];
  const handleClose = () => {
    if (isEditing) {
      // Reset form và tắt chế độ chỉnh sửa trước khi đóng
      setFormData({
        name: staffDetail?.name || "",
        phoneNumber: staffDetail?.phoneNumber || "",
        role:
          staffDetail?.role === "Driver"
            ? "0"
            : staffDetail?.role === "Staff"
            ? "1"
            : "2",
        profilePicture: staffDetail?.profilePicture,
        status: staffDetail?.status === "Active" ? "0" : "1",
        stationId: staffDetail?.stationId || "",
      });

      // Đặt lại isEditing rồi mới đóng modal
      setIsEditing(false);

      // Đợi 1 tick để React cập nhật state trước khi unmount modal
      setTimeout(() => {
        onClose();
      }, 0);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-9 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-orange-200">
          <div className="flex items-center space-x-4">
            <User className="w-11 h-11 text-orange-600 shrink-0" />
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                {staffDetail.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{staffDetail.email}</p>
            </div>
          </div>

          <div className="flex space-x-3 mt-4 sm:mt-0">
            {!isEditing ? (
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" /> {t("admin.updateProfile")}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" /> {t("admin.saveChanges")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: staffDetail.name || "",
                      phoneNumber: staffDetail.phoneNumber || "",
                      role:
                        staffDetail.role === "Driver"
                          ? "0"
                          : staffDetail.role === "Staff"
                          ? "1"
                          : "2",
                      profilePicture: staffDetail.profilePicture,
                      status: staffDetail.status === "Active" ? "0" : "1",
                      stationId: staffDetail.stationId || "",
                    });
                  }}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Hủy thay đổi
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Thông tin cơ bản */}
        <Card className="mt-8 bg-white border border-orange-100 shadow-md p-6">
          <h2 className="text-2xl font-bold mb-5 text-orange-700 border-b pb-3 border-orange-100">
            {t("admin.personalInfo")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5 text-sm">
            {data.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <item.icon className="w-5 h-5 text-gray-500" />
                {isEditing && item.editable ? (
                  item.key === "role" ? (
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="border rounded-md p-1 text-gray-700"
                    >
                      <option value={"0"}>Tài xế</option>
                      <option value={"1"}>Nhân viên</option>
                      <option value={"2"}>Quản lý</option>
                    </select>
                  ) : item.key === "status" ? (
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="border rounded-md p-1 text-gray-700"
                    >
                      <option value={"0"}>Đang hoạt động</option>
                      <option value={"1"}>Ngừng hoạt động</option>
                    </select>
                  ) : item.key === "stationId" ? (
                    <select
                      value={formData.stationId}
                      onChange={(e) =>
                        setFormData({ ...formData, stationId: e.target.value })
                      }
                      className="border rounded-md p-1 text-gray-700 w-full"
                    >
                      <option value="">Chọn trạm</option>
                      {stations.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={(formData as any)[item.key] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [item.key]: e.target.value,
                        })
                      }
                      className="border rounded-md p-1 text-gray-700 w-full"
                    />
                  )
                ) : (
                  <p>
                    <span className="font-semibold text-sm mr-2">
                      {item.label}:
                    </span>
                    <span className="font-medium">{item.value}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Hiệu suất */}
        <h2 className="text-2xl font-bold pt-8 text-gray-700 border-b pb-3 border-gray-100">
          {t("admin.revenueSummary")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-5">
          <StatItem
            icon={BarChart}
            color="text-orange-500"
            label={t("admin.totalSwaps")}
            value={formatNumber(staffDetail.totalReservationsVerified)}
          />
          <StatItem
            icon={Zap}
            color="text-green-500"
            label={t("admin.revenue")}
            value={`${formatNumber(staffDetail.totalSwapTransactions)} VND`}
          />
          <StatItem
            icon={X}
            color="text-red-500"
            label={t("admin.cancelledReservations")}
            value={formatNumber(staffDetail.recentReservationsVerified)}
          />
          <StatItem
            icon={Truck}
            color="text-blue-500"
            label={t("admin.totalVehicles")}
            value={formatNumber(staffDetail.recentSwapTransactions)}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-8 border-t mt-10 border-gray-100">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 hover:bg-gray-100"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailModal;
