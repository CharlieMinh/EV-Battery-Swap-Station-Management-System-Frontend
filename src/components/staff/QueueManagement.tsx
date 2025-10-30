// src/components/staff/QueueManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listReservations,
  checkInReservation,
  type Reservation,
  getUserNamesBatch,  // ⭐ dùng để map userId → userName
} from "../../services/staff/staffApi";
import CheckInManagement from "./CheckInManagement";
import InspectionPanel from "./InspectionPanel";
import SwapPanel from "./SwapPanel";
import { ClipboardCheck, RefreshCw } from "lucide-react";

type Stage = "idle" | "checking" | "readyToSwap";

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Đang chờ", value: "Pending" },
  { label: "Đã check-in", value: "CheckedIn" },
  { label: "Đã hoàn tất", value: "Completed" },
  { label: "Đã hủy", value: "Cancelled" },
  { label: "Hết hạn", value: "Expired" },
];

const statusToVi = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "pending": return "Đang chờ";
    case "checkedin": return "Đã check-in";
    case "completed": return "Đã hoàn tất";
    case "cancelled": return "Đã hủy";
    case "expired": return "Hết hạn";
    default: return s || "—";
  }
};

/** Ghép slotDate + slotStartTime/slotEndTime; fallback các field ISO */
function resolveSlotRange(r: any): { start: Date | null; end: Date | null } {
  const date = r?.slotDate;
  const startStr = r?.slotStartTime;
  const endStr = r?.slotEndTime;

  const toHHmmss = (t: string) => {
    if (!t) return "";
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    const m = t.match(/^(\d{2}:\d{2}:\d{2})/);
    return m ? m[1] : "";
  };

  if (date && startStr && endStr) {
    const sISO = `${date}T${toHHmmss(String(startStr))}`;
    const eISO = `${date}T${toHHmmss(String(endStr))}`;
    const sd = new Date(sISO);
    const ed = new Date(eISO);
    if (!isNaN(+sd) && !isNaN(+ed)) return { start: sd, end: ed };
  }

  const cw = r?.checkInWindow;
  if (cw?.earliestTime && cw?.latestTime) {
    const sd = new Date(cw.earliestTime);
    const ed = new Date(cw.latestTime);
    if (!isNaN(+sd) && !isNaN(+ed)) return { start: sd, end: ed };
  }

  if (r?.startTime && r?.endTime) {
    const sd = new Date(r.startTime);
    const ed = new Date(r.endTime);
    if (!isNaN(+sd) && !isNaN(+ed)) return { start: sd, end: ed };
  }

  return { start: null, end: null };
}

/** Thử trích reservationId từ chuỗi QR (base64(JSON|sig)) để tự chọn hàng */
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

