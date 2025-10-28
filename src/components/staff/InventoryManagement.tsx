// src/components/staff/InventoryManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  stationBatteryStats,
  listStationBatteries,
  createReplenishmentRequest,
  type StationBatteryStats,
  type BatteryUnit,
  STATUS_LABELS_VI,
} from "../../services/staff/staffApi";
import { AlertTriangle, Plus, X } from "lucide-react";

type ReqItem = { batteryModelId: string; quantityRequested: number };
type Props = { stationId: string | number };

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Sẵn sàng", value: "Available" },
  { label: "Đang sử dụng", value: "InUse" },
  { label: "Đang sạc", value: "Charging" },
  { label: "Bảo trì", value: "Maintenance" },
  { label: "Đã đặt trước", value: "Reserved" },
  { label: "Lỗi", value: "Faulty" },
];

export default function InventoryManagement({ stationId }: Props) {
  const [stats, setStats] = useState<StationBatteryStats | null>(null);
  const [list, setList] = useState<BatteryUnit[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [reqOpen, setReqOpen] = useState(false);
  const [reqItems, setReqItems] = useState<ReqItem[]>([
    { batteryModelId: "", quantityRequested: 0 },
  ]);
  const [reason, setReason] = useState("");

  /* ---------- Helpers ---------- */
  const toNum = (v: unknown) => (typeof v === "number" && !isNaN(v) ? v : 0);

  /** Map trạng thái hiển thị: Reserved -> Available (để không lẫn với cột Đặt trước) */
  const displayStatus = (b: BatteryUnit) => {
    const raw = b.status || "";
    if (raw === "Reserved") return STATUS_LABELS_VI["Available"] || "Sẵn sàng";
    return STATUS_LABELS_VI[raw as keyof typeof STATUS_LABELS_VI] ?? raw ?? "—";
  };

  /** Điều kiện lọc theo status người dùng chọn */
  const matchesStatus = (b: BatteryUnit, s: string) => {
    if (!s) return true;
    if (s === "Reserved") return Boolean(b.isReserved || b.status === "Reserved");
    return (b.status || "") === s;
  };

  /** Flag đặt trước dùng cho cột riêng */
  const isReservedFlag = (b: BatteryUnit) => Boolean(b.isReserved || b.status === "Reserved");

  /* ---------- Fetchers ---------- */
  const fetchStats = async () => {
    if (!stationId) return;
    try {
      const { data } = await stationBatteryStats(stationId);
      setStats(data ?? null);
    } catch {
      setStats(null);
    }
  };

  const fetchList = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const { data } = await listStationBatteries(stationId);
      const base = Array.isArray(data) ? data : [];
      setList(base.filter((b) => matchesStatus(b, status)));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, status]);

  /* ---------- Derived numbers ---------- */
  const total = toNum(stats?.total ?? stats?.totalBatteries ?? 0);
  const available = toNum(stats?.available ?? stats?.availableBatteries ?? 0);
  const inUse = toNum(stats?.inUse ?? 0);
  const charging = toNum(stats?.charging ?? 0);
  const maintenance = toNum(stats?.maintenance ?? 0);
  const reserved = toNum(stats?.reserved ?? 0);
  const exportedToday =
    typeof stats?.exportedToday === "number" ? stats.exportedToday : undefined;

  const lowStock = useMemo(() => available + charging < 20, [available, charging]);

  /* ---------- Replenishment request ---------- */
  const addReqItem = () =>
    setReqItems((x) => [...x, { batteryModelId: "", quantityRequested: 0 }]);

  const removeReqItem = (i: number) =>
    setReqItems((arr) => arr.filter((_, idx) => idx !== i));

  const submitRequest = async () => {
    const items = reqItems
      .map((x) => ({
        batteryModelId: x.batteryModelId,
        quantityRequested: Number(x.quantityRequested),
      }))
      .filter((x) => x.batteryModelId && x.quantityRequested > 0);

    if (items.length === 0) {
      alert("Thêm ít nhất 1 model và số lượng > 0");
      return;
    }

    await createReplenishmentRequest({ stationId, reason, items });
    alert("Đã gửi yêu cầu nhập pin. Đợi Admin duyệt.");
    setReqOpen(false);
    setReqItems([{ batteryModelId: "", quantityRequested: 0 }]);
    setReason("");
    fetchStats();
  };

  /* ---------- UI ---------- */
  return (
    <div className="grid gap-6">
      {/* Tổng quan kho */}
      <section className="rounded-2xl bg-white shadow-lg p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Tổng quan kho</h3>
          {typeof exportedToday === "number" && (
            <div className="text-sm text-gray-600">
              Đã xuất trong ngày: <b>{exportedToday}</b>
            </div>
          )}
        </div>

        {!stats ? (
          <div className="text-sm text-gray-500">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { label: "Tổng", value: total },
              { label: "Sẵn sàng", value: available },
              { label: "Đang sử dụng (đã xuất)", value: inUse },
              { label: "Đang sạc", value: charging },
              { label: "Bảo trì", value: maintenance },
              { label: "Đã đặt trước", value: reserved },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border p-3 text-center bg-white">
                <div className="text-xs text-gray-500">{k.label}</div>
                <div className="text-xl font-semibold">{k.value ?? 0}</div>
              </div>
            ))}
          </div>
        )}

        {lowStock && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Tồn kho thấp! Hãy gửi yêu cầu nhập pin.
            </div>
            <button
              onClick={() => setReqOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-white hover:bg-gray-800 transition"
            >
              <Plus className="h-4 w-4" />
              Tạo yêu cầu nhập pin
            </button>
          </div>
        )}
      </section>

      {/* Danh sách pin */}
      <section className="rounded-2xl bg-white shadow-lg p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Danh sách pin</h3>
          <select
            className="w-52 rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Serial</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Đặt trước</th>
                <th className="px-3 py-2">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center">
                    Đang tải...
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}

              {list.map((b, idx) => (
                <tr
                  key={b.batteryId || b.serialNumber || `row-${idx}`}
                  className="border-t"
                >
                  <td className="px-3 py-2 font-mono">
                    {b.serialNumber || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {b.batteryModelName || b.batteryModelId || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {displayStatus(b)}
                  </td>
                  <td className="px-3 py-2">
                    {isReservedFlag(b) ? "✅" : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal yêu cầu nhập pin */}
      {reqOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Yêu cầu nhập pin</h3>
              <button
                onClick={() => setReqOpen(false)}
                className="rounded-lg border px-3 py-1 hover:bg-gray-50"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Lý do</label>
              <input
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Ví dụ: Chuẩn bị giờ cao điểm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <div className="mb-2 text-sm font-medium">
                Danh sách model & số lượng
              </div>
              <div className="flex flex-col gap-2">
                {reqItems.map((it, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="BatteryModelId (VD: MOD-48V-30)"
                      value={it.batteryModelId}
                      onChange={(e) =>
                        setReqItems((arr) =>
                          arr.map((x, i) =>
                            i === idx ? { ...x, batteryModelId: e.target.value } : x
                          )
                        )
                      }
                    />
                    <input
                      type="number"
                      className="w-36 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Số lượng"
                      value={it.quantityRequested}
                      onChange={(e) =>
                        setReqItems((arr) =>
                          arr.map((x, i) =>
                            i === idx
                              ? { ...x, quantityRequested: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                    />
                    <button
                      onClick={() => removeReqItem(idx)}
                      className="rounded-lg border px-3 py-2 hover:bg-gray-50"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-right mt-3">
                <button
                  onClick={submitRequest}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 transition"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
