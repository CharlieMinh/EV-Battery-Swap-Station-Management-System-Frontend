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

export default function Transactions() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [pending, setPending] = useState<Payment[]>([]);
  const [paid, setPaid] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const toastOpts = {
    position: "top-right" as const,
    autoClose: 2200,
    closeOnClick: true,
  };

  // ✅ Đảm bảo MỖI hành động chỉ có 1 toast (ghi đè bằng toastId)
  const TOAST_ID = {
    fetch: "txn-fetch",
    confirm: "txn-confirm",
    finish: "txn-finish",
  };
  const tFetch = {
    success: (msg: string) => toast.success(msg, { ...toastOpts, toastId: TOAST_ID.fetch }),
    error: (msg: string) => toast.error(msg, { ...toastOpts, toastId: TOAST_ID.fetch }),
  };
  const tConfirm = {
    success: (msg: string) => toast.success(msg, { ...toastOpts, toastId: TOAST_ID.confirm }),
    error: (msg: string) => toast.error(msg, { ...toastOpts, toastId: TOAST_ID.confirm }),
  };
  const tFinish = {
    success: (msg: string) => toast.success(msg, { ...toastOpts, toastId: TOAST_ID.finish }),
    error: (msg: string) => toast.error(msg, { ...toastOpts, toastId: TOAST_ID.finish }),
  };

  const fetchAll = async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    setLoading(true);
    setErr("");
    try {
      const { data } = await listAllPayments({
        fromDate: from || undefined,
        toDate: to || undefined,
        page: 1,
        pageSize: 500,
      });

      const all: Payment[] = Array.isArray(data) ? data : [];
      const pend = all.filter((p) => (p.status || "").toLowerCase() === "pending");
      const paidList = all.filter((p) => (p.status || "").toLowerCase() === "paid");

      setPending(pend);
      setPaid(paidList);

      if (!silent) {
        tFetch.success(`Đã tải ${pend.length} pending, ${paidList.length} đã thanh toán.`);
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Không tải được danh sách giao dịch.";
      setErr("Không tải được danh sách giao dịch.");
      setPending([]);
      setPaid([]);
      if (!silent) tFetch.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(); // giữ hành vi cũ: hiển thị 1 toast khi mở trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmCash = async (p: Payment) => {
    try {
      await completeCashPayment(p.paymentId);
      tConfirm.success("Đã xác nhận thanh toán tiền mặt.");
      await fetchAll({ silent: true }); // tránh thêm toast thứ 2 khi làm mới
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Xác nhận tiền mặt thất bại.";
      tConfirm.error(msg);
    }
  };

  const finishSwap = async (p: Payment) => {
    try {
      if (!p.swapId) return;
      await completeSwap(p.swapId);
      tFinish.success("Đã hoàn tất giao dịch.");
      await fetchAll({ silent: true }); // tránh toast trùng
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Hoàn tất giao dịch thất bại.";
      tFinish.error(msg);
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
                onClick={() => fetchAll()} // ❌ bỏ toast.info; fetchAll tự hiển thị 1 toast
                className="inline-flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {err && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
              {err}
            </div>
          )}

          <h3 className="text-lg font-semibold mb-3 text-gray-700">Đang chờ thanh toán</h3>
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
                      {(p.amount || 0).toLocaleString()} đ
                    </td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3">
                      {p.method === "Cash" ? (
                        <Button onClick={() => confirmCash(p)} size="sm">
                          Xác nhận tiền mặt
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500">Chờ cổng thanh toán</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                      {(p.amount || 0).toLocaleString()} đ
                    </td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => finishSwap(p)}
                        size="sm"
                        className="bg-black text-white"
                      >
                        <Check className="h-4 w-4 mr-1" /> Hoàn tất
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
