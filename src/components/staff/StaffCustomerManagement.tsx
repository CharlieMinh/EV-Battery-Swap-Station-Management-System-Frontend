// src/components/staff/StaffCustomerManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Loader2,
  Phone,
  Mail,
  UserCircle2,
  X,
  Eye,
  Filter,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

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
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(customer?.name ?? "");
    setPhone(customer?.phoneNumber ?? "");
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
      onClose();
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
    customer.status === "Locked" ? "Bị khóa" : "Đang hoạt động";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <UserCircle2 className="w-6 h-6 text-orange-500" />
              <CardTitle className="text-lg font-semibold">
                {customer.name || "Khách hàng"}
              </CardTitle>
            </div>
            <span className="text-xs text-gray-500">
              {customer.email ?? "Không có email"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            disabled={saving}
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>

        <CardContent className="pt-4 overflow-y-auto">
          {/* Thông tin cá nhân */}
          <section className="mb-5">
            <h3 className="text-sm font-semibold text-orange-600 mb-3">
              Thông tin cá nhân
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border bg-gray-50 p-4">
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Tên</div>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Số điện thoại
                  </div>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="VD: 0901234567"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                  <Phone className="w-3 h-3" />
                  <span>Mã khách hàng: {customer.id}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Email</div>
                  <div className="px-3 py-2 rounded border bg-white text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="truncate">
                      {customer.email || "Không có email"}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Vai trò</div>
                  <div className="px-3 py-2 rounded border bg-gray-100 text-sm">
                    Khách hàng
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Trạng thái</div>
                  <div className="px-3 py-2 rounded border bg-gray-100 text-sm flex items-center gap-2">
                    <Badge
                      className={
                        customer.status === "Locked"
                          ? "bg-red-500 text-white"
                          : "bg-emerald-500 text-white"
                      }
                    >
                      {statusLabel}
                    </Badge>
                    <span className="text-xs text-gray-500">
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Hiệu suất & dữ liệu khách hàng */}
          <section>
            <h3 className="text-sm font-semibold text-orange-600 mb-3">
              Hiệu suất & dữ liệu khách hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-2xl border bg-white p-3 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">
                  Tổng lần thay pin
                </span>
                <span className="text-xl font-semibold text-gray-800">
                  {customer.totalReservations ?? 0}
                </span>
              </div>
              <div className="rounded-2xl border bg-white p-3 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">
                  Tổng lần thành công
                </span>
                <span className="text-xl font-semibold text-emerald-600">
                  {customer.completedReservations ?? 0}
                </span>
              </div>
              <div className="rounded-2xl border bg-white p-3 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Lượt hủy</span>
                <span className="text-xl font-semibold text-red-500">
                  {(customer.totalReservations ?? 0) -
                    (customer.completedReservations ?? 0)}
                </span>
              </div>
              <div className="rounded-2xl border bg-white p-3 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">
                  Tổng phương tiện
                </span>
                <span className="text-xl font-semibold text-gray-800">
                  {/* sau BE trả thêm thì sửa lại */}1
                </span>
              </div>
            </div>
          </section>
        </CardContent>

        <div className="flex justify-end gap-2 px-6 py-3 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Đóng
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Cập nhật hồ sơ
          </Button>
        </div>
      </Card>
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
