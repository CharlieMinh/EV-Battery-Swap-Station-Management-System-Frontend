// src/components/staff/QueueManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listReservations,
  checkInReservation,
  type Reservation,
  getUserNamesBatch,
} from "../../services/staff/staffApi";
import CheckInManagement from "./CheckInManagement";
import InspectionPanel from "./InspectionPanel";
import SwapPanel from "./SwapPanel";
import { ClipboardCheck, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import {
  fetchReservationDetail,
  finalizeComplaintReswap,
  getComplaintById,
  resolveComplaint,
  startComplaintInvestigation,
} from "@/services/swaps";
import { Button } from "../ui/button";

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};
const TOAST_ID = {
  fetchOk: "q-f-ok",
  fetchErr: "q-f-err",
  namesErr: "q-names-err",
  noTargetWarn: "q-no-target",
  checkinOk: "q-ci-ok",
  checkinErr: "q-ci-err",
  refreshInfo: "q-refresh",
  afterInspectOk: "q-inspect-ok",
  closeInfo: "q-close-info",
};

type Stage = "idle" | "checking" | "readyToSwap" | "complaintCheck";

// ⭐ Thông tin chờ xác nhận check-in sau khi quét QR
type PendingCheckIn = {
  rid: string;
  qrRaw: string;
  detail: any;
} | null;

/* ====== options/normalize/badge/label giữ nguyên ====== */
const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ đặt lịch", value: "PendingScheduling" },
  { label: "Đã đặt lịch", value: "Scheduled" },
  { label: "Đã check-in", value: "CheckedIn" },
  { label: "Đang kiểm tra", value: "Investigating" },
  { label: "Xác nhận lỗi", value: "Confirmed" },
  { label: "Từ chối", value: "Rejected" },
  { label: "Hoàn tất", value: "Resolved" },
  { label: "Đã hoàn tất", value: "Completed" },
  { label: "Chờ thanh toán", value: "PendingPayment" },
  { label: "Đã thanh toán", value: "Paid" },
];

function normalizeStatusKey(raw?: string): string {
  const s = (raw || "").toLowerCase().replace(/\s|_/g, "");
  if (!s) return "";
  if (s === "pendingscheduling" || s === "chođặtlịch" || s === "chodatlịch" || s === "chodatcho")
    return "PendingScheduling";
  if (s === "pending" || s === "dangcho") return "Pending";
  if (s === "scheduled" || s === "dadatlich") return "Scheduled";
  if (s === "checkedin" || s === "dacheckin") return "CheckedIn";
  if (s === "investigating" || s === "dangkiemtra") return "Investigating";
  if (s === "confirmed" || s === "ready" || s === "readytoswap" || s === "ready_to_swap")
    return "Confirmed";
  if (s === "rejected" || s === "tuchoi") return "Rejected";
  if (s === "resolved" || s === "hoantat") return "Resolved";
  if (s === "completed" || s === "dahoantat") return "Completed";
  if (s === "pendingpayment" || s === "awaitingpayment" || s === "chothanhtoan")
    return "PendingPayment";
  if (s === "paid" || s === "dathanhtoan") return "Paid";
  return raw || "";
}

const statusToVi = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "pendingscheduling":
      return "Chờ đặt lịch";
    case "pending":
      return "Đang chờ";
    case "scheduled":
      return "Đã đặt lịch";
    case "checkedin":
      return "Đã check-in";
    case "investigating":
      return "Đang kiểm tra";
    case "confirmed":
    case "ready":
    case "readytoswap":
    case "ready_to_swap":
      return "Sẵn sàng đổi pin";
    case "rejected":
      return "Từ chối";
    case "resolved":
      return "Hoàn tất";
    case "completed":
      return "Đã hoàn tất";
    case "pendingpayment":
    case "awaitingpayment":
      return "Chờ thanh toán";
    case "paid":
      return "Đã thanh toán";
    default:
      return s || "—";
  }
};

