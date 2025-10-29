// src/components/staff/Revenue.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listAllPayments, type Payment } from "../../services/staff/staffApi";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "react-toastify";

/* ===========================
 *  Helper: Chuẩn hoá dữ liệu
 * =========================== */
function normalizePayments(payload: any): Payment[] {
  // Chấp nhận nhiều dạng gói dữ liệu phổ biến
  if (Array.isArray(payload)) return payload as Payment[];

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.items)) return payload.items as Payment[];
    if (Array.isArray(payload.data)) return payload.data as Payment[];
    if (Array.isArray(payload.results)) return payload.results as Payment[];
    if (Array.isArray(payload.value)) return payload.value as Payment[];
    if (Array.isArray(payload.records)) return payload.records as Payment[];
  }
  return [];
}

export default function Revenue() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [paid, setPaid] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  /* ===========================
   *  Tính toán tổng hợp
   * =========================== */
  const revenue = useMemo(
    () => paid.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [paid]
  );
  const cashCount = useMemo(
    () => paid.filter((p) => (p?.method || "").toString() === "Cash").length,
    [paid]
  );
  const arps = useMemo(
    () => (paid.length ? Math.round(revenue / paid.length) : 0),
    [revenue, paid.length]
  );

  /* ===========================
   *  Fetch dữ liệu + Toast
   * =========================== */
  const fetchPaid = async (withToast = false) => {
    // Validate ngày
    if (from && to && new Date(from) > new Date(to)) {
      toast.warning("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
      return;
    }

    setLoading(true);
    const params = {
      fromDate: from || undefined,
      toDate: to || undefined,
      page: 1,
      pageSize: 500,
    };
    const promise = listAllPayments(params);

    try {
      if (withToast) {
        const res = await toast.promise(
          promise,
          {
            pending: "Đang tải dữ liệu doanh thu...",
            success: {
              render({ data }) {
                // data có thể là AxiosResponse; lấy data.data nếu có
                const payload = (data as any)?.data ?? data;
                const list = normalizePayments(payload);
                const onlyPaid = list.filter(
                  (p) => (p?.status ?? "").toString().toLowerCase() === "paid"
                );
                const total = onlyPaid.reduce(
                  (s, p) => s + (Number(p.amount) || 0),
                  0
                );
                return `Đã tải ${onlyPaid.length} giao dịch • Tổng: ${total.toLocaleString("vi-VN")} đ`;
              },
            },
            error: {
              render({ data }) {
                const err: any = data;
                return (
                  err?.response?.data?.message ||
                  err?.message ||
                  "Không tải được dữ liệu doanh thu."
                );
              },
            },
          },
          { autoClose: 2000 }
        );

        const payload = (res as any)?.data ?? res;
        const list = normalizePayments(payload);
        const paidOnly = list.filter(
          (p) => (p?.status ?? "").toString().toLowerCase() === "paid"
        );
        setPaid(paidOnly);
      } else {
        const { data } = await promise;
        const list = normalizePayments(data);
        const paidOnly = list.filter(
          (p) => (p?.status ?? "").toString().toLowerCase() === "paid"
        );
        setPaid(paidOnly);
      }
    } catch (e: any) {
      // Khi không dùng toast.promise thì bắn lỗi tại đây
      if (!withToast) {
        toast.error(
          e?.response?.data?.message ||
            e?.message ||
            "Không tải được dữ liệu doanh thu."
        );
      }
      setPaid([]);
    } finally {
      setLoading(false);
    }
  };

  // Lần đầu load im lặng để đỡ ồn toast
  useEffect(() => {
    fetchPaid(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================
   *  Giao diện
   * =========================== */
  return (
    <div className="space-y-6">
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600">Doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 mb-4">
            <div>
              <label className="text-xs block text-gray-500 mb-1">Từ ngày</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-48"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs block text-gray-500 mb-1">Đến ngày</label>
              <input
                type="date"
                className="border rounded-lg px-3 py-2 w-48"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <Button
              onClick={() => fetchPaid(true)}
              className="inline-flex items-center gap-2 disabled:opacity-60"
              disabled={loading}
              title="Làm mới"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-orange-200 p-4 text-center bg-orange-50">
              <div className="text-sm text-gray-600 mb-1">Doanh thu</div>
              <div className="text-2xl font-bold text-orange-600">
                {revenue.toLocaleString("vi-VN")} đ
              </div>
            </div>
            <div className="rounded-xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Số giao dịch</div>
              <div className="text-2xl font-bold">{paid.length}</div>
            </div>
            <div className="rounded-xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Tỷ lệ tiền mặt</div>
              <div className="text-2xl font-bold">
                {paid.length ? Math.round((cashCount * 100) / paid.length) : 0}%
              </div>
            </div>
            <div className="rounded-xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">ARPS</div>
              <div className="text-2xl font-bold">
                {arps.toLocaleString("vi-VN")} đ
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Payment</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Swap</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Số tiền</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Method</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">PaidAt</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Đang tải...
                    </td>
                  </tr>
                )}
                {!loading && paid.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
                {paid.map((p) => (
                  <tr key={p.paymentId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{p.paymentId}</td>
                    <td className="px-4 py-3">{p.swapId || "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      {(Number(p.amount) || 0).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3">{p.method || "—"}</td>
                    <td className="px-4 py-3">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString("vi-VN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
