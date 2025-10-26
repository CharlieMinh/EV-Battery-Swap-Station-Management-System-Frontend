import React, { useEffect, useMemo, useState } from "react";
import { listPayments, type Payment } from "../../services/staff/staffApi";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

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
      const { data } = await listPayments({
        fromDate: from || undefined,
        toDate: to || undefined,
        page: 1,
        pageSize: 500,
      });
      // listPayments giờ TRẢ VỀ Payment[] đã chuẩn hoá
      setPaid((data || []).filter((p) => (p.status || "").toLowerCase() === "paid"));
    } catch (e) {
      console.error("Load revenue error:", e);
      setErr("Không tải được dữ liệu doanh thu.");
      setPaid([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const revenue = useMemo(() => paid.reduce((s, p) => s + (p.amount || 0), 0), [paid]);
  const cashCount = useMemo(() => paid.filter((p) => p.method === "Cash").length, [paid]);
  const arps = useMemo(() => (paid.length ? Math.round(revenue / paid.length) : 0), [revenue, paid.length]);

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
              <input type="date" className="border rounded-lg px-3 py-2 w-48" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs block text-gray-500 mb-1">Đến ngày</label>
              <input type="date" className="border rounded-lg px-3 py-2 w-48" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button onClick={fetchPaid} className="inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>

          {err && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-2 text-sm">{err}</div>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-orange-200 p-4 text-center bg-orange-50">
              <div className="text-sm text-gray-600 mb-1">Doanh thu</div>
              <div className="text-2xl font-bold text-orange-600">{revenue.toLocaleString()} đ</div>
            </div>
            <div className="rounded-xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Số giao dịch</div>
              <div className="text-2xl font-bold">{paid.length}</div>
            </div>
            <div className="rounded-xl border border-orange-200 p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Tỷ lệ tiền mặt</div>
              <div className="text-2xl font-bold">{paid.length ? Math.round((cashCount * 100) / paid.length) : 0}%</div>
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
                    <td className="px-4 py-3 font-medium">{(p.amount || 0).toLocaleString()} đ</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3">{p.paidAt ? new Date(p.paidAt).toLocaleString() : "—"}</td>
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
