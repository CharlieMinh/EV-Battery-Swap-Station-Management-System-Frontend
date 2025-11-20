// src/components/staff/StaffCustomerManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Loader2,
  Phone,
  Mail,
  User,
  X,
  Eye,
  Filter,
  BarChart,
  Zap,
  Truck,
  Calendar,
  Clock,
  Edit,
  Save,
  Smartphone,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useLanguage } from "../LanguageContext";

import type { Customer } from "@/services/admin/customerAdminService";
import {
  fetchCustomersByStaff,
  updateDriverByStaff,
} from "@/services/staff/staffDriverService";

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};

const PAGE_SIZE = 10;

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

const formatNumber = (num: any) => (num ? num.toLocaleString("vi-VN") : "0");

/* =========================
 *  Modal xem + cập nhật hồ sơ
 * ========================= */
type DetailModalProps = {
  customer: Customer | null;
  onClose: () => void;
  onUpdated: (updated: Customer) => void;
};

function CustomerDetailModal({
  customer,
  onClose,
  onUpdated,
}: DetailModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setName(customer?.name ?? "");
    setPhone(customer?.phoneNumber ?? "");
    setIsEditing(false);
  }, [customer]);

  if (!customer) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning("Tên không được để trống.", toastOpts);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateDriverByStaff(customer.id, {
        name,
        phoneNumber: phone,
      });
      toast.success("Cập nhật hồ sơ khách hàng thành công.", toastOpts);
      onUpdated(updated);
      setIsEditing(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Không thể cập nhật hồ sơ.";
      toast.error(msg, toastOpts);
    } finally {
      setSaving(false);
    }
  };

  const statusLabel =
    customer.status === "Locked" ? t("admin.inactiveStatus") : t("admin.activeStatus");

  const cancelledCount = (customer.totalReservations ?? 0) - (customer.completedReservations ?? 0);
  const totalVehicles = 1; // TODO: Update when BE provides this data

  const data = [
    {
      key: "name",
      icon: User,
      label: t("admin.name"),
      value: isEditing ? name : (customer.name || ""),
      editable: true,
    },
    {
      key: "email",
      icon: Mail,
      label: t("admin.email"),
      value: customer.email || "",
    },
    {
      key: "phoneNumber",
      icon: Smartphone,
      label: t("admin.phone"),
      value: isEditing ? phone : (customer.phoneNumber || ""),
      editable: true,
    },
    {
      key: "role",
      icon: Zap,
      label: t("admin.role"),
      value: t("role.driver"),
    },
    {
      key: "status",
      icon: Zap,
      label: t("admin.status"),
      value: statusLabel,
    },
    {
      icon: Calendar,
      label: t("admin.createdAt"),
      value: customer.createdAt ? formatDateTime(customer.createdAt) : "N/A",
    },
    {
      icon: Clock,
      label: t("admin.lastLogin"),
      value: customer.lastLogin ? formatDateTime(customer.lastLogin) : "N/A",
    },
  ];

  const handleClose = () => {
    if (isEditing) {
      setName(customer?.name ?? "");
      setPhone(customer?.phoneNumber ?? "");
      setIsEditing(false);
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
                {customer.name || "Khách hàng"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {customer.email || "Không có email"}
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
                  disabled={saving}
                >
                  {saving ? (
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
                    setName(customer?.name ?? "");
                    setPhone(customer?.phoneNumber ?? "");
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
                  <input
                    type="text"
                    value={item.key === "name" ? name : phone}
                    onChange={(e) => {
                      if (item.key === "name") {
                        setName(e.target.value);
                      } else if (item.key === "phoneNumber") {
                        setPhone(e.target.value);
                      }
                    }}
                    className="border rounded-md p-1 text-gray-700 w-full"
                  />
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
            value={formatNumber(customer.totalReservations)}
          />
          <StatItem
            icon={Zap}
            color="text-green-500"
            label={t("admin.totalCompleted")}
            value={`${formatNumber(customer.completedReservations)} VND`}
          />
          <StatItem
            icon={X}
            color="text-red-500"
            label={t("admin.cancelledReservations")}
            value={formatNumber(cancelledCount)}
          />
          <StatItem
            icon={Truck}
            color="text-blue-500"
            label={t("admin.totalVehicles")}
            value={formatNumber(totalVehicles)}
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
}

/* =========================
 *  Danh sách khách cho Staff
 * ========================= */
export default function StaffCustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // filter giống Admin
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");

  // phân trang client-side giống Admin
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);

  // ========== Load dữ liệu từ BE ==========
  const getAllCustomers = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Staff: gọi đúng API /Users/customers
      const res = await fetchCustomersByStaff(1, 1000, "");
      setCustomers(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải danh sách khách hàng.";
      setError(msg);
      toast.error(msg, toastOpts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllCustomers();
  }, []);

  // đồng bộ inputPage khi page đổi
  useEffect(() => {
    setInputPage(page);
  }, [page]);

  // reset về page 1 khi filter đổi
  useEffect(() => {
    setPage(1);
  }, [filterText]);

  const handleCloseModal = () => {
    setSelectedCustomer(null);
    getAllCustomers(); // reload lại sau khi update
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  // Filter theo tên / email / SĐT
  const filteredCustomers = useMemo(() => {
    if (!filterText) return customers;
    const q = filterText.toLowerCase().trim();
    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phoneNumber || "").toLowerCase();
      return (
        name.includes(q) || email.includes(q) || phone.includes(q)
      );
    });
  }, [customers, filterText]);

  // Dữ liệu phân trang
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  /* ========== Render ========== */

  if (isLoading) {
    return (
      <div className="text-center py-6 text-sm text-gray-600">
        <Loader2 className="w-4 h-4 mr-1 inline-block animate-spin" />
        Đang tải khách hàng...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-sm text-rose-600">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Filter giống Admin nhưng text cho Staff */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">
          Khách hàng của trạm
        </h2>
        <div className="flex space-x-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="w-4 h-4 mr-1" /> Lọc
          </Button>
          {showFilter && (
            <Input
              type="text"
              placeholder="Tìm theo tên / email / SĐT..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-72"
            />
          )}
        </div>
      </div>

      {/* Danh sách khách hàng (style giống Admin) */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600">
            Danh sách khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedCustomers.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              Không có khách hàng nào.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 border rounded-lg border-orange-200 hover:bg-orange-50 cursor-pointer"
                  onClick={() => handleViewDetails(c)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">
                        {(c.name || c.email || "?").charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {c.name || "(Chưa có tên)"}
                      </p>
                      <p className="text-sm text-gray-500">{c.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          className={
                            c.status === "Locked"
                              ? "bg-red-500 text-white"
                              : "bg-emerald-500 text-white"
                          }
                        >
                          {c.status === "Locked"
                            ? "Bị khóa"
                            : "Đang hoạt động"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {c.phoneNumber || "Không có SĐT"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div>
                      <span className="text-gray-500 text-sm">
                        Tổng lần thay pin:{" "}
                      </span>
                      <span className="font-medium">
                        {(c.totalReservations ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">
                        Thành công:{" "}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {(c.completedReservations ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex space-x-2 mt-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(c);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Phân trang giống Admin */}
          <div className="flex justify-center items-center space-x-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>

            <div className="flex items-center space-x-1">
              <span className="text-gray-700 text-sm">Trang</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={inputPage}
                onChange={(e) => setInputPage(Number(e.target.value))}
                onBlur={() => {
                  let newPage = Number(inputPage);
                  if (isNaN(newPage) || newPage < 1) newPage = 1;
                  if (newPage > totalPages) newPage = totalPages;
                  setPage(newPage);
                }}
                className="w-16 text-center text-sm"
              />
              <span className="text-gray-700 text-sm">/ {totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal chi tiết & cập nhật hồ sơ */}
      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={handleCloseModal}
        onUpdated={(updated) => {
          setCustomers((prev) =>
            prev.map((x) => (x.id === updated.id ? updated : x))
          );
        }}
      />
    </div>
  );
}
