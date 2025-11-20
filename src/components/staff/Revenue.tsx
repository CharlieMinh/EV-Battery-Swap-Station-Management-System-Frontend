// src/components/staff/Revenue.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listAllPayments, type Payment } from "../../services/staff/staffApi";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "react-toastify";

/* ====== GIỮ NGUYÊN CÁC HÀM LOGIC CŨ ====== */
function normalizePayments(payload: any): Payment[] {
  if (Array.isArray(payload)) return payload as Payment[];

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.payments)) {
      return (payload.payments as any[]).map((p) => ({
        paymentId: p?.id ?? p?.paymentId ?? "",
        swapId: p?.reservationId ?? p?.swapId,
        amount: p?.amount,
        method: p?.method,
        status: p?.status,
        paidAt: p?.completedAt ?? p?.paidAt,
        customer: p?.customer ?? p?.driver ?? p?.user ?? p?.payer ?? null,
        customerName:
          p?.customerName ?? p?.payerName ?? p?.driverName ?? p?.userName ?? undefined,
      })) as Payment[];
    }
    if (Array.isArray(payload.items)) return payload.items as Payment[];
    if (Array.isArray(payload.data)) return payload.data as Payment[];
    if (Array.isArray(payload.results)) return payload.results as Payment[];
    if (Array.isArray(payload.value)) return payload.value as Payment[];
    if (Array.isArray(payload.records)) return payload.records as Payment[];
  }
  return [];
}

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};
const TOAST_ID = {
  fetchOk: "rev-fetch-ok",
  fetchErr: "rev-fetch-err",
  refreshInfo: "rev-refresh-info",
};

function isPaidStatus(s: any): boolean {
  const v = (s ?? "").toString().trim().toLowerCase();
  if (v === "paid" || v === "success" || v === "completed") return true;
  const n = Number(v);
  return !Number.isNaN(n) && n === 2;
}
function isCashMethod(m: any): boolean {
  const v = (m ?? "").toString().trim().toLowerCase();
  if (v === "cash" || v === "tiền mặt") return true;
  const n = Number(v);
  return !Number.isNaN(n) && n === 1;
}

/** Chỉ dùng để HIỂN THỊ nhãn VN cho cột Hình thức, không đổi logic */
function getMethodLabelVi(m: any): string {
  const raw = (m ?? "").toString().trim();
  if (!raw) return "—";
  if (isCashMethod(m)) return "Tiền mặt";

  const v = raw.toLowerCase();
  if (
    v === "vnpay" ||
    v === "vn-pay" ||
    v === "vnpay_qr" ||
    v === "qr" ||
    v === "online" ||
    v === "gateway" ||
    v === "card"
  ) {
    return "VNPay";
  }
  return raw;
}

function getCustomerName(p: any): string {
  const direct =
    p?.customerName ||
    p?.payerName ||
    p?.driverName ||
    p?.userName ||
    p?.customerFullName ||
    p?.fullName ||
    "";
  if (direct) return direct as string;

  const obj = p?.customer || p?.driver || p?.user || p?.payer || {};
  return (
    obj?.fullName ||
    obj?.name ||
    (obj?.firstName && obj?.lastName ? `${obj.firstName} ${obj.lastName}` : "") ||
    obj?.email ||
    "—"
  );
}
function getStatusLabel(p: any): string {
  return isPaidStatus(p?.status) ? "Đã thanh toán" : "Chưa thanh toán";
}

