// src/components/staff/InventoryManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  getStationInventory,            // ⭐ dùng thay cho stationBatteryStats
  listStationBatteries,           // vẫn giữ để tương thích nếu cần refetch riêng
  createReplenishmentRequest,
  type StationBatteryStats,
  type BatteryUnit,
  STATUS_LABELS_VI,
} from "../../services/staff/staffApi";
import { AlertTriangle, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

type ReqItem = { batteryModelId: string; quantityRequested: number };
type Props = { stationId: string | number };

// ====== Filter trạng thái (giá trị dùng key EN để so sánh) ======
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

// ====== Helpers chuẩn hoá trạng thái & hiển thị VI ======
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

export default function InventoryManagement({ stationId }: Props) {
  // ====== Stats & danh sách ======
  const [stats, setStats] = useState<StationBatteryStats | null>(null);
  const [all, setAll] = useState<BatteryUnit[]>([]); // toàn bộ để tính header + lọc
  const [list, setList] = useState<BatteryUnit[]>([]); // sau khi lọc để render
  const [loading, setLoading] = useState(false);

  // ====== Bộ lọc ======
  const [status, setStatus] = useState<string>("");       // theo STATUS_OPTIONS
  const [modelFilter, setModelFilter] = useState<string>(""); // "" = tất cả
  const [search, setSearch] = useState<string>("");       // search serial

  // ====== Replenishment request ======
  const [reqOpen, setReqOpen] = useState(false);
  const [reqItems, setReqItems] = useState<ReqItem[]>([
    { batteryModelId: "", quantityRequested: 0 },
  ]);
  const [reason, setReason] = useState("");

  // ====== Fetcher: lấy đúng trạm qua BatteryUnits (header không đổi khi lọc) ======
  const fetchInventory = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      // ⭐ lấy cả list + stats trực tiếp từ BatteryUnits (đúng trạm)
      const { list: l, stats: s } = await getStationInventory(stationId);
      setAll(l ?? []);
      setStats(s ?? null);
    } catch {
      // fallback: thử lấy raw list, tự tính sau
      try {
        const { data } = await listStationBatteries(stationId);
        setAll(Array.isArray(data) ? data : []);
        setStats(null); // sẽ tự tính ở header
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  // Lọc danh sách hiển thị (KHÔNG ảnh hưởng tới header)
  useEffect(() => {
    const s = (search || "").trim().toLowerCase();
    const filtered = all
      .filter((b) => {
        if (!status) return true;
        if (status === "Reserved") return isReservedFlag(b);
        return normStatus(b.status) === status;
      })
      .filter((b) =>
        modelFilter ? (b.batteryModelId || b.batteryModelName) === modelFilter : true
      )
      .filter((b) =>
        s ? (b.serialNumber || "").toLowerCase().includes(s) : true
      );

    setList(filtered);
  }, [all, status, modelFilter, search]);

  // Danh sách model từ `all`
  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of all)
      set.add((b.batteryModelId || b.batteryModelName || "").toString());
    return Array.from(set).filter(Boolean);
  }, [all]);

  // ====== Header totals (ưu tiên số từ stats; nếu chưa có → tự tính từ all) ======
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

    // Fallback: đếm từ toàn bộ `all` (đúng yêu cầu "tổng không đổi khi lọc")
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

  const lowStock = useMemo(
    () => header.available + header.charging < 20,
    [header.available, header.charging]
  );
  const toNum = (v: unknown) =>
    typeof v === "number" && !isNaN(v as number) ? (v as number) : 0;

  // ====== Submit yêu cầu nhập pin (GIỮ LOGIC) ======
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
      fetchInventory(); // refresh lại thống kê
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gửi yêu cầu nhập pin thất bại.";
      toast.error(msg, { ...toastOpts, toastId: "inv-req-error" });
    }
  };

  // ====== UI ======
  return (
    <div className="grid gap-6">
      {/* Header tổng quan (không đổi khi lọc bảng) */}
      <section className="rounded-2xl bg-white shadow-lg p-5">
        <h3 className="text-lg font-semibold mb-4">Tổng quan kho</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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
              className="rounded-xl border p-3 text-center bg-white"
            >
              <div className="text-xs text-gray-500">{k.label}</div>
              <div className="text-xl font-semibold">{toNum(k.value)}</div>
            </div>
          ))}
        </div>

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

      {/* Danh sách pin + bộ lọc */}
      <section className="rounded-2xl bg-white shadow-lg p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Danh sách pin</h3>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="w-56 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Tìm serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="w-52 rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            >
              <option value="">Tất cả model</option>
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <select
              className="w-48 rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "ALL"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 w-16">STT</th>
                <th className="px-3 py-2">Serial</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2">Trạng thái</th>
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
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-gray-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              )}

              {list.map((b, idx) => (
                <tr
                  key={b.batteryId || b.serialNumber || `row-${idx}`}
                  className="border-t"
                >
                  <td className="px-3 py-2">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono">
                    {b.serialNumber || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {b.batteryModelName || b.batteryModelId || "—"}
                  </td>
                  <td className="px-3 py-2">{displayStatusVI(b.status)}</td>
                  <td className="px-3 py-2">
                    {b.updatedAt
                      ? new Date(b.updatedAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal yêu cầu nhập pin (giữ logic) */}
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
                            i === idx
                              ? { ...x, batteryModelId: e.target.value }
                              : x
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
                              ? {
                                  ...x,
                                  quantityRequested: Number(e.target.value),
                                }
                              : x
                          )
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        setReqItems((arr) => arr.filter((_, i) => i !== idx))
                      }
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

            <div className="mt-3 text-xs text-gray-500">
              Mẹo: thêm nhiều dòng để yêu cầu nhiều model khác nhau.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
