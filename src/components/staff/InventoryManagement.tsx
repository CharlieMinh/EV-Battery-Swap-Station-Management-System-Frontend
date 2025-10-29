import React, { useEffect, useMemo, useState } from "react";
import { listStationBatteries, type BatteryUnit } from "../../services/staff/staffApi";

/* ====== Bộ lọc trạng thái (nhãn tiếng Việt) ====== */
const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Sẵn sàng", value: "Available" },
  { label: "Đang sử dụng", value: "InUse" },
  { label: "Đang sạc", value: "Charging" },
  { label: "Bảo trì", value: "Maintenance" },
  { label: "Đã đặt trước", value: "Reserved" },
  { label: "Lỗi", value: "Faulty" },
  { label: "Hết pin", value: "Depleted" },
];

/* ====== Map hiển thị tiếng Việt ====== */
const VI_STATUS_MAP: Record<string, string> = {
  full: "Đầy",
  available: "Sẵn sàng",
  ready: "Sẵn sàng",
  inuse: "Đang sử dụng",
  charging: "Đang sạc",
  maintenance: "Bảo trì",
  reserved: "Đã đặt trước",
  faulty: "Lỗi",
  depleted: "Hết pin",
};
function viStatus(s?: string) {
  const k = (s || "").trim().toLowerCase();
  return VI_STATUS_MAP[k] || s || "—";
}

/* Nhóm trạng thái để lọc (gộp các biến thể) */
function normalizeGroup(raw?: string) {
  const s = (raw || "").trim().toLowerCase();
  if (["available", "ready", "full"].includes(s)) return "Available";
  if (s === "inuse") return "InUse";
  if (s === "charging") return "Charging";
  if (s === "maintenance") return "Maintenance";
  if (s === "reserved") return "Reserved";
  if (s === "faulty") return "Faulty";
  if (s === "depleted") return "Depleted";
  return "";
}

export default function InventoryManagement({ stationId }: { stationId: string | number }) {
  const [allList, setAllList] = useState<BatteryUnit[]>([]);
  const [loading, setLoading] = useState(false);

  // === Bộ lọc ===
  const [status, setStatus] = useState<string>("");      // lọc theo trạng thái
  const [model, setModel] = useState<string>("");        // lọc theo model
  const [q, setQ] = useState<string>("");                // search serial

  // Lấy dữ liệu gốc
  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await listStationBatteries(stationId);
      setAllList(Array.isArray(data) ? data : []);
    } catch {
      setAllList([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchList(); }, [stationId]);

  // Danh sách model để lọc (từ toàn bộ dữ liệu, không phụ thuộc filter)
  const modelOptions = useMemo(() => {
    const names = new Set<string>();
    allList.forEach(b => names.add((b.batteryModelName || b.batteryModelId || "").trim()));
    return ["", ...Array.from(names).filter(Boolean)];
  }, [allList]);

  // Áp bộ lọc: trạng thái + model + search serial
  const list = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return allList.filter(b => {
      const byStatus = !status || normalizeGroup(b.status) === status;
      const byModel  = !model || (b.batteryModelName || b.batteryModelId) === model;
      const bySerial = !qLower || (b.serialNumber || "").toLowerCase().includes(qLower);
      return byStatus && byModel && bySerial;
    });
  }, [allList, status, model, q]);

  // Tổng kho (không đổi khi lọc)
  const stats = useMemo(() => {
    const by = (v: string) => allList.filter(b => normalizeGroup(b.status) === v).length;
    return {
      total:      allList.length,
      available:  by("Available"),
      inUse:      by("InUse"),
      charging:   by("Charging"),
      maintenance:by("Maintenance"),
      reserved:   by("Reserved"),
      faulty:     by("Faulty"),
      depleted:   by("Depleted"),
    };
  }, [allList]);

  return (
    <div className="space-y-6">
      {/* Tổng quan kho */}
      <section className="rounded-2xl bg-white shadow p-5">
        <h3 className="text-lg font-semibold mb-4">Tổng quan kho</h3>
        <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
          {[
            { label: "Tổng", value: stats.total },
            { label: "Sẵn sàng", value: stats.available },
            { label: "Đang sử dụng", value: stats.inUse },
            { label: "Đang sạc", value: stats.charging },
            { label: "Bảo trì", value: stats.maintenance },
            { label: "Đã đặt trước", value: stats.reserved },
            { label: "Lỗi", value: stats.faulty },
            { label: "Hết pin", value: stats.depleted },
          ].map(k => (
            <div key={k.label} className="rounded-xl border p-3 text-center bg-white">
              <div className="text-xs text-gray-500">{k.label}</div>
              <div className="text-xl font-semibold">{k.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bộ lọc + bảng */}
      <section className="rounded-2xl bg-white shadow p-5">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold">Danh sách pin</h3>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            {/* Tìm serial */}
            <input
              placeholder="Tìm serial…"
              className="border rounded-lg px-3 py-2 w-[220px]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {/* Lọc model */}
            <select
              className="border rounded-lg px-3 py-2 w-[240px]"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              title="Lọc theo model pin"
            >
              <option value="">Tất cả model</option>
              {modelOptions.slice(1).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {/* Lọc trạng thái */}
            <select
              className="border rounded-lg px-3 py-2 w-[180px]"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              title="Lọc theo trạng thái"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 w-16 text-center">STT</th>
                <th className="px-3 py-2">Serial</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center">Đang tải...</td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">Không có dữ liệu</td>
                </tr>
              ) : (
                list.map((b, i) => (
                  <tr key={b.batteryId || b.serialNumber || i} className="border-t">
                    <td className="text-center px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{b.serialNumber || "—"}</td>
                    <td className="px-3 py-2">{b.batteryModelName || b.batteryModelId || "—"}</td>
                    <td className="px-3 py-2">{viStatus(b.status)}</td>
                    <td className="px-3 py-2">
                      {b.updatedAt ? new Date(b.updatedAt).toLocaleString("vi-VN") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
