// src/components/staff/StaffCustomerManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Loader2,
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
  Car,
  Package,
  Battery,
  Mail,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useLanguage } from "../LanguageContext";
import { formatDateTime, formatNumber } from "../../utils/dateTimeUtils";

import type {
  Customer,
  CustomerDetail,
  Vehicle,
  Subscription,
} from "@/services/admin/customerAdminService";
import {
  fetchCustomersByStaff,
  updateDriverByStaff,
  fetchCustomerDetailByStaff,
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
  const { t, language } = useLanguage();
  const L = (vi: string, en: string) => (language === "vi" ? vi : en);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (!customer) return;
    setIsEditing(false);
    setDetail(null);
    setLoadingDetail(true);
    (async () => {
      try {
        const data = await fetchCustomerDetailByStaff(customer.id);
        setDetail(data);
        setForm({
          name: data.name || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          t("staff.customers.errorLoadDetail");
        toast.error(msg, toastOpts);
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [customer]);

  if (!customer) return null;

  const resetForm = () => {
    if (!detail) return;
    setForm({
      name: detail.name || "",
      phoneNumber: detail.phoneNumber || "",
    });
  };

  const handleSave = async () => {
    if (!detail) return;
    if (!form.name.trim()) {
      toast.warning(t("staff.profile.toastSaveWarnName"), toastOpts);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateDriverByStaff(detail.id || customer.id, {
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      toast.success(t("staff.customers.toastUpdateSuccess"), toastOpts);
      setDetail((prev: CustomerDetail | null) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              phoneNumber: updated.phoneNumber,
            }
          : prev
      );
      onUpdated(updated);
      setIsEditing(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        t("staff.customers.toastUpdateError");
      toast.error(msg, toastOpts);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    resetForm();
    onClose();
  };

  const cancelledCount =
    detail?.cancelledReservations ??
    Math.max(
      (detail?.totalReservations ?? 0) -
        (detail?.completedReservations ?? 0),
      0
    );
  const totalVehicles =
    detail?.totalVehicles ?? detail?.vehicles?.length ?? 0;

  const infoRows =
    detail === null
      ? []
      : [
          {
            key: "name",
            label: t("staff.profile.labelFullName"),
            icon: User,
            editable: true,
            value: form.name,
            placeholder: L("Nhập tên khách hàng", "Enter customer name"),
          },
          {
            key: "email",
            label: t("staff.profile.labelEmail"),
            icon: Mail,
            value: detail.email || t("staff.customers.noEmail"),
          },
          {
            key: "phoneNumber",
            label: t("staff.profile.labelPhone"),
            icon: Smartphone,
            editable: true,
            value: form.phoneNumber,
            placeholder: L("Nhập số điện thoại", "Enter phone number"),
          },
          {
            key: "status",
            label: t("admin.status"),
            icon: Battery,
            value:
              detail.status === "Locked"
                ? t("admin.inactiveStatus")
                : t("admin.activeStatus"),
            badgeClass:
              detail.status === "Locked"
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-green-100 text-green-700 border-green-200",
          },
          {
            key: "role",
            label: t("admin.role"),
            icon: Zap,
            value: t("role.driver"),
          },
          {
            key: "joined",
            label: L("Ngày tham gia", "Join date"),
            icon: Calendar,
            value: detail.createdAt
              ? formatDateTime(
                  detail.createdAt instanceof Date
                    ? detail.createdAt.toISOString()
                    : detail.createdAt
                )
              : L("Chưa cập nhật", "Not updated"),
          },
          {
            key: "lastLogin",
            label: t("admin.lastLogin"),
            icon: Clock,
            value: detail.lastLogin
              ? formatDateTime(
                  detail.lastLogin instanceof Date
                    ? detail.lastLogin.toISOString()
                    : detail.lastLogin
                )
              : L("Chưa cập nhật", "Not updated"),
          },
        ];

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

        {loadingDetail || !detail ? (
          <div className="flex flex-col items-center py-16 text-gray-600">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
            <p>{t("admin.loadingCustomerData")}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-5 border-orange-200">
              <div className="flex items-center space-x-4">
                <User className="w-11 h-11 text-orange-600 shrink-0" />
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    {detail.name || t("staff.customer")}
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {detail.email || t("staff.customers.noEmail")}
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
                          <Save className="w-4 h-4 mr-1" /> {t("common.save")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        resetForm();
                      }}
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      {t("common.cancel")}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <Card className="mt-8 bg-white border border-orange-100 shadow-md p-5">
              <h2 className="text-xl font-semibold mb-4 text-orange-600">
                {t("admin.personalInfo")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                {infoRows.map((row) => (
                  <div key={row.key} className="flex items-start gap-2">
                    <row.icon className="w-4 h-4 text-orange-500 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {row.label}
                      </span>
                      {isEditing && row.editable ? (
                        <input
                          type="text"
                          value={
                            row.key === "name" ? form.name : form.phoneNumber
                          }
                          placeholder={row.placeholder}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              [row.key === "name"
                                ? "name"
                                : "phoneNumber"]: e.target.value,
                            }))
                          }
                          className="mt-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-200 focus:outline-none bg-white"
                        />
                      ) : row.badgeClass ? (
                        <Badge
                          className={`mt-1 w-fit px-3 py-0.5 text-xs font-semibold ${row.badgeClass}`}
                        >
                          {row.value}
                        </Badge>
                      ) : (
                        <span className="mt-1 font-semibold text-gray-900">
                          {row.value}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Hiệu suất */}
            <h2 className="text-2xl font-bold pt-8 text-gray-700 border-b pb-3 border-gray-100">
              {t("admin.performanceData")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
              <StatItem
                icon={BarChart}
                color="text-orange-500"
                label={t("admin.totalSwaps")}
                value={formatNumber(detail.totalReservations)}
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

            {/* Xe & Gói pin */}
            <h2 className="text-2xl font-bold pt-8 text-gray-700 border-b pb-3 border-gray-100 mt-8">
              {t("admin.vehiclesAndSubscriptions")}
            </h2>
            <div className="mt-5 space-y-4">
              {!detail.vehicles || detail.vehicles.length === 0 ? (
                <Card className="border border-gray-200 p-6">
                  <div className="text-center text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>{t("admin.noVehicles")}</p>
                  </div>
                </Card>
              ) : (
                detail.vehicles.map((vehicle: Vehicle) => {
                  const vehicleSub = detail.subscriptions?.find(
                    (sub: Subscription) =>
                      sub.isActive &&
                      sub.subscriptionPlan?.batteryModelId ===
                        vehicle.compatibleBatteryModelId
                  );
                  const limit =
                    vehicleSub?.swapsLimit ??
                    vehicleSub?.subscriptionPlan?.maxSwapsPerMonth ??
                    null;
                  const count = vehicleSub?.currentMonthSwapCount ?? 0;
                  const remaining =
                    limit === null ? null : Math.max(limit - count, 0);
                  const isLimitReached =
                    limit !== null && count >= limit;

                  return (
                    <Card
                      key={vehicle.id}
                      className="border border-gray-200 hover:border-orange-300 transition-all shadow-sm"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {vehicle.photoUrl ? (
                            <img
                              src={vehicle.photoUrl}
                              alt={
                                vehicle.vehicleModelFullName || vehicle.brand
                              }
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                              <Car className="w-10 h-10 text-gray-400" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                  {vehicle.vehicleModelFullName || vehicle.brand}
                                </h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold">
                                      {t("admin.plateNumber")}:
                                    </span>
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                      {vehicle.plate || "—"}
                                    </span>
                                  </div>
                                  {vehicle.vin && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">VIN:</span>
                                      <span className="font-mono text-xs">
                                        {vehicle.vin}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                  <Battery className="w-4 h-4 text-orange-500" />
                                  <span>
                                    {t("admin.compatibleBattery")}:{" "}
                                    <span className="font-semibold text-gray-900">
                                      {vehicle.compatibleBatteryModelName || "—"}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {vehicleSub ? (
                              <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                                <div className="flex items-start gap-3">
                                  <Package className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge
                                        className={
                                          isLimitReached
                                            ? "bg-red-100 text-red-700 border-red-300"
                                            : "bg-green-100 text-green-700 border-green-300"
                                        }
                                      >
                                        {vehicleSub.subscriptionPlan?.name ||
                                          L("Gói pin", "Battery plan")}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600">
                                          {t("admin.subscriptionStatus")}:
                                        </span>
                                        <Badge
                                          className={
                                            vehicleSub.isActive
                                              ? "bg-green-100 text-green-700"
                                              : "bg-gray-100 text-gray-700"
                                          }
                                        >
                                          {vehicleSub.isActive
                                            ? t("admin.activeStatus")
                                            : t("admin.inactiveStatus")}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-600">
                                          {t("admin.usageThisMonth")}:
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                          {formatNumber(count)}
                                          {limit !== null &&
                                            ` / ${formatNumber(limit)}`}
                                        </span>
                                      </div>
                                      {limit !== null && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-600">
                                            {t("admin.remainingSwaps")}:
                                          </span>
                                          <span
                                            className={`font-semibold ${
                                              remaining !== null &&
                                              remaining > 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                            }`}
                                          >
                                            {formatNumber(remaining ?? 0)}
                                          </span>
                                        </div>
                                      )}
                                      {vehicleSub.startDate && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            {t("admin.startDate")}:{" "}
                                            {formatDateTime(
                                              vehicleSub.startDate
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      {vehicleSub.endDate && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <Calendar className="w-3 h-3" />
                                          <span>
                                            {t("admin.endDate")}:{" "}
                                            {formatDateTime(vehicleSub.endDate)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600 flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span>{t("admin.noActiveSubscription")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
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
          </>
        )}
      </div>
    </div>
  );
}

/* =========================
 *  Danh sách khách cho Staff
 * ========================= */
export default function StaffCustomerManagement() {
  const { t, language } = useLanguage();
  const L = (vi: string, en: string) => (language === "vi" ? vi : en);
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
        t("staff.customers.errorLoadList");
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">{t("staff.customers.loadingList")}</p>
        </div>
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
          {t("staff.customers.title")}
        </h2>
        <div className="flex space-x-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="w-4 h-4 mr-1" /> {t("staff.filter")}
          </Button>
          {showFilter && (
            <Input
              type="text"
              placeholder={t("staff.customers.searchPlaceholder")}
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
            {t("admin.customerList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedCustomers.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              {t("admin.noCustomers")}
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
                        {c.name || t("staff.customers.noName")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {c.email || t("staff.customers.noEmail")}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          className={
                            c.status === "Locked"
                              ? "bg-red-500 text-white"
                              : "bg-emerald-500 text-white"
                          }
                        >
                          {c.status === "Locked"
                            ? t("admin.inactiveStatus")
                            : t("admin.activeStatus")}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {c.phoneNumber || t("staff.customers.noPhone")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div>
                      <span className="text-gray-500 text-sm">
                        {t("admin.totalSwapsLabel")}
                      </span>
                      <span className="font-medium">
                        {formatNumber(c.totalReservations ?? 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">
                        {t("admin.totalCompleted")}:{" "}
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {formatNumber(c.completedReservations ?? 0)}
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
              {t("admin.prev")}
            </Button>

            <div className="flex items-center space-x-1">
              <span className="text-gray-700 text-sm">{t("admin.page")}</span>
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
              {t("admin.next")}
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
