// src/components/staff/Revenue.tsx
import React, { useEffect, useMemo, useState } from "react";
import { listAllPayments, type Payment } from "../../services/staff/staffApi";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "react-toastify";

function normalizePayments(payload: any): Payment[] {
  // Chấp nhận nhiều dạng gói dữ liệu phổ biến (GIỮ NGUYÊN)
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

const toastOpts = { position: "top-right" as const, autoClose: 2200, closeOnClick: true };
// ✅ Mỗi hành động chỉ 1 toast: dùng toastId để tránh trùng lặp
const TOAST_ID = {
  fetchOk: "rev-fetch-ok",
  fetchErr: "rev-fetch-err",
  refreshInfo: "rev-refresh-info",
};

export default function Revenue() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
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
      const paidOnly = list.filter(
        (p) => (p?.status ?? "").toString().toLowerCase() === "paid"
      );

      setPaid(paidOnly);

      // ✅ Chỉ 1 thông báo thành công
      toast.success(
        paidOnly.length
          ? `Đã tải ${paidOnly.length} giao dịch đã thanh toán.`
          : "Không có giao dịch đã thanh toán trong khoảng ngày đã chọn.",
        { ...toastOpts, toastId: TOAST_ID.fetchOk }
      );
    } catch (e: any) {
      console.error("Load revenue error:", e);
      setErr("Không tải được dữ liệu doanh thu.");
      setPaid([]);

      // ❌ Chỉ 1 thông báo lỗi
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

  const revenue = useMemo(
    () => paid.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [paid]
  );
  const cashCount = useMemo(
    () => paid.filter((p) => p?.method === "Cash").length,
    [paid]
  );
  const arps = useMemo(
    () => (paid.length ? Math.round(revenue / paid.length) : 0),
    [revenue, paid.length]
  );

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
              onClick={() => {
                toast.info("Đang làm mới dữ liệu...", {
                  ...toastOpts,
                  toastId: TOAST_ID.refreshInfo,
                });
                fetchPaid();
              }}
              className="inline-flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>

          {/* UI báo lỗi cũ giữ nguyên (không phát thêm toast ở đây) */}
          {err && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-orange-200 p-4 text-center bg-orange-50">
              <div className="text-sm text-gray-600 mb-1">Doanh thu</div>
              <div className="text-2xl font-bold text-orange-600">
                {revenue.toLocaleString()} đ
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
              <div className="text-2xl font-bold">{arps.toLocaleString()} đ</div>
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
                      {(Number(p.amount) || 0).toLocaleString()} đ
                    </td>
                    <td className="px-4 py-3">{p.method || "—"}</td>
                    <td className="px-4 py-3">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"}
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
