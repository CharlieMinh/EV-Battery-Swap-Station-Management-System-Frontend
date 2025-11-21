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
import { AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  BatteryModel,
  fetchModelBattery,
} from "@/services/admin/batteryService";
import { getCurrentUser } from "@/services/authApi";
import { createStockRequest } from "@/services/staff/stockRequest";
import { fetchStationById } from "@/services/admin/stationService";
import { formatDateTime } from "../../utils/dateTimeUtils";

type ReqItem = { batteryModelId: string; quantityRequested: number };
type Props = { stationId: string };

// STATUS_OPTIONS rendered via translations inside component

// ✅ cho modal "Kiểm tra pin": HIỆN TẤT CẢ TRẠNG THÁI
// CHECK_STATUS_OPTIONS rendered via translations inside component

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

const displayStatus = (s?: string, t?: (key: string) => string) => {
  const k = normStatus(s);
  switch (k) {
    case "Available": return t ? t("staff.inventory.statusAvailable") : "Available";
    case "InUse": return t ? t("staff.inventory.statusInUse") : "In use";
    case "Charging": return t ? t("staff.inventory.statusCharging") : "Charging";
    case "Maintenance": return t ? t("staff.inventory.statusMaintenance") : "Maintenance";
    case "Reserved": return t ? t("staff.inventory.statusReserved") : "Reserved";
    case "Faulty": return t ? t("staff.inventory.statusFaulty") : "Faulty";
    case "Depleted": return t ? t("staff.inventory.statusDepleted") : "Depleted";
    default: return s || "—";
  }
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
  const { t } = useLanguage();

  const STATUS_OPTIONS = useMemo(() => [
    { label: t("staff.inventory.statusAll"), value: "" },
    { label: t("staff.inventory.statusAvailable"), value: "Available" },
    { label: t("staff.inventory.statusInUse"), value: "InUse" },
    { label: t("staff.inventory.statusCharging"), value: "Charging" },
    { label: t("staff.inventory.statusMaintenance"), value: "Maintenance" },
    { label: t("staff.inventory.statusReserved"), value: "Reserved" },
    { label: t("staff.inventory.statusFaulty"), value: "Faulty" },
    { label: t("staff.inventory.statusDepleted"), value: "Depleted" },
  ], [t]);

  const CHECK_STATUS_OPTIONS: { label: string; value: BatteryStatusBackend }[] = useMemo(() => [
    { value: "Full", label: t("staff.inventory.statusAvailable") },
    { value: "Reserved", label: t("staff.inventory.statusReserved") },
    { value: "InUse", label: t("staff.inventory.statusInUse") },
    { value: "Charging", label: t("staff.inventory.statusCharging") },
    { value: "Depleted", label: t("staff.inventory.statusDepleted") },
    { value: "Maintenance", label: t("staff.inventory.statusMaintenance") },
    { value: "Faulty", label: t("staff.inventory.statusFaulty") },
  ], [t]);
  const [stats, setStats] = useState<StationBatteryStats | null>(null);
  const [all, setAll] = useState<BatteryUnit[]>([]);
  const [list, setList] = useState<BatteryUnit[]>([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Phân trang
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [pageSize] = useState(20); // 20 pin mỗi trang

  // dùng cho modal tạo yêu cầu
  const [reqItems, setReqItems] = useState<ReqItem[]>([
    { batteryModelId: "", quantityRequested: 0 },
  ]);

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
        setMyStationName(station?.name || t("staff.inventory.unknownStationName"));

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
    setPage(1); // Reset về trang 1 khi filter thay đổi
    setInputPage(1);
  }, [all, status, modelFilter, search]);

  // Pagination - danh sách pin đã phân trang
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, page, pageSize]);

  // Đồng bộ inputPage với page khi page thay đổi
  useEffect(() => {
    setInputPage(page);
  }, [page]);

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

  /* ===== REQUEST PIN (GIỮ LOGIC) ====== */
  const submitRequest = async () => {
    // Lọc các item có quantity > 0
    const items = reqItems
      .map((x) => ({
        batteryModelId: x.batteryModelId,
        quantity: Number(x.quantityRequested),
      }))
      .filter((x) => x.batteryModelId && x.quantity > 0);

    // Kiểm tra có ít nhất 1 item không
    if (items.length === 0) {
      toast.warning(t("staff.inventory.toastValidateItems"), {
        ...toastOpts,
        toastId: "inv-req-validate",
      });
      return;
    }

    // Validate từng item: phải từ 1-100
    for (const item of items) {
      if (item.quantity < 1) {
        toast.warning(t("staff.inventory.toastQuantityMin"), {
          ...toastOpts,
          toastId: "inv-req-qty-min",
        });
        return;
      }
      if (item.quantity > 100) {
        toast.warning(t("staff.inventory.toastQuantityMax"), {
          ...toastOpts,
          toastId: "inv-req-qty-max",
        });
        return;
      }
    }

    try {
      await Promise.all(
        items.map((item) =>
          createStockRequest({
            stationId: String(stationId),
            batteryModelId: item.batteryModelId,
            quantity: item.quantity,
            staffNote: note || "",
          })
        )
      );

      toast.success(t("staff.inventory.toastRequestSuccess"), {
        ...toastOpts,
        toastId: "inv-req-success",
      });

      setCreateOpen(false);
      setReqItems([{ batteryModelId: "", quantityRequested: 0 }]);
      setNote("");
      fetchInventory();
    } catch (err: any) {
      // Nếu BE trả về lỗi validation số lượng, map ra thông báo dễ hiểu
      const apiErrors = err?.response?.data?.errors;
      let msg: string;
      if (apiErrors?.Quantity?.length) {
        msg = apiErrors.Quantity[0];
      } else {
        msg =
          err?.response?.data?.message ||
          err?.message ||
          t("staff.inventory.toastRequestError");
      }
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
    const k = normStatus(b.status);
    const backend = clientStatusToBackend(k);

    setSelectedBattery(b);
    setInspectStatus(backend);
    setInspectNote("");
    setInspectOpen(true);
  };

  const handleSaveInspect = async () => {
    if (!selectedBattery) return;
    try {
      await updateBatteryStatus(selectedBattery.batteryId, inspectStatus);
      toast.success(t("staff.inventory.updateStatusSuccess"), {
        ...toastOpts,
        toastId: "inv-update-status",
      });
      setInspectOpen(false);
      setSelectedBattery(null);
      setInspectNote("");
      await fetchInventory();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t("staff.inventory.updateStatusError");
      toast.error(msg, { ...toastOpts, toastId: "inv-update-status-error" });
    }
  };

  /* ========================================================= */

  return (
    <div className="container mx-auto grid gap-6">
      {/* CARD tổng quan kho */}
      <section className="rounded-2xl bg-white shadow-lg p-6 border border-orange-200">
        <h2 className="text-2xl font-bold text-orange-600 mb-1">
          {t("staff.inventory.titleOverview")}
        </h2>
        <p className="text-gray-600 text-sm mb-4">{t("staff.inventory.subtitleOverview")}</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: t("staff.inventory.labelTotal"), value: header.total },
              { label: t("staff.inventory.statusAvailable"), value: header.available },
              { label: t("staff.inventory.statusInUse"), value: header.inUse },
              { label: t("staff.inventory.statusCharging"), value: header.charging },
              { label: t("staff.inventory.statusMaintenance"), value: header.maintenance },
              { label: t("staff.inventory.statusReserved"), value: header.reserved },
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
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{t("staff.inventory.lowStockWarning")}</span>
          </div>
        )}
      </section>

      {/* Danh sách pin */}
      <section className="rounded-2xl bg-white shadow-lg p-6 border border-orange-200">
        {/* Hàng tiêu đề */}
        <h3 className="text-xl font-semibold text-orange-600 mb-4">{t("staff.inventory.titleList")}</h3>

        {/* Hàng filter + nút Tạo yêu cầu (cùng một hàng) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="h-10 w-56 rounded-lg border-2 border-gray-300 px-3 text-sm focus:ring-2 focus:ring-orange-300"
              placeholder={t("staff.inventory.searchSerialPlaceholder")}
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
                  <SelectValue placeholder={t("staff.inventory.modelAll")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__">{t("staff.inventory.modelAll")}</SelectItem>
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
                onValueChange={(val) =>
                  setStatus(val === "__all__" ? "" : val)
                }
              >
                <SelectTrigger className="h-10 w-full rounded-lg border-2 border-gray-300 px-3 text-sm">
                  <SelectValue placeholder={t("staff.inventory.statusPlaceholder")} />
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

          {/* Nút tạo yêu cầu bên phải, cùng hàng */}
          <button
            onClick={() => setCreateOpen(true)}
            className="shrink-0 rounded-lg bg-orange-600 text-white px-4 py-2 text-sm hover:bg-orange-700 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            {t("staff.inventory.buttonCreateRequest")}
          </button>
        </div>

        {/* Bảng */}
        <div className="rounded-xl border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 w-16 text-left">{t("staff.inventory.colIndex")}</th>
                <th className="px-4 py-3 w-48 text-left">{t("staff.inventory.colSerial")}</th>
                <th className="px-4 py-3 w-64 text-left">{t("staff.inventory.colModel")}</th>
                <th className="px-4 py-3 w-40 text-left">{t("staff.inventory.colStatus")}</th>
                <th className="px-4 py-3 w-48 text-left">{t("staff.inventory.colUpdated")}</th>
                <th className="px-4 py-3 w-40 text-left">{t("staff.inventory.checkButton")}</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                      <span>{t("common.loading")}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    {t("staff.inventory.noData")}
                  </td>
                </tr>
              )}

              {!loading &&
                paginatedList.map((b, idx) => (
                  <tr
                    key={b.batteryId || b.serialNumber || idx}
                    className="odd:bg-white even:bg-gray-50 hover:bg-orange-50/40"
                  >
                    <td className="px-4 py-3">{(page - 1) * pageSize + idx + 1}</td>
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
                        {displayStatus(b.status, t)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.updatedAt
                        ? formatDateTime(b.updatedAt as any)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openInspectModal(b)}
                        className="px-3 py-1 rounded-full border text-xs hover:bg-gray-100"
                      >
                        {t("staff.inventory.inspectButton")}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {list.length > 0 && (
          <div className="flex justify-center items-center space-x-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("staff.inventory.prev")}
            </Button>

            <div className="flex items-center space-x-1">
              <span className="text-gray-700 text-sm">{t("staff.inventory.pageLabel")}</span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={inputPage}
                onChange={(e) => setInputPage(Number(e.target.value))}
                onBlur={() => {
                  let newPage = inputPage;
                  if (isNaN(newPage) || newPage < 1) newPage = 1;
                  if (newPage > totalPages) newPage = totalPages;
                  setPage(newPage);
                }}
                className="w-16 text-center text-sm"
              />
              <span className="text-gray-700 text-sm">/ {totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("staff.inventory.next")}
            </Button>
          </div>
        )}
      </section>

      {/* Modal TẠO YÊU CẦU NHẬP PIN */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-orange-600">{t("staff.inventory.modalTitle")}</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">{t("staff.inventory.labelStation")}</label>
                <input
                  type="text"
                  value={myStationName}
                  readOnly
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">{t("staff.inventory.labelNote")}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder={t("staff.inventory.notePlaceholder")}
                />
              </div>

              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {models.map((m) => {
                  const qty =
                    reqItems.find((x) => x.batteryModelId === m.id)
                      ?.quantityRequested || 0;
                  const displayQty =
                    qty > 0 ? qty.toLocaleString("vi-VN") : "";
                  return (
                    <div key={m.id} className="flex items-center gap-3 w-full">
                      <span className="flex-[4] min-w-0 font-medium">
                        {m.name}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={displayQty}
                        onChange={(e) => {
                          const raw = e.target.value || "";
                          // Chỉ giữ lại chữ số, bỏ dấu chấm phẩy, khoảng trắng...
                          const digits = raw.replace(/\D/g, "");
                          if (!digits) {
                            // Nếu rỗng, set về 0
                            setReqItems((prev) => {
                              const exists = prev.find(
                                (x) => x.batteryModelId === m.id
                              );
                              if (exists) {
                                return prev.map((x) =>
                                  x.batteryModelId === m.id
                                    ? { ...x, quantityRequested: 0 }
                                    : x
                                );
                              }
                              return prev;
                            });
                            return;
                          }
                          
                          const num = Number(digits);
                          // Giới hạn tối đa 100
                          if (num > 100) {
                            toast.warning(t("staff.inventory.toastQuantityMax"), {
                              ...toastOpts,
                              toastId: `inv-qty-max-${m.id}`,
                            });
                          }
                          const val = num > 100 ? 100 : num;

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
                        placeholder={t("staff.inventory.placeholderQuantity")}
                        min="1"
                        max="100"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="text-right">
                <button
                  onClick={submitRequest}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 shadow-md hover:shadow-lg transition-all"
                >
                  {t ? t("staff.inventory.buttonSubmitRequest") : "Submit request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal KIỂM TRA PIN */}
      {inspectOpen && selectedBattery && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">{t("staff.inventory.inspectTitle")}</h3>
              <button
                onClick={() => setInspectOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-lg"
              >
                <X />
              </button>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <p>
                <span className="font-semibold">{t("staff.inventory.colSerial")}:</span>{" "}
                {selectedBattery.serialNumber || "—"}
              </p>
              <p>
                <span className="font-semibold">{t("staff.inventory.colModel")}:</span>{" "}
                {selectedBattery.batteryModelName || selectedBattery.batteryModelId || "—"}
              </p>
              <p>
                <span className="font-semibold">{t("staff.inventory.currentStatusLabel")}:</span>{" "}
                {displayStatus(selectedBattery.status, t)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1">{t("staff.inventory.inspectAfterStatusLabel")}</label>
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
              <label className="block text-sm mb-1">{t("staff.inventory.inspectNoteLabel")}</label>
              <input
                value={inspectNote}
                onChange={(e) => setInspectNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={t("staff.inventory.inspectNotePlaceholder")}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setInspectOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
              >
                {t("staff.inventory.inspectCancel")}
              </button>
              <button
                onClick={handleSaveInspect}
                className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
              >
                {t("staff.inventory.inspectSave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
