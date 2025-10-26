import React, { useEffect, useState } from "react";
import { listPayments, completeCashPayment, completeSwap, type Payment } from "../../services/staff/staffApi";
import { RefreshCw, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export default function Transactions() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [pending, setPending] = useState<Payment[]>([]);
  const [paid, setPaid] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await listPayments({
        fromDate: from || undefined,
        toDate: to || undefined,
        page: 1,
        pageSize: 500,
      });

      const all: Payment[] = Array.isArray(data) ? data : [];
      setPending(all.filter((p) => (p.status || "").toLowerCase() === "pending"));
      setPaid(all.filter((p) => (p.status || "").toLowerCase() === "paid"));
    } catch (e: any) {
      console.error("Load payments error:", e);
      setErr("Không tải được danh sách giao dịch.");
      setPending([]);
      setPaid([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmCash = async (p: Payment) => {
    try {
      await completeCashPayment(p.paymentId);
      await fetchAll();
    } catch (e) {
      alert("Xác nhận tiền mặt thất bại.");
    }
  };

  const finishSwap = async (p: Payment) => {
    try {
      if (!p.swapId) return;
      await completeSwap(p.swapId);
      await fetchAll();
      alert("Đã hoàn tất giao dịch.");
    } catch (e) {
      alert("Hoàn tất giao dịch thất bại.");
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
                <input type="date" className="border rounded-lg px-3 py-2 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs block text-gray-500 mb-1">Đến ngày</label>
                <input type="date" className="border rounded-lg px-3 py-2 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <Button onClick={fetchAll} className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">{err}</div>}

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
                    <td className="px-4 py-3 font-medium">{(p.amount || 0).toLocaleString()} đ</td>
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
                    <td className="px-4 py-3 font-medium">{(p.amount || 0).toLocaleString()} đ</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3">{p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      <Button onClick={() => finishSwap(p)} size="sm" className="bg-black text-white">
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