const badgeClass = (s?: string) => {
  const key = (s || "").toLowerCase();
  switch (key) {
    case "pendingscheduling":
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "checkedin":
      return "bg-emerald-100 text-emerald-700";
    case "investigating":
      return "bg-yellow-100 text-yellow-700";
    case "confirmed":
    case "ready":
    case "readytoswap":
    case "ready_to_swap":
      return "bg-emerald-200 text-emerald-900";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "resolved":
    case "completed":
      return "bg-gray-200 text-gray-700";
    case "pendingpayment":
    case "awaitingpayment":
      return "bg-amber-100 text-amber-700";
    case "paid":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

/* ========= logic cũ ========= */
const isCheckedIn = (r: Reservation) => ((r as any).status || "").toLowerCase() === "checkedin";
const isReadyToSwap = (r: Reservation) => ((r as any).status || "").toLowerCase() === "confirmed";
const isRejectedOrResolved = (r: Reservation) =>
  ["rejected", "resolved"].includes(((r as any).status || "").toLowerCase());
const isCompleted = (r: Reservation) => ((r as any).status || "").toLowerCase() === "completed";
const isFinalState = (r: Reservation) => isRejectedOrResolved(r) || isCompleted(r);

/* ========= helpers ========= */
function resolveSlotRange(r: any): { start: Date | null; end: Date | null } {
  const date = r?.slotDate,
    startStr = r?.slotStartTime,
    endStr = r?.slotEndTime;
  const toHHmmss = (t: string) => {
    if (!t) return "";
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    const m = t.match(/^(\d{2}:\d{2}:\d{2})/);
    return m ? m[1] : "";
  };
  if (date && startStr && endStr) {
    const sd = new Date(`${date}T${toHHmmss(String(startStr))}`);
    const ed = new Date(`${date}T${toHHmmss(String(endStr))}`);
    if (!isNaN(+sd) && !isNaN(+ed)) return { start: sd, end: ed };
  }
  return { start: null, end: null };
}

function tryExtractReservationIdFromQR(raw: string): string | null {
  try {
    const txt = atob(raw);
    const [json] = txt.split("|");
    const obj = JSON.parse(json);
    return obj.rid || obj.reservationId || null;
  } catch {
    return null;
  }
}

function displayVehicleName(r: any): string {
  return (
    r?.vehicleModelName ||
    r?.vehicleName ||
    r?.vehicle?.vehicleModel?.name ||
    r?.vehicle?.modelName ||
    r?.vehicleModel ||
    r?.vehicleType ||
    "—"
  );
}
function displayPlate(r: any): string {
  const p =
    r?.vehiclePlate ||
    r?.licensePlate ||
    r?.vehicle?.plateNumber ||
    r?.vehicle?.licensePlate ||
    r?.vehicle?.plate ||
    r?.plate ||
    "";
  return (p || "—").toString().toUpperCase();
}

export default function QueueManagement({ stationId }: { stationId: string | number }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [batteryHealthFromInspection, setBatteryHealthFromInspection] =
    useState<number>(85);
  const [noteFromInspection, setNoteFromInspection] = useState<string>("");
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [complaintDetail, setComplaintDetail] = useState<any>(null);
  const [isLoadingComplaint, setIsLoadingComplaint] = useState(false);
  const [isProcessingComplaint, setIsProcessingComplaint] = useState(false);

  // ⭐ state mới: thông tin scan QR đang chờ staff xác nhận
  const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn>(null);

  const fetchList = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const params = { stationId, date, status: status || undefined };
      const { data } = await listReservations(params);
      setList(data || []);
      // ❌ bỏ toast thành công để không hiện thông báo khi vào màn / làm mới
      // toast.success("Đã tải danh sách lượt đặt.", {
      //   ...toastOpts,
      //   toastId: TOAST_ID.fetchOk,
      // });
    } catch (e) {
      setList([]);
      toast.error("Không thể tải danh sách lượt đặt lịch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const active = list.find(
      (r) =>
        r.relatedComplaintId &&
        ["investigating", "confirmed"].includes((r.status || "").toLowerCase())
    );
    if (active) {
      setSelectedId(active.reservationId);
      setStage("complaintCheck");
      setIsLoadingComplaint(true);
      getComplaintById(active.relatedComplaintId)
        .then((c) => setComplaintDetail(c))
        .finally(() => setIsLoadingComplaint(false));
    }
  }, [list]);

  useEffect(() => {
    fetchList();
  }, [stationId, date, status]);

  useEffect(() => {
    const ids = Array.from(
      new Set(list.map((r) => r.userId).filter(Boolean) as string[])
    );
    if (!ids.length) return;
    (async () => {
      try {
        const map = await getUserNamesBatch(ids);
        setNameMap((prev) => ({ ...prev, ...map }));
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể lấy tên khách hàng.";
        toast.error(msg, { ...toastOpts, toastId: TOAST_ID.namesErr });
      }
    })();
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (status) {
      const key = normalizeStatusKey(status);
      result = result.filter((r) => normalizeStatusKey(r.status) === key);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => {
        const displayName =
          (r.userId && nameMap[r.userId]) ||
          r.userName ||
          (r.userId ? `Khách #${r.userId.slice(-4)}` : "");
        return (
          displayName.toLowerCase().includes(q) ||
          (r.batteryModelName || "").toLowerCase().includes(q) ||
          (r.batteryModelId || "").toLowerCase().includes(q) ||
          (r.reservationId || "").toLowerCase().includes(q) ||
          (r.vehiclePlate || "").toLowerCase().includes(q) ||
          (r.licensePlate || "").toLowerCase().includes(q) ||
          (r.vehicleModelName || "").toLowerCase().includes(q) ||
          (r.vehicleName || "").toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [list, status, search, nameMap]);

  const selected = useMemo(
    () => list.find((x) => x.reservationId === selectedId) || null,
    [list, selectedId]
  );

  const refreshReservationRow = async (reservationId: string) => {
    try {
      const detail = await fetchReservationDetail(reservationId);
      if (!detail) return;
      setList((prev) =>
        prev.map((r) =>
          r.reservationId === reservationId
            ? {
                ...r,
                reservationId: (detail as any).reservationId || r.reservationId,
                userId: (detail as any).userId ?? r.userId,
                userName: (detail as any).userName ?? r.userName,
                batteryModelId:
                  (detail as any).batteryModelId ?? r.batteryModelId,
                batteryModelName:
                  (detail as any).batteryModelName ?? r.batteryModelName,
                status: (detail as any).status ?? r.status,
                slotDate: (detail as any).slotDate ?? r.slotDate,
                slotStartTime:
                  (detail as any).slotStartTime ?? r.slotStartTime,
                slotEndTime: (detail as any).slotEndTime ?? r.slotEndTime,
                qrCode: (detail as any).qrCode ?? r.qrCode,
                relatedComplaintId:
                  (detail as any).relatedComplaintId ?? r.relatedComplaintId,
                vehicleId: (detail as any).vehicleId ?? r.vehicleId,
                vehicleName:
                  (detail as any).vehicleName ??
                  (detail as any).vehicleModelName ??
                  r.vehicleName ??
                  r.vehicleModelName,
                licensePlate:
                  (detail as any).licensePlate ??
                  (detail as any).vehiclePlate ??
                  r.licensePlate ??
                  r.vehiclePlate,
                vehicleModelName:
                  (detail as any).vehicleModelName ??
                  (detail as any).vehicleName ??
                  r.vehicleModelName ??
                  r.vehicleName,
                vehiclePlate:
                  (detail as any).vehiclePlate ??
                  (detail as any).licensePlate ??
                  r.vehiclePlate ??
                  r.licensePlate,
              }
            : r
        )
      );
    } catch {
      // ignore
    }
  };

  /* ====================================================
   *  QUÉT QR ➜ CHỈ LOAD THÔNG TIN + HỎI XÁC NHẬN
   *  (logic check-in thật giữ nguyên, chuyển sang hàm confirmPendingCheckIn)
   * ==================================================== */
  const doCheckInByQr = async (qrRaw: string) => {
    const rid = tryExtractReservationIdFromQR(qrRaw);
    if (!rid) return toast.error("❌ Mã QR không hợp lệ.");
    try {
      const detail = await fetchReservationDetail(rid);
      if (!detail) return toast.error("Không tìm thấy thông tin đặt chỗ.");

      // Lưu tạm để staff xem và xác nhận
      setPendingCheckIn({ rid, qrRaw, detail });
      setScannerOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể đọc thông tin từ QR."
      );
    }
  };

  /* ⭐ HÀM NÀY DÙNG LẠI Y NGUYÊN LOGIC CŨ CỦA doCheckInByQr */
  const confirmPendingCheckIn = async () => {
    if (!pendingCheckIn) return;
    const { rid, qrRaw, detail } = pendingCheckIn;

    try {
      await checkInReservation(rid, qrRaw);
      toast.success("✅ Check-in thành công!");

      if ((detail as any).relatedComplaintId) {
        setStage("complaintCheck");
        setSelectedId(rid);
        setIsLoadingComplaint(true);
        try {
          await startComplaintInvestigation((detail as any).relatedComplaintId);
          const complaint = await getComplaintById(
            (detail as any).relatedComplaintId
          );
          setComplaintDetail(complaint);
        } finally {
          setIsLoadingComplaint(false);
        }
      } else {
        setStage("checking");
        setSelectedId(rid);
      }

      await refreshReservationRow(rid);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể check-in bằng QR."
      );
    } finally {
      setPendingCheckIn(null);
    }
  };

  const doManualCheckIn = async (reservation: Reservation) => {
    try {
      const qr = reservation.qrCode || "";
      if (!qr)
        return toast.error("❌ Không tìm thấy QR code hợp lệ cho reservation này.");
      await checkInReservation(reservation.reservationId, qr);
      toast.success("✅ Check-in thành công!");
      await refreshReservationRow(reservation.reservationId);
      setSelectedId(reservation.reservationId);

      const found = list.find(
        (r) => r.reservationId === reservation.reservationId
      );
      if (found?.relatedComplaintId) {
        setStage("complaintCheck");
        toast.info("⚠️ Đây là lượt khiếu nại, mở panel kiểm tra đặc biệt");
        setIsLoadingComplaint(true);
        try {
          await startComplaintInvestigation(found.relatedComplaintId);
          const complaint = await getComplaintById(found.relatedComplaintId);
          setComplaintDetail(complaint);
        } finally {
          setIsLoadingComplaint(false);
        }
      } else {
        setStage("checking");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Check-in thất bại.";
      toast.error("❌ " + msg);
    }
  };

  const startChecking = (id: string) => {
    const found = list.find((r) => r.reservationId === id);
    if (!found) return;
    setSelectedId(id);
    if (found.relatedComplaintId) {
      setStage("complaintCheck");
      setIsLoadingComplaint(true);
      getComplaintById(found.relatedComplaintId)
        .then((c) => setComplaintDetail(c))
        .finally(() => setIsLoadingComplaint(false));
    } else setStage("checking");
  };

  const startSwap = (id: string) => {
    const found = list.find((r) => r.reservationId === id);
    if (!found) return;
    setSelectedId(id);
    setStage("readyToSwap");
  };

  const onInspectionDone = (health: number, note: string) => {
    setBatteryHealthFromInspection(health);
    setNoteFromInspection(note);
    setList((prev) =>
      prev.map((r) =>
        r.reservationId === selectedId ? { ...r, status: "Confirmed" } : r
      )
    );
    setStage("readyToSwap");
    toast.info("🔍 Kiểm tra pin hoàn tất, sẵn sàng đổi pin.");
  };

  const closePanel = (force?: boolean) => {
    if (!force && stage === "complaintCheck") return;
    setSelectedId(null);
    setStage("idle");
  };

  const formatTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  // ⭐ Helper: lấy tên khách cho modal pendingCheckIn
  const getPendingCustomerName = (): string => {
    if (!pendingCheckIn) return "—";

    // 1) ưu tiên lấy từ list + nameMap (giống bảng)
    const fromList = list.find((r) => r.reservationId === pendingCheckIn.rid);
    if (fromList) {
      const n =
        (fromList.userId && nameMap[fromList.userId]) ||
        fromList.userName ||
        (fromList.userId ? `Khách #${fromList.userId.slice(-4)}` : "");
      if (n) return n;
    }

    // 2) fallback từ detail trả về bởi fetchReservationDetail
    const d = pendingCheckIn.detail || {};
    const detailName =
      (d.userId && nameMap[d.userId]) ||
      d.userName ||
      d.user?.fullName ||
      d.user?.name ||
      "";
    if (detailName) return detailName;

    // 3) fallback cuối cùng
    if (d.userId) return `Khách #${String(d.userId).slice(-4)}`;
    return "—";
  };

  return (
    <div className="container mx-auto">
      {/* Filter card */}
      <section className="rounded-2xl bg-white shadow-lg p-5 border border-orange-200 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">
              Quản Lý Hàng Chờ
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Theo dõi & xử lý lượt đổi pin trong ngày
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs block text-gray-600 mb-1">Ngày</label>
              <input
                type="date"
                className="h-10 border-2 border-gray-300 rounded-lg px-3 py-2 w-44 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs block text-gray-600 mb-1">
                Trạng thái
              </label>
              <select
                className="h-10 border-2 border-gray-300 rounded-lg px-3 py-2 w-56 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors hover:border-gray-400"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "ALL"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs block text-gray-600 mb-1">
                Tìm kiếm
              </label>
              <input
                type="text"
                className="h-10 border-2 border-gray-300 rounded-lg px-3 py-2 w-60 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                placeholder="Tên, model pin, biển số..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button
              onClick={() => {
                // ❌ bỏ toast "Đang làm mới danh sách..."
                fetchList();
              }}
              variant="outline"
              className="h-10 border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>

            <Button
              onClick={() => setScannerOpen(true)}
              className="h-10 bg-black hover:bg-gray-800"
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Check-in bằng camera
            </Button>
          </div>
        </div>
      </section>

      {/* Danh sách bảng */}
      <section className="rounded-2xl bg-white shadow-lg p-5 border border-orange-200">
        <h3 className="text-lg font-semibold mb-3">Danh sách hàng chờ</h3>

        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-600">
                  <th className="px-4 py-3 text-left w-56">Tên khách hàng</th>
                  <th className="px-4 py-3 text-left w-48">Model pin</th>
                  <th className="px-4 py-3 text-left w-48">Xe</th>
                  <th className="px-4 py-3 text-left w-40">Biển số</th>
                  {/* ⭐ rộng hơn để badge không bị xuống dòng */}
                  <th className="px-4 py-3 text-left w-52">Trạng thái</th>
                  <th className="px-4 py-3 text-left w-48">Slot Start - End</th>
                  <th className="px-4 py-3 text-right w-56">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Đang tải…
                    </td>
                  </tr>
                )}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Không có lượt nào
                    </td>
                  </tr>
                )}

                {!loading &&
                  filtered.map((r) => {
                    const isSel = selectedId === r.reservationId;
                    const { start, end } = resolveSlotRange(r);
                    const displayName =
                      (r.userId && nameMap[r.userId]) ||
                      r.userName ||
                      (r.userId ? `Khách #${r.userId.slice(-4)}` : "—");

                    return (
                      <React.Fragment key={r.reservationId}>
                        <tr className="odd:bg-white even:bg-gray-50 hover:bg-orange-50/40 transition-colors">
                          <td className="px-4 py-3 align-middle font-medium">
                            {displayName}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {r.batteryModelName || r.batteryModelId || "—"}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {displayVehicleName(r)}
                          </td>
                          <td className="px-4 py-3 align-middle font-mono">
                            {displayPlate(r)}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {/* ⭐ badge không xuống dòng */}
                            <span
                              className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass(
                                r.status
                              )}`}
                            >
                              {statusToVi(r.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {start ? formatTime(start) : "—"} -{" "}
                            {end ? formatTime(end) : "—"}
                          </td>
                          <td className="px-4 py-3 align-middle text-right">
                            <div className="flex gap-2 justify-end">
                              {/* KHÔNG hiện nút Check-in nếu đã Confirmed (readyToSwap) */}
                              {!isCheckedIn(r) &&
                                !isReadyToSwap(r) &&
                                !isFinalState(r) && (
                                  <button
                                    onClick={() => doManualCheckIn(r)}
                                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 transition"
                                    title="Check-in thủ công (không cần quét QR)"
                                  >
                                    <ClipboardCheck className="h-4 w-4" />
                                    Check-in
                                  </button>
                                )}

                              {isCheckedIn(r) &&
                                !(isSel && stage === "readyToSwap") &&
                                !isFinalState(r) && (
                                  <button
                                    onClick={() =>
                                      startChecking(r.reservationId)
                                    }
                                    className={`${
                                      isSel && stage === "checking"
                                        ? "bg-black text-white"
                                        : "border"
                                    } rounded px-3 py-1.5 text-sm hover:bg-gray-50 transition`}
                                  >
                                    {isSel && stage === "checking"
                                      ? "Đang kiểm tra"
                                      : "Kiểm tra pin"}
                                  </button>
                                )}

                              {(isReadyToSwap(r) ||
                                (isSel && stage === "readyToSwap")) &&
                                !isFinalState(r) && (
                                  <button
                                    onClick={() =>
                                      startSwap(r.reservationId)
                                    }
                                    className="rounded px-3 py-1.5 text-sm text-white bg-emerald-700 hover:bg-emerald-800 transition"
                                    title="Tiến hành thay pin"
                                  >
                                    Thay pin
                                  </button>
                                )}

                              {isRejectedOrResolved(r) && (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Hàng mở rộng chi tiết */}
                        {isSel && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={7} className="p-4">
                              {stage === "checking" && selected && (
                                <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                                  <InspectionPanel
                                    reservation={selected}
                                    onDone={(health, note) =>
                                      onInspectionDone(health, note)
                                    }
                                    onCancel={closePanel}
                                  />
                                </div>
                              )}

                              {stage === "complaintCheck" && selected && (
                                <div className="space-y-3">
                                  {isLoadingComplaint ? (
                                    <div className="text-sm text-gray-500 italic">
                                      Đang tải thông tin khiếu nại...
                                    </div>
                                  ) : complaintDetail ? (
                                    <div className="border rounded-lg p-3 bg-amber-50 border-amber-200">
                                      <h4 className="font-semibold text-amber-700">
                                        📋 Thông tin khiếu nại
                                      </h4>
                                      <p className="text-sm text-gray-700 mt-1">
                                        {complaintDetail.description ||
                                          "Không có mô tả."}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 italic">
                                      Không tìm thấy dữ liệu khiếu nại.
                                    </div>
                                  )}

                                  <div className="rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
                                    <InspectionPanel
                                      reservation={selected}
                                      onDone={async (health) =>
                                        setBatteryHealthFromInspection(health)
                                      }
                                      onCancel={closePanel}
                                      isComplaint
                                    />
                                  </div>

                                  <div className="flex justify-end gap-3 mt-3">
                                    <button
                                      disabled={isProcessingComplaint}
                                      onClick={async () => {
                                        try {
                                          if (!complaintDetail?.id)
                                            return toast.error(
                                              "❌ Không tìm thấy complaintId!"
                                            );
                                          setIsProcessingComplaint(true);
                                          await resolveComplaint(
                                            complaintDetail.id,
                                            "Confirmed",
                                            "Xác nhận pin lỗi, chuẩn bị Re-swap."
                                          );
                                          toast.success(
                                            "✅ Đã xác nhận lỗi, tiến hành Re-swap..."
                                          );
                                          await finalizeComplaintReswap(
                                            complaintDetail.id,
                                            String(stationId),
                                            batteryHealthFromInspection
                                          );
                                          toast.success(
                                            "⚡ Hoàn tất đổi pin miễn phí (Re-swap)!"
                                          );
                                          if (selectedId)
                                            await refreshReservationRow(
                                              selectedId
                                            );
                                          setComplaintDetail(null);
                                          closePanel(true);
                                        } catch (err: any) {
                                          toast.error(
                                            err?.response?.data?.message ||
                                              "Hoàn tất Re-swap thất bại!"
                                          );
                                        } finally {
                                          setIsProcessingComplaint(false);
                                        }
                                      }}
                                      className={`${
                                        isProcessingComplaint
                                          ? "bg-emerald-400 cursor-not-allowed"
                                          : "bg-emerald-600 hover:bg-emerald-700"
                                      } rounded px-4 py-2 text-sm text-white`}
                                    >
                                      ✅ Xác nhận lỗi (Re-swap)
                                    </button>

                                    <button
                                      disabled={isProcessingComplaint}
                                      onClick={async () => {
                                        try {
                                          if (!complaintDetail?.id)
                                            return toast.error(
                                              "❌ Không tìm thấy complaintId!"
                                            );
                                          const notes = prompt(
                                            "Nhập ghi chú từ chối (ít nhất 10 ký tự):"
                                          );
                                          if (
                                            !notes ||
                                            notes.trim().length < 10
                                          )
                                            return toast.error(
                                              "Ghi chú phải ít nhất 10 ký tự!"
                                            );
                                          setIsProcessingComplaint(true);
                                          await resolveComplaint(
                                            complaintDetail.id,
                                            "Rejected",
                                            notes.trim()
                                          );
                                          toast.success(
                                            "🚫 Đã từ chối khiếu nại."
                                          );
                                          if (selectedId)
                                            await refreshReservationRow(
                                              selectedId
                                            );
                                          setComplaintDetail(null);
                                          closePanel(true);
                                        } catch (err: any) {
                                          toast.error(
                                            err?.response?.data?.message ||
                                              "Từ chối khiếu nại thất bại!"
                                          );
                                        } finally {
                                          setIsProcessingComplaint(false);
                                        }
                                      }}
                                      className={`${
                                        isProcessingComplaint
                                          ? "bg-rose-400 cursor-not-allowed"
                                          : "bg-rose-600 hover:bg-rose-700"
                                      } rounded px-4 py-2 text-sm text-white`}
                                    >
                                      ❌ Từ chối khiếu nại
                                    </button>
                                  </div>
                                </div>
                              )}

                              {stage === "readyToSwap" && selected && (
                                <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
                                  <SwapPanel
                                    reservation={selected}
                                    stationId={String(stationId)}
                                    initialBatteryHealth={
                                      batteryHealthFromInspection
                                    }
                                    initialNote={noteFromInspection}
                                    onSwapped={async () => {
                                      if (selectedId) {
                                        await refreshReservationRow(selectedId);
                                        setList((prev) =>
                                          prev.map((x) =>
                                            x.reservationId === selectedId
                                              ? { ...x, status: "Completed" }
                                              : x
                                          )
                                        );
                                      }
                                      toast.success("✅ Hoàn tất đổi pin.");
                                      closePanel(true);
                                    }}
                                    onCancel={closePanel}
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal quét QR */}
      <CheckInManagement
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={doCheckInByQr}
      />

      {/* ⭐ Modal xác nhận Check-in sau khi quét QR */}
      {pendingCheckIn && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold mb-1">Xác nhận Check-in</h3>
            <p className="text-xs text-gray-500 mb-4">
              Kiểm tra thông tin đặt lịch bên dưới trước khi xác nhận check-in.
            </p>

            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div className="text-gray-500">Khách</div>
              <div className="font-medium">
                {getPendingCustomerName()}
              </div>

              <div className="text-gray-500">Xe</div>
              <div className="font-medium">
                {displayVehicleName(pendingCheckIn.detail)}
              </div>

              <div className="text-gray-500">Biển số</div>
              <div className="font-mono">
                {displayPlate(pendingCheckIn.detail)}
              </div>

              <div className="text-gray-500">Model pin</div>
              <div className="font-medium">
                {pendingCheckIn.detail?.batteryModelName ||
                  pendingCheckIn.detail?.batteryModel?.name ||
                  pendingCheckIn.detail?.batteryModelId ||
                  "—"}
              </div>

              <div className="text-gray-500">Khung giờ</div>
              <div className="font-medium">
                {(() => {
                  const { start, end } = resolveSlotRange(pendingCheckIn.detail);
                  return `${start ? formatTime(start) : "—"} - ${
                    end ? formatTime(end) : "—"
                  }`;
                })()}
              </div>

              <div className="text-gray-500">Trạng thái hiện tại</div>
              <div>
                <span
                  className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass(
                    pendingCheckIn.detail?.status
                  )}`}
                >
                  {statusToVi(pendingCheckIn.detail?.status)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => setPendingCheckIn(null)}
              >
                Hủy
              </button>
              <button
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                onClick={confirmPendingCheckIn}
              >
                Xác nhận check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
