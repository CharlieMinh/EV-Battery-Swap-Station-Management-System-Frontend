// src/components/staff/InventoryManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getStationInventory,
  listStationBatteries,
  createReplenishmentRequest,
  type StationBatteryStats,
  type BatteryUnit,
  STATUS_LABELS_VI,
} from "../../services/staff/staffApi";
import { AlertTriangle, Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
  { label: "Hết pin", value: "Depleted" },
];

const toastOpts = { position: "top-right" as const, autoClose: 2200, closeOnClick: true };

/* ========= GIỮ NGUYÊN LOGIC ========= */
const normStatus = (s?: string) => {
  const x = (s || "").trim().toLowerCase();
  if (["full", "đầy", "available", "sẵn sàng", "ready"].includes(x)) return "Available";
  if (["inuse", "in use", "đang sử dụng"].includes(x)) return "InUse";
  if (["charging", "đang sạc", "chargingnow"].includes(x)) return "Charging";
  if (["maintenance", "bảo trì", "maintaining"].includes(x)) return "Maintenance";
  if (["reserved", "đã đặt trước"].includes(x)) return "Reserved";
  if (["faulty", "lỗi", "error"].includes(x)) return "Faulty";
  if (["depleted", "hết pin", "empty"].includes(x)) return "Depleted";
  return "";
};

const displayStatusVI = (s?: string) => {
  const k = normStatus(s);
  if (k === "Available") return "Đầy";
  return (
    {
      InUse: "Đang sử dụng",
      Charging: "Đang sạc",
      Maintenance: "Bảo trì",
      Reserved: "Đã đặt trước",
      Faulty: "Lỗi",
      Depleted: "Hết pin",
    }[k as keyof typeof STATUS_LABELS_VI] ||
    (STATUS_LABELS_VI as any)[s || ""] ||
    s ||
    "—"
  );
};

const isReservedFlag = (b: BatteryUnit) =>
  Boolean(b.isReserved || normStatus(b.status) === "Reserved");

function modelKey(b: BatteryUnit): string {
  const id = (b.batteryModelId ?? "").toString().trim().toLowerCase();
  const name = (b.batteryModelName ?? "").toString().trim().toLowerCase();
  return id || name;
}
function modelLabel(b: BatteryUnit): string {
  return (b.batteryModelName || b.batteryModelId || "").toString();
}

/* ========================================================= */

