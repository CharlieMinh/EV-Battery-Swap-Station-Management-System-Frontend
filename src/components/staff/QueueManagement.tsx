// src/components/staff/QueueManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listReservations,
  checkInReservation,
  type Reservation,
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
  const [oldSerial, setOldSerial] = useState("");

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

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [stationId, date, status]);

  /** Nhận RAW QR; gọi BE thật. Không mock. */
  const doCheckInByQr = async (raw: string) => {
    // Nếu user chưa chọn dòng nào, thử lấy id từ QR để tự chọn
    const maybeId = tryExtractReservationIdFromQR(raw);
    const targetId = selectedId || maybeId;

    if (!targetId) {
      alert("Không xác định được Reservation. Hãy chọn 1 dòng hoặc nhập ID/QR.");
      return;
    }

    try {
      // nếu không phải base64 thì encode (đề phòng scanner trả plain text)
      const looksLikeBase64 = /^[A-Za-z0-9+/=]+$/.test(raw) && raw.length >= 24;
      const qrCodeData = looksLikeBase64 ? raw : btoa(raw);

      await checkInReservation(targetId, qrCodeData);
      alert("✅ Check-in thành công!");
      setScannerOpen(false);
      setStatus("CheckedIn");
      await fetchList();
      setSelectedId(targetId);
      setStage("checking");
      setOldSerial("");
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

  const startChecking = (id: string) => {
    setSelectedId(id);
    setStage("checking");
    setOldSerial("");
  };

  const onInspectionDone = (serial: string) => {
    setOldSerial(serial);
    setStage("readyToSwap");
  };

  const closePanel = () => {
    setSelectedId(null);
    setStage("idle");
    setOldSerial("");
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
              <th className="px-3 py-2">Reservation</th>
              <th className="px-3 py-2">Khách</th>
              <th className="px-3 py-2">Xe</th>
              <th className="px-3 py-2">Model pin</th>
              <th className="px-3 py-2">Khung giờ</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-3 py-6 text-center">Đang tải...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Không có lượt nào</td></tr>
            )}

            {list.map((r) => {
              const isSel = selectedId === r.reservationId;
              const canStart = (r as any).status === "CheckedIn";

              const { start, end } = resolveSlotRange(r);
              const startLabel = start ? start.toLocaleString() : "—";
              const endLabel = end ? end.toLocaleString() : "—";

              const userLabel = (r as any).userName || (r as any).userId || "—";
              const vehicleLabel =
                (r as any).vehiclePlate ||
                (r as any).vehicleModelName ||
                (r as any).vehicleId ||
                "—";

              return (
                <React.Fragment key={r.reservationId}>
                  <tr className="border-t align-top">
                    <td className="px-3 py-2">{r.reservationId}</td>
                    <td className="px-3 py-2">{userLabel}</td>
                    <td className="px-3 py-2">{vehicleLabel}</td>
                    <td className="px-3 py-2">{r.batteryModelName || r.batteryModelId}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs">{startLabel}</div>
                      <div className="text-xs text-gray-500">→ {endLabel}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${badgeClass((r as any).status)}`}>
                        {statusToVi((r as any).status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {canStart ? (
                        <button
                          onClick={() => startChecking(r.reservationId)}
                          className={`${isSel ? "bg-black text-white" : "border"} rounded px-3 py-2`}
                        >
                          {isSel ? "Đang kiểm tra" : "Kiểm tra pin"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Hãy check-in trước</span>
                      )}
                    </td>
                  </tr>

                  {isSel && (
                    <tr className="bg-gray-50/50">
                      <td colSpan={7} className="p-3">
                        {stage === "checking" && selected && (
                          <InspectionPanel
                            reservation={selected}
                            onDone={(s) => onInspectionDone(s)}
                            onCancel={closePanel}
                          />
                        )}
                        {stage === "readyToSwap" && selected && (
                          <SwapPanel
                            reservation={selected}
                            oldBatterySerial={oldSerial}
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
