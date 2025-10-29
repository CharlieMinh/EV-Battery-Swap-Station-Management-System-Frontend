// src/components/staff/Transactions.tsx
import React, { useEffect, useState } from "react";
import {
  listAllPayments,
  completeCashPayment,
  completeSwap,
  type Payment,
} from "../../services/staff/staffApi";
import { RefreshCw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { toast } from "react-toastify";

/* ===========================
 *  Helper: Chuẩn hoá dữ liệu
 * =========================== */
function normalizePayments(payload: any): Payment[] {
  if (Array.isArray(payload)) return payload as Payment[];
  const p = payload && typeof payload === "object" ? payload : {};
  if (Array.isArray((p as any).data)) return (p as any).data as Payment[];
  if (Array.isArray((p as any).items)) return (p as any).items as Payment[];
  if (Array.isArray((p as any).results)) return (p as any).results as Payment[];
  if (Array.isArray((p as any).value)) return (p as any).value as Payment[];
  if (Array.isArray((p as any).records)) return (p as any).records as Payment[];
  return [];
}

export default function Transactions() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [pending, setPending] = useState<Payment[]>([]);
  const [paid, setPaid] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Trạng thái thao tác theo từng item
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [finishingId, setFinishingId] = useState<string | null>(null);

  const splitPaidPending = (all: Payment[]) => {
    const pend = all.filter((p) => (p?.status || "").toString().toLowerCase() === "pending");
    const paidList = all.filter((p) => (p?.status || "").toString().toLowerCase() === "paid");
    setPending(pend);
    setPaid(paidList);
  };

  const fetchAll = async (withToast = false) => {
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
            pending: "Đang tải danh sách giao dịch...",
            success: {
              render({ data }) {
                const payload = (data as any)?.data ?? data;
                const all = normalizePayments(payload);
                const paidOnly = all.filter((p) => (p?.status || "").toLowerCase() === "paid");
                const total = paidOnly.reduce((s, p) => s + (Number(p.amount) || 0), 0);
                return `Đã tải ${all.length} giao dịch • Đã thanh toán: ${paidOnly.length} • Tổng: ${total.toLocaleString("vi-VN")} đ`;
              },
            },
            error: {
              render({ data }) {
                const err: any = data;
                return (
                  err?.response?.data?.message ||
                  err?.message ||
                  "Không tải được danh sách giao dịch."
                );
              },
            },
          },
          { autoClose: 2000 }
        );
        const payload = (res as any)?.data ?? res;
        const all = normalizePayments(payload);
        splitPaidPending(all);
      } else {
        const { data } = await promise;
        const all = normalizePayments(data);
        splitPaidPending(all);
      }
    } catch (e: any) {
      if (!withToast) {
        toast.error(
          e?.response?.data?.message || e?.message || "Không tải được danh sách giao dịch."
        );
      }
      setPending([]);
      setPaid([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmCash = async (p: Payment) => {
    if (confirmingId) return;
    setConfirmingId(p.paymentId);

    const tId = toast.loading("Đang xác nhận thanh toán tiền mặt...");
    try {
      await completeCashPayment(p.paymentId);
      toast.update(tId, {
        render: "✅ Xác nhận tiền mặt thành công.",
        type: "success",
        isLoading: false,
        autoClose: 1800,
      });
      await fetchAll(); // im lặng
    } catch (e: any) {
      toast.update(tId, {
        render:
          e?.response?.data?.message ||
          e?.message ||
          "❌ Xác nhận tiền mặt thất bại.",
        type: "error",
        isLoading: false,
        autoClose: 2200,
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const finishSwap = async (p: Payment) => {
    if (!p.swapId) {
      toast.info("Giao dịch này không có mã swap để hoàn tất.");
      return;
    }
    if (finishingId) return;
    setFinishingId(p.paymentId);

    const tId = toast.loading("Đang hoàn tất giao dịch swap...");
    try {
      await completeSwap(p.swapId);
      toast.update(tId, {
        render: "✅ Đã hoàn tất giao dịch.",
        type: "success",
        isLoading: false,
        autoClose: 1800,
      });
      await fetchAll(); // im lặng
    } catch (e: any) {
      toast.update(tId, {
        render:
          e?.response?.data?.message ||
          e?.message ||
          "❌ Hoàn tất giao dịch thất bại.",
        type: "error",
        isLoading: false,
        autoClose: 2200,
      });
    } finally {
      setFinishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-orange-600">Giao dịch</CardTitle>
            <div className="flex items-end gap-2">
              <div>
                <label className="text-xs block text-gray-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 w-40"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs block text-gray-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 w-40"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <Button
                onClick={() => fetchAll(true)}
                className="inline-flex items-center gap-2 disabled:opacity-60"
                disabled={loading}
                title="Làm mới"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Pending */}
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Đang chờ thanh toán
          </h3>
          <div className="overflow-x-auto rounded-xl border mb-6">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Payment</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Swap</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Số tiền</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Method</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Thao tác</th>
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
                {!loading && pending.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Không có payment pending
                    </td>
                  </tr>
                )}
                {pending.map((p) => (
                  <tr key={p.paymentId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{p.paymentId}</td>
                    <td className="px-4 py-3">{p.swapId || "—"}</td>
                    <td className="px-4 py-3 font-medium">
                      {(Number(p.amount) || 0).toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-4 py-3">{p.method || "—"}</td>
                    <td className="px-4 py-3">
                      {p.method === "Cash" ? (
                        <Button
                          onClick={() => confirmCash(p)}
                          size="sm"
                          disabled={!!confirmingId}
                          title="Xác nhận đã thu tiền mặt"
                        >
                          {confirmingId === p.paymentId ? "Đang xác nhận..." : "Xác nhận tiền mặt"}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Chờ cổng thanh toán
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paid */}
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Đã thanh toán</h3>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Payment</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Swap</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Số tiền</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Method</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 text-gray-600 font-semibold">Hoàn tất</th>
                </tr>
              </thead>
              <tbody>
                {!loading && paid.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
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
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => finishSwap(p)}
                        size="sm"
                        className="bg-black text-white"
                        disabled={!!finishingId}
                        title="Đánh dấu giao dịch đã hoàn tất"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {finishingId === p.paymentId ? "Đang hoàn tất..." : "Hoàn tất"}
                      </Button>
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