/* ===================== COMPONENT ===================== */
export default function Revenue() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // 2 filter mới
  const [statusFilter, setStatusFilter] = useState<string>(""); // "", "paid", "unpaid"
  const [methodFilter, setMethodFilter] = useState<string>(""); // "", "cash", "vnpay"

  const [paid, setPaid] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const fetchPaid = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await listAllPayments({
        fromDate: from || undefined,
        toDate: to || undefined,
        page: 1,
        pageSize: 500,
      });

      const list = normalizePayments(data);
      // GIỮ NGUYÊN LOGIC: chỉ lấy giao dịch đã thanh toán
      const paidOnly = list.filter((p) => isPaidStatus((p as any).status));
      setPaid(paidOnly);
    } catch (e: any) {
      console.error("Load revenue error:", e);
      setErr("Không tải được dữ liệu doanh thu.");
      setPaid([]);
      const msg =
        e?.response?.data?.message || e?.message || "Không tải được dữ liệu doanh thu.";
      toast.error(msg, { ...toastOpts, toastId: TOAST_ID.fetchErr });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === TÍNH TỔNG THEO LOGIC CŨ ===
  // revenue / cashCount dùng toàn bộ paid (không search)
  const revenue = useMemo(
    () => paid.reduce((s, p) => s + (Number((p as any).amount) || 0), 0),
    [paid]
  );
  const cashCount = useMemo(
    () => paid.filter((p) => isCashMethod((p as any).method)).length,
    [paid]
  );
  const arps = useMemo(
    () => (paid.length ? Math.round(revenue / paid.length) : 0),
    [revenue, paid.length]
  );

  // === filteredPaid: CHỈ ÁP DỤNG SEARCH (y như bản gốc) ===
  const filteredPaid = useMemo(() => {
    if (!search.trim()) return paid;
    const q = search.trim().toLowerCase();

    return paid.filter((p) => {
      const customerName = getCustomerName(p).toLowerCase();
      const amount = (Number((p as any).amount) || 0).toString();
      const methodRaw = ((p as any).method || "").toLowerCase();
      const methodLabel = getMethodLabelVi((p as any).method).toLowerCase();
      const paymentId = ((p as any).paymentId || "").toLowerCase();
      const swapId = ((p as any).swapId || "").toLowerCase();

      return (
        customerName.includes(q) ||
        amount.includes(q) ||
        methodRaw.includes(q) ||
        methodLabel.includes(q) ||
        paymentId.includes(q) ||
        swapId.includes(q)
      );
    });
  }, [paid, search]);

  // Doanh thu + số liệu KPI dựa trên filteredPaid (search) – GIỮ LOGIC CŨ
  const filteredRevenue = useMemo(
    () => filteredPaid.reduce((s, p) => s + (Number((p as any).amount) || 0), 0),
    [filteredPaid]
  );
  const filteredCashCount = useMemo(
    () => filteredPaid.filter((p) => isCashMethod((p as any).method)).length,
    [filteredPaid]
  );
  const filteredArps = useMemo(
    () =>
      filteredPaid.length
        ? Math.round(filteredRevenue / filteredPaid.length)
        : 0,
    [filteredRevenue, filteredPaid.length]
  );

  // Tỷ lệ VNPay tính trên filteredPaid (chỉ search, không theo filter mới)
  const filteredVnPayCount = filteredPaid.length - filteredCashCount;
  const vnpayRate = filteredPaid.length
    ? Math.round((filteredVnPayCount * 100) / filteredPaid.length)
    : 0;

  // === tablePaid: ÁP DỤNG THÊM statusFilter + methodFilter (KHÔNG ĐỤNG KPI) ===
  const tablePaid = useMemo(() => {
    return filteredPaid.filter((p) => {
      const statusOk =
        statusFilter === "paid"
          ? isPaidStatus((p as any).status)
          : statusFilter === "unpaid"
          ? !isPaidStatus((p as any).status)
          : true;

      const methodOk =
        methodFilter === "cash"
          ? isCashMethod((p as any).method)
          : methodFilter === "vnpay"
          ? !isCashMethod((p as any).method)
          : true;

      return statusOk && methodOk;
    });
  }, [filteredPaid, statusFilter, methodFilter]);

  /* ===================== UI ===================== */
  return (
    <div className="container mx-auto space-y-6">
      {/* Card bộ lọc + tiêu đề */}
      <Card className="rounded-2xl shadow-lg border border-orange-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-orange-600">
            Doanh thu
          </CardTitle>
          <p className="text-sm text-gray-600">
            Lọc và xem giao dịch đã thanh toán
          </p>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs block text-gray-500 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                className="h-10 w-48 rounded-lg border-2 border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs block text-gray-500 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                className="h-10 w-48 rounded-lg border-2 border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs block text-gray-500 mb-1">
                Tìm kiếm
              </label>
              <input
                type="text"
                className="h-10 w-64 rounded-lg border-2 border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                placeholder="Tên khách, số tiền, hình thức..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter trạng thái */}
            <div>
              <label className="text-xs block text-gray-500 mb-1">
                Trạng thái
              </label>
              <select
                className="h-10 w-40 rounded-lg border-2 border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
              </select>
            </div>

            {/* Filter hình thức */}
            <div>
              <label className="text-xs block text-gray-500 mb-1">
                Hình thức
              </label>
              <select
                className="h-10 w-40 rounded-lg border-2 border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="cash">Tiền mặt</option>
                <option value="vnpay">VNPay</option>
              </select>
            </div>

            <Button
              onClick={() => {
                toast.info("Đang làm mới dữ liệu...", {
                  ...toastOpts,
                  toastId: TOAST_ID.refreshInfo,
                });
                fetchPaid();
              }}
              variant="outline"
              className="h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>

          {err && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card số liệu + bảng */}
      <Card className="rounded-2xl shadow-lg border border-orange-200">
        <CardContent className="pt-6">
          {/* KPIs – CHỈ PHỤ THUỘC SEARCH (filteredPaid) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Tổng doanh thu</div>
              <div className="text-2xl font-bold text-orange-600">
                {filteredRevenue.toLocaleString()} đ
              </div>
            </div>
            <div className="rounded-2xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Số giao dịch</div>
              <div className="text-2xl font-bold">{filteredPaid.length}</div>
            </div>
            <div className="rounded-2xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Tỷ lệ tiền mặt</div>
              <div className="text-2xl font-bold">
                {filteredPaid.length
                  ? Math.round((filteredCashCount * 100) / filteredPaid.length)
                  : 0}
                %
              </div>
            </div>
            <div className="rounded-2xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Tỷ lệ VNPay</div>
              <div className="text-2xl font-bold">{vnpayRate}%</div>
            </div>
          </div>

          {/* Bảng */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-semibold w-16">
                    STT
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">
                    Tên khách hàng
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">
                    Số tiền
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">
                    Hình thức
                  </th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">
                    Thời gian thanh toán
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!loading && tablePaid.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {search.trim()
                        ? "Không tìm thấy kết quả"
                        : "Không có dữ liệu"}
                    </td>
                  </tr>
                )}
                {tablePaid.map((p, idx) => (
                  <tr
                    key={(p as any).paymentId}
                    className="border-t hover:bg-orange-50/30"
                  >
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">{getCustomerName(p)}</td>
                    <td className="px-4 py-3">{getStatusLabel(p)}</td>
                    <td className="px-4 py-3 font-medium">
                      {(Number((p as any).amount) || 0).toLocaleString()} đ
                    </td>
                    <td className="px-4 py-3">
                      {getMethodLabelVi((p as any).method)}
                    </td>
                    <td className="px-4 py-3">
                      {(p as any).paidAt
                        ? new Date((p as any).paidAt as any).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ARPS vẫn được giữ tính toán nhưng không hiển thị – tránh đổi logic */}
          {/* console.debug("ARPS all:", arps, "ARPS after search:", filteredArps); */}
        </CardContent>
      </Card>
    </div>
  );
}
