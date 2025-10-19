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
    status: "0",
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
          status: statusValue,
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
        status: formData.status,
      };
      const updateStaff = await updateUser(staffDetail.id, payload);
      toast.success(t("admin.updateSuccess"));
      setStaffDetail({
        ...staffDetail,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        role: getRoleText(formData.role),
        status: formData.status === "0" ? "Active" : "Inactive",
      });
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error(t("admin.updateFailed"));
    } finally {
      setLoading(false);
    }
    setIsEditing(false);
  };

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
      icon: Clock,
      label: t("admin.lastLogin"),
      value: formatDateTime(staffDetail.lastLogin),
    },
  ];

  return (
    // Modal Overlay (dimming/blur background)
    <div
      className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent click propagation to overlay
      >
        {/* Header with Close Button and Actions */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h2 className="text-2xl font-bold text-orange-600 mb-3 sm:mb-0">
            {t("admin.staffDetail")}
          </h2>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-600 hover:bg-orange-50"
            >
              <Calendar className="w-4 h-4 mr-1" /> {t("admin.viewHistory")}
            </Button>
            {!isEditing ? (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-1" /> {t("admin.updateProfile")}
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
                  size="sm"
                  variant="outline"
                  className="text-gray-600 border-gray-400 hover:bg-gray-100"
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
                      status: staffDetail.status === "Active" ? "0" : "1",
                    });
                  }}
                  disabled={loading}
                >
                  Hủy thay đổi
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="hover:bg-red-500 hover:text-white ml-3"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-8">
          {/* 1. Thông tin cá nhân */}
          <Card className="border border-orange-200">
            <CardHeader>
              <CardTitle className="text-orange-600">
                {t("admin.personalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-gray-700">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 text-gray-500" />
                    {isEditing && item.editable ? (
                      item.key === "role" ? (
                        <select
                          value={formData.role}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              role: e.target.value,
                            })
                          }
                          className="border rounded p-1"
                        >
                          <option value={"0"}>Tài xế</option>
                          <option value={"1"}>Nhân viên</option>
                          <option value={"2"}>Quản lý</option>
                        </select>
                      ) : item.key === "status" ? (
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              status: e.target.value,
                            })
                          }
                          className="border rounded p-1"
                        >
                          <option value={"0"}>Đang hoạt động</option>
                          <option value={"1"}>Ngừng hoạt động</option>
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
                          className="border rounded p-1 w-full"
                          required
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
            </CardContent>
          </Card>

          {/* 2. Tổng kết Doanh thu & Hiệu suất */}
          <Card className="border border-green-200">
            <CardHeader>
              <CardTitle className="text-green-600">
                {t("admin.revenueSummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Swaps (Tổng Lần Thay Pin) */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <BarChart className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t("admin.totalSwaps")}
                  </p>{" "}
                  {/* Dùng key mới */}
                  <p className="text-2xl font-bold text-gray-800">
                    {formatNumber(staffDetail.totalReservationsVerified)}
                  </p>
                </div>
                {/* Revenue (Doanh Thu) */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <Zap className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t("admin.revenue")}
                  </p>{" "}
                  {/* Dùng key mới */}
                  <p className="text-2xl font-bold text-gray-800">
                    {formatNumber(staffDetail.totalSwapTransactions)} VND
                  </p>
                </div>
                {/* Cancelled Swaps (Lượt hủy) */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <X className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t("admin.cancelledReservations")}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatNumber(staffDetail.recentReservationsVerified)}
                  </p>
                </div>
                {/* Total Vehicles (Tổng phương tiện) */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                  <Truck className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {t("admin.totalVehicles")}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatNumber(staffDetail.recentSwapTransactions)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Lịch sử đổi pin (Placeholder) */}
          <Card className="border border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-600">
                {t("admin.swapHistorySummary")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-blue-50 rounded-lg flex items-center justify-center p-4">
                <p className="text-gray-500 italic">
                  (Phần này có thể hiển thị biểu đồ hoặc danh sách tóm tắt các
                  giao dịch gần đây.)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailModal;