export default function InventoryManagement({ stationId }: Props) {
  const [stats, setStats] = useState<StationBatteryStats | null>(null);
  const [all, setAll] = useState<BatteryUnit[]>([]);
  const [list, setList] = useState<BatteryUnit[]>([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const [reqOpen, setReqOpen] = useState(false);
  const [reqItems, setReqItems] = useState<ReqItem[]>([
    { batteryModelId: "", quantityRequested: 0 },
  ]);
  const [reason, setReason] = useState("");

  /* ====== FETCH (GIỮ LOGIC) ====== */
  const fetchInventory = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const { list: l, stats: s } = await getStationInventory(stationId);
      setAll(l ?? []);
      setStats(s ?? null);
    } catch {
      try {
        const { data } = await listStationBatteries(stationId);
        setAll(Array.isArray(data) ? data : []);
        setStats(null);
      } catch {
        setAll([]);
        setStats(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [stationId]);

  /* ====== FILTER (GIỮ LOGIC) ====== */
  useEffect(() => {
    const s = (search || "").trim().toLowerCase();
    const filtered = all
      .filter((b) => {
        if (!status) return true;
        if (status === "Reserved") return isReservedFlag(b);
        return normStatus(b.status) === status;
      })
      .filter((b) => (modelFilter ? modelKey(b) === modelFilter : true))
      .filter((b) => (s ? (b.serialNumber || "").toLowerCase().includes(s) : true));
    setList(filtered);
  }, [all, status, modelFilter, search]);

  /* ====== MODEL OPTIONS ====== */
  const modelOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of all) {
      const key = modelKey(b);
      if (!key) continue;
      if (!map.has(key)) map.set(key, modelLabel(b));
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [all]);

  /* ====== HEADER TOTAL ====== */
  const n = (v: any) => (typeof v === "number" && !Number.isNaN(v) ? v : 0);
  const apiTotals = {
    total: n(stats?.total ?? stats?.totalBatteries),
    available: n(stats?.available ?? stats?.availableBatteries),
    inUse: n(stats?.inUse),
    charging: n(stats?.charging),
    maintenance: n(stats?.maintenance),
    reserved: n(stats?.reserved),
  };

  const header = useMemo(() => {
    const hasAny =
      apiTotals.total ||
      apiTotals.available ||
      apiTotals.inUse ||
      apiTotals.charging ||
      apiTotals.maintenance ||
      apiTotals.reserved;

    if (hasAny) return apiTotals;

    let total = all.length,
      available = 0,
      inUse = 0,
      charging = 0,
      maintenance = 0,
      reserved = 0;

    for (const b of all) {
      const k = normStatus(b.status);
      if (k === "Available") available++;
      else if (k === "InUse") inUse++;
      else if (k === "Charging") charging++;
      else if (k === "Maintenance") maintenance++;
      if (isReservedFlag(b)) reserved++;
    }
    return { total, available, inUse, charging, maintenance, reserved };
  }, [apiTotals, all]);

  const lowStock = header.available + header.charging < 20;

  /* ====== REQUEST PIN (KEEP LOGIC) ====== */
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
      toast.warning("Thêm ít nhất 1 model và số lượng > 0", {
        ...toastOpts,
        toastId: "inv-req-validate",
      });
      return;
    }

    try {
      await createReplenishmentRequest({ stationId, reason, items });
      toast.success("Đã gửi yêu cầu nhập pin. Đợi Admin duyệt.", {
        ...toastOpts,
        toastId: "inv-req-success",
      });
      setReqOpen(false);
      setReqItems([{ batteryModelId: "", quantityRequested: 0 }]);
      setReason("");
      fetchInventory();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gửi yêu cầu nhập pin thất bại.";
      toast.error(msg, { ...toastOpts, toastId: "inv-req-error" });
    }
  };

  /* ===== UI BADGE ===== */
  const badgeClass = (b: BatteryUnit) => {
    const k = normStatus(b.status);
    if (k === "Available") return "bg-green-100 text-green-700";
    if (k === "Charging") return "bg-blue-100 text-blue-700";
    if (k === "Maintenance") return "bg-gray-200 text-gray-700";
    if (k === "Depleted") return "bg-red-100 text-red-700";
    if (k === "Reserved" || isReservedFlag(b)) return "bg-yellow-100 text-yellow-700";
    if (k === "InUse") return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-700";
  };

  /* ========================================================= */

  return (
    <div className="container mx-auto grid gap-6">

      {/* ✅ CARD TỔNG QUAN (đồng nhất UI Hàng Chờ) */}
      <section className="rounded-2xl bg-white shadow-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-600 mb-1">Tổng quan kho</h2>
        <p className="text-gray-600 text-sm mb-4">Số lượng pin theo trạng thái</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Tổng", value: header.total },
            { label: "Sẵn sàng", value: header.available },
            { label: "Đang sử dụng (đã xuất)", value: header.inUse },
            { label: "Đang sạc", value: header.charging },
            { label: "Bảo trì", value: header.maintenance },
            { label: "Đã đặt trước", value: header.reserved },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 text-center shadow-sm"
            >
              <div className="text-xs text-gray-600 mb-1">{k.label}</div>
              <div className="text-2xl font-semibold">{k.value}</div>
            </div>
          ))}
        </div>

        {lowStock && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Tồn kho thấp! Hãy yêu cầu nhập thêm pin.</span>
            </div>
            <button
              onClick={() => setReqOpen(true)}
              className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Tạo yêu cầu
            </button>
          </div>
        )}
      </section>

      {/* ✅ CARD BỘ LỌC (đồng nhất UI Hàng Chờ) */}
      <section className="rounded-2xl bg-white shadow-lg p-6 border border-orange-200">
        <h3 className="text-xl font-semibold text-orange-600 mb-4">Danh sách pin</h3>

        <div className="flex flex-wrap items-center gap-3 mb-4">

          <input
            className="h-10 w-56 rounded-lg border-2 border-gray-300 px-3 text-sm focus:ring-2 focus:ring-orange-300"
            placeholder="Tìm serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Model */}
          <div className="w-56">
            <Select
              value={modelFilter || "__all__"}
              onValueChange={(val) => setModelFilter(val === "__all__" ? "" : val)}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-2 border-gray-300 px-3 text-sm">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả model</SelectItem>
                {modelOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="w-56">
            <Select
              value={status || "__all__"}
              onValueChange={(val) => setStatus(val === "__all__" ? "" : val)}
            >
              <SelectTrigger className="h-10 w-full rounded-lg border-2 border-gray-300 px-3 text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value || "ALL"} value={o.value || "__all__"}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        {/* ✅ PHẦN BẢNG — GIỮ NGUYÊN */}
        <div className="rounded-xl border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 w-16 text-left">STT</th>
                <th className="px-4 py-3 w-48 text-left">Serial</th>
                <th className="px-4 py-3 w-64 text-left">Model</th>
                <th className="px-4 py-3 w-40 text-left">Trạng thái</th>
                <th className="px-4 py-3 w-48 text-left">Cập nhật</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    Đang tải…
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}

              {!loading &&
                list.map((b, idx) => (
                  <tr
                    key={b.batteryId || b.serialNumber || idx}
                    className="odd:bg-white even:bg-gray-50 hover:bg-orange-50/40"
                  >
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono">{b.serialNumber || "—"}</td>
                    <td className="px-4 py-3">{b.batteryModelName || b.batteryModelId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass(b)}`}>
                        {displayStatusVI(b.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ✅ MODAL YÊU CẦU NHẬP PIN (GIỮ NGUYÊN) */}
      {reqOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Yêu cầu nhập pin</h3>
              <button onClick={() => setReqOpen(false)} className="p-2 hover:bg-gray-50 rounded-lg">
                <X />
              </button>
            </div>

            <label className="block text-sm mb-1">Lý do</label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-4"
              placeholder="VD: Chuẩn bị giờ cao điểm"
            />

            <div className="mb-4">
              <p className="font-medium text-sm mb-2">Danh sách model & số lượng</p>
              {reqItems.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="BatteryModelId"
                    value={item.batteryModelId}
                    onChange={(e) =>
                      setReqItems((arr) =>
                        arr.map((x, idx) =>
                          idx === i ? { ...x, batteryModelId: e.target.value } : x
                        )
                      )
                    }
                  />
                  <input
                    type="number"
                    className="w-32 border rounded-lg px-3 py-2"
                    placeholder="Số lượng"
                    value={item.quantityRequested}
                    onChange={(e) =>
                      setReqItems((arr) =>
                        arr.map((x, idx) =>
                          idx === i ? { ...x, quantityRequested: Number(e.target.value) } : x
                        )
                      )
                    }
                  />
                  <button
                    onClick={() => removeReqItem(i)}
                    className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            <div className="text-right">
              <button
                onClick={submitRequest}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Gửi yêu cầu
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">Bạn có thể thêm nhiều model khác nhau.</p>
          </div>
        </div>
      )}
    </div>
  );
}
