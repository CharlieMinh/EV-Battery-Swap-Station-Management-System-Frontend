import React, { useEffect, useState } from "react";
import {
  Customer,
  CustomerDetail,
  fetchCustomerById,
  updateUser,
  UpdateUserPayload,
} from "@/services/admin/customerAdminService";
import { useLanguage } from "../LanguageContext";
import {
  BarChart,
  Calendar,
  Clock,
  Edit,
  Loader2,
  Mail,
  Save,
  Smartphone,
  Truck,
  User,
  X,
  Zap,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { toast } from "react-toastify";
import { profile } from "console";

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

interface CustomerDetailModalProps {
  customer: Customer | null;
  onClose: () => void;
}

const formatNumber = (num: any) => (num ? num.toLocaleString("vi-VN") : "0");

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

const getRoleText = (role: string | number, t: (key: string) => string): string => {
  const roleNum = typeof role === "number" ? role : getRoleNumber(role);
  switch (roleNum) {
    case 0:
      return t("role.driver");
    case 1:
      return t("role.staff");
    case 2:
      return t("role.admin");
    default:
      return "N/A";
  }
};

const CustomerDetailModal = ({
  customer,
  onClose,
}: CustomerDetailModalProps) => {
  const { t } = useLanguage();
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    role: "0",
    profilePicture: "",
    status: "0",
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!customer || !customer.id) return;
    const getCustomerById = async () => {
      setLoading(true);
      setCustomerDetail(null);
      try {
        const data = await fetchCustomerById(customer.id);
        setCustomerDetail(data);
        const roleValue = getRoleNumber(data.role || "0").toString();
        const statusValue =
          data.status === "Active" || data.status === "0" ? "0" : "1";
        setFormData({
          name: data.name || "",
          phoneNumber: data.phoneNumber || "",
          role: roleValue,
          profilePicture: data.profilePicture,
          status: statusValue,
        });
      } catch (error) {
        console.error("Error fetching customer detail:", error);
      } finally {
        setLoading(false);
      }
    };
    getCustomerById();
  }, [customer, onClose]);

  const handleSave = async () => {
    if (!customerDetail) return;
    try {
      setLoading(true);
      const payload: UpdateUserPayload = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        profilePicture: formData.profilePicture,
        status: formData.status,
      };
      await updateUser(customerDetail.id!, payload);
      toast.success(t("admin.updateSuccess"));
      setCustomerDetail({
        ...customerDetail,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        status: formData.status === "0" ? "Active" : "Inactive",
      });
      setIsEditing(false);
    } catch (error) {
      toast.error(t("admin.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  if (loading || !customerDetail) {
    return (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg text-gray-700">
          <Loader2 className="animate-spin w-6 h-6 inline-block mr-2 text-orange-600" />
          {t("admin.loadingCustomerData")}
        </div>
      </div>
    );
  }

  const getDisplayValue = (key: string) => {
    switch (key) {
      case "name":
        return formData.name || customerDetail.name;
      case "phoneNumber":
        return formData.phoneNumber || customerDetail.phoneNumber;
      case "role":
        return getRoleText(formData.role, t);
      case "status":
        return formData.status === "0" ? t("admin.activeStatus") : t("admin.inactiveStatus");
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
      value: customerDetail.email,
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
      value: formatDateTime(customerDetail.createdAt),
    },
    {
      icon: Clock,
      label: t("admin.lastLogin"),
      value: formatDateTime(customerDetail.lastLogin),
    },
  ];

  const handleClose = () => {
    if (isEditing) {
      // Reset form và tắt chế độ chỉnh sửa trước khi đóng
      setFormData({
        name: customerDetail?.name || "",
        phoneNumber: customerDetail?.phoneNumber || "",
        role:
          customerDetail?.role === "Driver"
            ? "0"
            : customerDetail?.role === "Staff"
            ? "1"
            : "2",
        profilePicture: customerDetail.profilePicture,
        status: customerDetail?.status === "Active" ? "0" : "1",
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
                {customerDetail.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {customerDetail.email}
              </p>
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
                      name: customerDetail.name || "",
                      phoneNumber: customerDetail.phoneNumber || "",
                      role:
                        customerDetail.role === "Driver"
                          ? "0"
                          : customerDetail.role === "Staff"
                          ? "1"
                          : "2",
                      profilePicture: customerDetail.profilePicture,
                      status: customerDetail.status === "Active" ? "0" : "1",
                    });
                  }}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {t("admin.cancelChanges")}
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
                      <option value={"0"}>{t("role.driver")}</option>
                      <option value={"1"}>{t("role.staff")}</option>
                      <option value={"2"}>{t("role.admin")}</option>
                    </select>
                  ) : item.key === "status" ? (
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="border rounded-md p-1 text-gray-700"
                    >
                      <option value={"0"}>{t("admin.activeStatus")}</option>
                      <option value={"1"}>{t("admin.inactiveStatus")}</option>
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
          {t("admin.performanceData")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-5">
          <StatItem
            icon={BarChart}
            color="text-orange-500"
            label={t("admin.totalSwaps")}
            value={formatNumber(customerDetail.totalReservations)}
          />
          <StatItem
            icon={Zap}
            color="text-green-500"
            label={t("admin.totalCompleted")}
            value={`${formatNumber(customerDetail.completedReservations)} VND`}
          />
          <StatItem
            icon={X}
            color="text-red-500"
            label={t("admin.cancelledReservations")}
            value={formatNumber(customerDetail.cancelledReservations)}
          />
          <StatItem
            icon={Truck}
            color="text-blue-500"
            label={t("admin.totalVehicles")}
            value={formatNumber(customerDetail.totalVehicles)}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-8 border-t mt-10 border-gray-100">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-300 hover:bg-gray-100"
          >
            {t("common.close")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
