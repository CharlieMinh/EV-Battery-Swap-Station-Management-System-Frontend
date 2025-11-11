import React, { useEffect, useMemo, useState } from "react";
import {
  getStationInventory,
  listStationBatteries,
  createReplenishmentRequest,
  type StationBatteryStats,
  type BatteryUnit,
  STATUS_LABELS_VI,
  updateBatteryStatus,
  type BatteryStatusBackend,
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
import {
  BatteryModel,
  fetchModelBattery,
} from "@/services/admin/batteryService";
import { getCurrentUser } from "@/services/authApi";
import { createStockRequest } from "@/services/staff/stockRequest";
import { fetchStationById } from "@/services/admin/stationService";

type ReqItem = { batteryModelId: string; quantityRequested: number };
type Props = { stationId: string };

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Đầy", value: "Available" },
  { label: "Đang sử dụng", value: "InUse" },
  { label: "Đang sạc", value: "Charging" },
  { label: "Bảo trì", value: "Maintenance" },
  { label: "Đã đặt trước", value: "Reserved" },
  { label: "Lỗi", value: "Faulty" },
  { label: "Hết pin", value: "Depleted" },
];

// ✅ cho modal "Kiểm tra pin": HIỆN TẤT CẢ TRẠNG THÁI
const CHECK_STATUS_OPTIONS: { label: string; value: BatteryStatusBackend }[] = [
  {
    value: "Full",
    label: STATUS_LABELS_VI.Available || "Đầy",
  },
  {
    value: "Reserved",
    label: STATUS_LABELS_VI.Reserved || "Đã đặt trước",
  },
  {
    value: "InUse",
    label: STATUS_LABELS_VI.InUse || "Đang sử dụng",
  },
  {
    value: "Charging",
    label: STATUS_LABELS_VI.Charging || "Đang sạc",
  },
  {
    value: "Depleted",
    label: STATUS_LABELS_VI.Depleted || "Hết pin",
  },
  {
    value: "Maintenance",
    label: STATUS_LABELS_VI.Maintenance || "Bảo trì",
  },
  {
    value: "Faulty",
    label: STATUS_LABELS_VI.Faulty || "Lỗi",
  },
];

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};

/* ========= GIỮ NGUYÊN LOGIC ========= */
const normStatus = (s?: string) => {
  const x = (s || "").trim().toLowerCase();
  if (["full", "đầy", "available", "sẵn sàng", "ready"].includes(x))
    return "Available";
  if (["inuse", "in use", "đang sử dụng"].includes(x)) return "InUse";
  if (["charging", "đang sạc", "chargingnow"].includes(x)) return "Charging";
  if (["maintenance", "bảo trì", "maintaining"].includes(x))
    return "Maintenance";
  if (["reserved", "đã đặt trước"].includes(x)) return "Reserved";
  if (["faulty", "lỗi", "error"].includes(x)) return "Faulty";
  if (["depleted", "hết pin", "empty"].includes(x)) return "Depleted";
  return "";
};