export default function QueueManagement({ stationId }: { stationId: string | number }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<string>(""); // '' = Tất cả
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [batteryHealthFromInspection, setBatteryHealthFromInspection] = useState<number>(85); // ⭐ Lưu % pin từ inspection

  // ⭐ map userId → userName
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  const selected = useMemo(
    () => list.find((x) => x.reservationId === selectedId) || null,
    [list, selectedId]
  );

  const fetchList = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const params = { stationId, date, status: status || undefined };
      const { data } = await listReservations(params);
      setList(data || []);
    } catch (e) {
      console.error("load reservations error:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  // nạp danh sách
  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [stationId, date, status]);

  // khi list đổi, resolve tên khách (batch + cache)
  useEffect(() => {
    const ids = Array.from(new Set((list.map((r) => r.userId).filter(Boolean) as string[])));
    if (ids.length === 0) return;
    (async () => {
      const map = await getUserNamesBatch(ids);
      setNameMap((prev) => ({ ...prev, ...map }));
    })();
  }, [list]);

  /** Nhận RAW QR; gọi BE thật */
  const doCheckInByQr = async (raw: string) => {
    const maybeId = tryExtractReservationIdFromQR(raw);
    const targetId = selectedId || maybeId;

    if (!targetId) {
      alert("Không xác định được Reservation. Hãy chọn 1 dòng hoặc nhập ID/QR.");
      return;
    }

    try {
      const looksLikeBase64 = /^[A-Za-z0-9+/=]+$/.test(raw) && raw.length >= 24;
      const qrCodeData = looksLikeBase64 ? raw : btoa(raw);

      await checkInReservation(targetId, qrCodeData);
      alert("✅ Check-in thành công!");
      setScannerOpen(false);
      setStatus("CheckedIn");
      await fetchList();
      setSelectedId(targetId);
      setStage("checking");
    } catch (err: any) {
      console.error("check-in error:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Check-in thất bại.";
      alert("❌ " + msg);
    }
  };

  /** Check-in thủ công bằng nút bấm */
  const doManualCheckIn = async (reservation: Reservation) => {
    try {
      // ⭐ Ưu tiên dùng QR code thật từ BE (đã có signature)
      const qrCodeData = reservation.qrCode || "";

      if (!qrCodeData) {
        alert("❌ Không tìm thấy QR code hợp lệ cho reservation này.");
        return;
      }

      await checkInReservation(reservation.reservationId, qrCodeData);
      alert("✅ Check-in thành công!");
      setStatus("CheckedIn");
      await fetchList();
      setSelectedId(reservation.reservationId);
      setStage("checking");
    } catch (err: any) {
      console.error("manual check-in error:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Check-in thất bại.";
      alert("❌ " + msg);
    }
  };

  const startChecking = (id: string) => {
    setSelectedId(id);
    setStage("checking");
  };

  const onInspectionDone = (batteryHealth: number) => {
    // ⭐ Lưu lại batteryHealth để truyền cho SwapPanel
    console.log("✅ InspectionPanel done - batteryHealth:", batteryHealth);
    setBatteryHealthFromInspection(batteryHealth);
    setStage("readyToSwap");
  };

  const closePanel = () => {
    setSelectedId(null);
    setStage("idle");
    fetchList(); // ⭐ Refresh lại danh sách sau khi hoàn tất
  };

  const badgeClass = (s?: string) => {
    const key = (s || "").toLowerCase();
    if (key === "checkedin") return "bg-emerald-100 text-emerald-700";
    if (key === "pending") return "bg-amber-100 text-amber-700";
    if (key === "completed") return "bg-blue-100 text-blue-700";
    if (key === "cancelled") return "bg-rose-100 text-rose-700";
    if (key === "expired") return "bg-gray-200 text-gray-600";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="grid gap-4">
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs block">Ngày</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-44"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs block">Trạng thái</label>
          <select
            className="border rounded px-3 py-2 w-56"
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

        <button onClick={fetchList} className="border rounded px-3 py-2 inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>

        <button
          onClick={() => setScannerOpen(true)}
          className="bg-black text-white rounded px-3 py-2 inline-flex items-center gap-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          Check-in bằng camera
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Reservation ID</th>
              <th className="px-3 py-2">Tên khách hàng</th>
              <th className="px-3 py-2">Model pin</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Slot Start - End</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center">Đang tải...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">Không có lượt nào</td></tr>
            )}

            {list.map((r) => {
              const isSel = selectedId === r.reservationId;
              const canStart = (r as any).status === "CheckedIn";
              const isPending = (r as any).status === "Pending";

              const { start, end } = resolveSlotRange(r);
              const startLabel = start ? start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : "—";
              const endLabel = end ? end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : "—";

              // ⭐ tên khách ưu tiên từ nameMap; fallback userName; cuối cùng Khách #xxxx
              const displayName =
                (r.userId && nameMap[r.userId]) ||
                r.userName ||
                (r.userId ? `Khách #${r.userId.slice(-4)}` : "—");

              return (
                <React.Fragment key={r.reservationId}>
                  <tr className="border-t align-top hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{r.reservationId}</td>
                    <td className="px-3 py-2 font-medium">{displayName}</td>
                    <td className="px-3 py-2">{r.batteryModelName || r.batteryModelId || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${badgeClass(r.status)}`}>
                        {statusToVi(r.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm">{startLabel} - {endLabel}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        {isPending && (
                          <button
                            onClick={() => doManualCheckIn(r)}
                            className="border rounded px-3 py-1 text-sm hover:bg-gray-100"
                          >
                            Check-in
                          </button>
                        )}
                        {canStart && (
                          <button
                            onClick={() => startChecking(r.reservationId)}
                            className={`${isSel ? "bg-black text-white" : "border"} rounded px-3 py-1 text-sm`}
                          >
                            {isSel ? "Đang kiểm tra" : "Kiểm tra pin"}
                          </button>
                        )}
                        {!isPending && !canStart && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isSel && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={6} className="p-3">
                        {stage === "checking" && selected && (
                          <InspectionPanel
                            reservation={selected}
                            onDone={(health) => onInspectionDone(health)}
                            onCancel={closePanel}
                          />
                        )}
                        {stage === "readyToSwap" && selected && (
                          <SwapPanel
                            reservation={selected}
                            initialBatteryHealth={batteryHealthFromInspection}
                            onSwapped={() => closePanel()}
                            onCancel={closePanel}
                          />
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

      <CheckInManagement
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={doCheckInByQr}
      />
    </div>
  );
}