const displayStatusVI = (s?: string) => {
  const k = normStatus(s);
  return (
    STATUS_LABELS_VI[k as keyof typeof STATUS_LABELS_VI] ||
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

// map status client → Backend enum name
function clientStatusToBackend(k: string): BatteryStatusBackend {
  if (k === "Available") return "Full";
  return (k as BatteryStatusBackend) || "Full";
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

  // ===== MODAL KIỂM TRA PIN =====
  const [inspectOpen, setInspectOpen] = useState(false);
  const [selectedBattery, setSelectedBattery] = useState<BatteryUnit | null>(
    null
  );
  const [inspectStatus, setInspectStatus] =
    useState<BatteryStatusBackend>("Full");
  const [inspectNote, setInspectNote] = useState("");

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

  const [createOpen, setCreateOpen] = useState(false);
  const [models, setModels] = useState<BatteryModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState("");
  const [myStationId, setMyStationId] = useState<string>("");
  const [myStationName, setMyStationName] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.stationId) setMyStationId(user.stationId);

        const station = await fetchStationById(user.stationId);
        setMyStationName(station?.name || "Không rõ tên trạm");

        const batteryModels = await fetchModelBattery();
        setModels(batteryModels);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu model hoặc user:", err);
      }
    };
    loadData();
  }, []);

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
      .filter((b) =>
        s ? (b.serialNumber || "").toLowerCase().includes(s) : true
      );
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
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
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
    // Lọc các item hợp lệ
    const items = reqItems
      .map((x) => ({
        batteryModelId: x.batteryModelId,
        quantity: Number(x.quantityRequested),
      }))
      .filter((x) => x.batteryModelId && x.quantity > 0);

    if (items.length === 0) {
      toast.warning("Thêm ít nhất 1 model và số lượng > 0", {
        ...toastOpts,
        toastId: "inv-req-validate",
      });
      return;
    }

    try {
      // Gửi song song từng request riêng biệt
      await Promise.all(
        items.map((item) =>
          createStockRequest({
            stationId: String(stationId), // ép kiểu string nếu cần
            batteryModelId: item.batteryModelId,
            quantity: item.quantity,
            staffNote: note || "", // optional
          })
        )
      );

      toast.success("Đã gửi tất cả yêu cầu nhập pin.", {
        ...toastOpts,
        toastId: "inv-req-success",
      });

      // Reset form
      setReqOpen(false);
      setReqItems([{ batteryModelId: "", quantityRequested: 0 }]);
      setReason("");
      fetchInventory(); // refresh
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
    if (k === "Reserved" || isReservedFlag(b))
      return "bg-yellow-100 text-yellow-700";
    if (k === "InUse") return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-700";
  };

  /* ===== HANDLER KIỂM TRA PIN ===== */
  const openInspectModal = (b: BatteryUnit) => {
    const k = normStatus(b.status); // Available / InUse / Charging / ...
    const backend = clientStatusToBackend(k); // giữ nguyên logic map sang enum BE

    setSelectedBattery(b);
    setInspectStatus(backend);
    setInspectNote("");
    setInspectOpen(true);
  };

  const handleSaveInspect = async () => {
    if (!selectedBattery) return;
    try {
      await updateBatteryStatus(selectedBattery.batteryId, inspectStatus);
      toast.success("Đã cập nhật trạng thái pin", {
        ...toastOpts,
        toastId: "inv-update-status",
      });
      setInspectOpen(false);
      setSelectedBattery(null);
      setInspectNote("");
      await fetchInventory();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Cập nhật trạng thái pin thất bại.";
      toast.error(msg, { ...toastOpts, toastId: "inv-update-status-error" });
    }
  };

  /* ========================================================= */

  return (
    <div className="container mx-auto grid gap-6">
      {/* CARD tổng quan, giữ nguyên logic */}
      <section className="rounded-2xl bg-white shadow-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-600 mb-1">
          Tổng quan kho
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Số lượng pin theo trạng thái
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Tổng", value: header.total },
            { label: "Đầy", value: header.available },
            { label: "Đang sử dụng", value: header.inUse },
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
              <span className="text-sm">
                Tồn kho thấp! Hãy yêu cầu nhập thêm pin.
              </span>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-lg bg-black text-white px-4 py-2 text-sm hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Tạo yêu cầu
            </button>
          </div>
        )}
      </section>

      {/* Danh sách pin */}
      <section className="rounded-2xl bg-white shadow-lg p-6 border border-orange-200">
        <h3 className="text-xl font-semibold text-orange-600 mb-4">
          Danh sách pin
        </h3>

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
              onValueChange={(val) =>
                setModelFilter(val === "__all__" ? "" : val)
              }
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
                  <SelectItem
                    key={o.value || "ALL"}
                    value={o.value || "__all__"}
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bảng */}
        <div className="rounded-xl border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 w-16 text-left">STT</th>
                <th className="px-4 py-3 w-48 text-left">Serial</th>
                <th className="px-4 py-3 w-64 text-left">Model</th>
                <th className="px-4 py-3 w-40 text-left">Trạng thái</th>
                <th className="px-4 py-3 w-48 text-left">Cập nhật</th>
                <th className="px-4 py-3 w-40 text-left">Kiểm tra</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Đang tải…
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
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
                    <td className="px-4 py-3 font-mono">
                      {b.serialNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {b.batteryModelName || b.batteryModelId}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass(
                          b
                        )}`}
                      >
                        {displayStatusVI(b.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.updatedAt
                        ? new Date(b.updatedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openInspectModal(b)}
                        className="px-3 py-1 rounded-full border text-xs hover:bg-gray-100"
                      >
                        Kiểm tra pin
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal yêu cầu nhập pin */}
      {reqOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Yêu cầu nhập pin</h3>
              <button
                onClick={() => setReqOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
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
              <p className="font-medium text-sm mb-2">
                Danh sách model & số lượng
              </p>
              {reqItems.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder="BatteryModelId"
                    value={item.batteryModelId}
                    onChange={(e) =>
                      setReqItems((arr) =>
                        arr.map((x, idx) =>
                          idx === i
                            ? { ...x, batteryModelId: e.target.value }
                            : x
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
                          idx === i
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

            <p className="mt-3 text-xs text-gray-500">
              Bạn có thể thêm nhiều model khác nhau.
            </p>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Tạo yêu cầu nhập pin
              </h3>
              <button
                onClick={() => setCreateOpen(false)}
      {/* Modal kiểm tra pin */}
      {inspectOpen && selectedBattery && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Kiểm tra pin</h3>
              <button
                onClick={() => setInspectOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X />
              </button>
            </div>

            <div className="space-y-4">
              {/* Tên trạm */}
              <div>
                <label className="block text-sm mb-1">Trạm</label>
                <input
                  type="text"
                  value={myStationName}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>

              {/* Ghi chú chung */}
              <div>
                <label className="block text-sm mb-1">Ghi chú chung</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="VD: Chuẩn bị cho đợt cao điểm"
                />
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {models.map((m) => {
                  const qty =
                    reqItems.find((x) => x.batteryModelId === m.id)
                      ?.quantityRequested || 0;
                  return (
                    <div key={m.id} className="flex items-center gap-3 w-full">
                      {/* Tên model chiếm nhiều diện tích hơn */}
                      <span className="flex-[4] min-w-0 font-medium">
                        {m.name}
                      </span>
                      {/* Ô nhập số lượng */}
                      <input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setReqItems((prev) => {
                            const exists = prev.find(
                              (x) => x.batteryModelId === m.id
                            );
                            if (exists) {
                              return prev.map((x) =>
                                x.batteryModelId === m.id
                                  ? { ...x, quantityRequested: val }
                                  : x
                              );
                            } else {
                              return [
                                ...prev,
                                {
                                  batteryModelId: m.id,
                                  quantityRequested: val,
                                },
                              ];
                            }
                          });
                        }}
                        className="flex-1 border rounded-lg px-3 py-2"
                        placeholder="Số lượng"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Nút gửi */}
              <div className="text-right">
                <button
                  onClick={submitRequest}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                  Gửi yêu cầu
                </button>
              </div>
            <div className="space-y-2 mb-4 text-sm">
              <p>
                <span className="font-semibold">Serial:</span>{" "}
                {selectedBattery.serialNumber || "—"}
              </p>
              <p>
                <span className="font-semibold">Model:</span>{" "}
                {selectedBattery.batteryModelName ||
                  selectedBattery.batteryModelId ||
                  "—"}
              </p>
              <p>
                <span className="font-semibold">Trạng thái hiện tại:</span>{" "}
                {displayStatusVI(selectedBattery.status)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">
                Trạng thái sau kiểm tra
              </label>
              <Select
                value={inspectStatus}
                onValueChange={(val) =>
                  setInspectStatus(val as BatteryStatusBackend)
                }
              >
                <SelectTrigger className="h-10 w-full rounded-lg border px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHECK_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">
                Ghi chú (tùy chọn)
              </label>
              <input
                value={inspectNote}
                onChange={(e) => setInspectNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Ví dụ: pin nhập từ admin nhưng phát hiện hư hỏng thì chọn Lỗi."
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setInspectOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveInspect}
                className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
              >
                Lưu trạng thái
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
