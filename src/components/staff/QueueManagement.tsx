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

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ đặt lịch", value: "PendingScheduling" },
  { label: "Đã đặt lịch", value: "Scheduled" },
  { label: "Đã check-in", value: "CheckedIn" },
  { label: "Đang kiểm tra", value: "Investigating" },
  { label: "Xác nhận lỗi", value: "Confirmed" },
  { label: "Từ chối", value: "Rejected" },
  { label: "Hoàn tất", value: "Resolved" },
];

const statusToVi = (s?: string) => {
  switch ((s || "").toLowerCase()) {
    case "pendingscheduling":
      return "Chờ đặt lịch";
    case "scheduled":
      return "Đã đặt lịch";
    case "checkedin":
      return "Đã check-in";
    case "investigating":
      return "Đang kiểm tra";
    case "confirmed":
      return "Xác nhận lỗi";
    case "rejected":
      return "Từ chối";
    case "resolved":
      return "Hoàn tất";
    default:
      return s || "—";
  }
};

const badgeClass = (s?: string) => {
  const key = (s || "").toLowerCase();
  switch (key) {
    case "pendingscheduling":
      return "bg-amber-100 text-amber-700";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    case "checkedin":
      return "bg-emerald-100 text-emerald-700";
    case "investigating":
      return "bg-yellow-100 text-yellow-700";
    case "confirmed":
      return "bg-emerald-200 text-emerald-900";
    case "rejected":
      return "bg-rose-100 text-rose-700";
    case "resolved":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const isPendingScheduling = (r: Reservation) =>
  ["pendingscheduling", "scheduled"].includes(
    ((r as any).status || "").toLowerCase()
  );

const isCheckedIn = (r: Reservation) =>
  ((r as any).status || "").toLowerCase() === "checkedin";

const isReadyToSwap = (r: Reservation) =>
  ((r as any).status || "").toLowerCase() === "confirmed";

const isRejectedOrResolved = (r: Reservation) =>
  ["rejected", "resolved"].includes(((r as any).status || "").toLowerCase());

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

export default function QueueManagement({
  stationId,
}: {
  stationId: string | number;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<string>("");
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [batteryHealthFromInspection, setBatteryHealthFromInspection] =
    useState<number>(85);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [complaintDetail, setComplaintDetail] = useState<any>(null);
  const [isLoadingComplaint, setIsLoadingComplaint] = useState(false);

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
      toast.success("Đã tải danh sách lượt đặt.", {
        ...toastOpts,
        toastId: TOAST_ID.fetchOk,
      });
    } catch (e: any) {
      console.error("load reservations error:", e);
      setList([]);
      toast.error("Không thể tải danh sách lượt đặt lịch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [stationId, date, status]);

  useEffect(() => {
    const ids = Array.from(
      new Set(list.map((r) => r.userId).filter(Boolean) as string[])
    );
    if (ids.length === 0) return;
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

  const doCheckInByQr = async (qrRaw: string) => {
    const rid = tryExtractReservationIdFromQR(qrRaw);
    if (!rid) {
      toast.error("❌ Mã QR không hợp lệ.");
      return;
    }

    try {
      const detail = await fetchReservationDetail(rid);
      if (!detail) {
        toast.error("Không tìm thấy thông tin đặt chỗ.");
        return;
      }

      await checkInReservation(rid, qrRaw);
      toast.success("✅ Check-in thành công!");

      // Nếu là complaint → sang form khiếu nại
      if (detail.relatedComplaintId) {
        setStage("complaintCheck");
        setSelectedId(rid);
        setIsLoadingComplaint(true);
        try {
          await startComplaintInvestigation(detail.relatedComplaintId);
          const complaint = await getComplaintById(detail.relatedComplaintId);
          setComplaintDetail(complaint);
        } finally {
          setIsLoadingComplaint(false);
        }
      } else {
        setStage("checking");
        setSelectedId(rid);
      }

      await fetchList();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể check-in bằng QR."
      );
    }
  };

  /** ✅ Check-in thủ công */
  const doManualCheckIn = async (reservation: Reservation) => {
    try {
      const qrCodeData = reservation.qrCode || "";
      if (!qrCodeData) {
        toast.error("❌ Không tìm thấy QR code hợp lệ cho reservation này.");
        return;
      }

      await checkInReservation(reservation.reservationId, qrCodeData);
      toast.success("✅ Check-in thành công!");
      setStatus("CheckedIn");
      await fetchList();
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
        } catch (err) {
          console.error("Complaint fetch/investigate error:", err);
        } finally {
          setIsLoadingComplaint(false);
        }
      } else {
        setStage("checking");
      }
    } catch (err: any) {
      console.error("manual check-in error:", err);
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Check-in thất bại.";
      toast.error("❌ " + msg);
    }
  };

  const startChecking = (id: string) => {
    setSelectedId(id);
    setStage("checking");
  };

  const onInspectionDone = (batteryHealth: number) => {
    setBatteryHealthFromInspection(batteryHealth);
    setStage("readyToSwap");
    toast.info("🔍 Kiểm tra pin hoàn tất, sẵn sàng đổi pin.");
  };

  const closePanel = () => {
    setSelectedId(null);
    setStage("idle");
    fetchList();
    toast.info("Đã đóng panel.", { ...toastOpts, toastId: TOAST_ID.closeInfo });
  };

  return (
    <div className="grid gap-4">
      {/* Bộ lọc */}
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
        <button
          onClick={() => {
            toast.info("Đang làm mới danh sách...", {
              ...toastOpts,
              toastId: TOAST_ID.refreshInfo,
            });
            fetchList();
          }}
          className="border rounded px-3 py-2 inline-flex items-center gap-2"
        >
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

      {/* Danh sách lượt */}
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
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center">
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                  Không có lượt nào
                </td>
              </tr>
            )}

            {list.map((r) => {
              const isSel = selectedId === r.reservationId;
              const { start, end } = resolveSlotRange(r);
              const displayName =
                (r.userId && nameMap[r.userId]) ||
                r.userName ||
                (r.userId ? `Khách #${r.userId.slice(-4)}` : "—");

              return (
                <React.Fragment key={r.reservationId}>
                  <tr className="border-t align-top hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">
                      {r.reservationId}
                    </td>
                    <td className="px-3 py-2 font-medium">{displayName}</td>
                    <td className="px-3 py-2">
                      {r.batteryModelName || r.batteryModelId || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${badgeClass(
                          r.status
                        )}`}
                      >
                        {statusToVi(r.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm">
                        {start
                          ? start.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}{" "}
                        -{" "}
                        {end
                          ? end.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        {isPendingScheduling(r) && (
                          <button
                            onClick={() => doManualCheckIn(r)}
                            className="border rounded px-3 py-1 text-sm hover:bg-gray-100"
                          >
                            Check-in
                          </button>
                        )}
                        {isCheckedIn(r) && (
                          <button
                            onClick={() => startChecking(r.reservationId)}
                            className={`${
                              isSel ? "bg-black text-white" : "border"
                            } rounded px-3 py-1 text-sm`}
                          >
                            {isSel ? "Đang kiểm tra" : "Kiểm tra pin"}
                          </button>
                        )}
                        {isReadyToSwap(r) && isSel && (
                          <span className="text-sm text-emerald-700">
                            Sẵn sàng đổi pin
                          </span>
                        )}
                        {isRejectedOrResolved(r) && (
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

                        {stage === "complaintCheck" && selected && (
                          <div className="space-y-3">
                            {isLoadingComplaint ? (
                              <div className="text-sm text-gray-500 italic">
                                Đang tải thông tin khiếu nại...
                              </div>
                            ) : complaintDetail ? (
                              <div className="border rounded-lg p-3 bg-amber-50">
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

                            <InspectionPanel
                              reservation={selected}
                              onDone={async (health) =>
                                setBatteryHealthFromInspection(health)
                              }
                              onCancel={closePanel}
                              isComplaint
                            />

                            <div className="flex justify-end gap-3 mt-3">
                              <button
                                onClick={async () => {
                                  try {
                                    if (!complaintDetail?.complaintId) return;
                                    await finalizeComplaintReswap(
                                      complaintDetail.complaintId,
                                      String(stationId),
                                      batteryHealthFromInspection
                                    );
                                    toast.success(
                                      "✅ Xác nhận lỗi & hoàn tất Re-swap!"
                                    );
                                    closePanel();
                                  } catch (err: any) {
                                    toast.error(
                                      err?.response?.data?.message ||
                                        "Hoàn tất Re-swap thất bại!"
                                    );
                                  }
                                }}
                                className="bg-emerald-600 text-white rounded px-4 py-2 text-sm hover:bg-emerald-700"
                              >
                                ✅ Xác nhận lỗi (Re-swap)
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    if (!complaintDetail?.complaintId) return;
                                    const notes = prompt(
                                      "Nhập ghi chú từ chối (ít nhất 10 ký tự):"
                                    );
                                    if (!notes || notes.trim().length < 10) {
                                      toast.error(
                                        "Ghi chú phải ít nhất 10 ký tự!"
                                      );
                                      return;
                                    }

                                    await resolveComplaint(
                                      complaintDetail.complaintId,
                                      "Rejected",
                                      notes.trim()
                                    );
                                    toast.success("🚫 Đã từ chối khiếu nại.");
                                    closePanel();
                                  } catch (err: any) {
                                    toast.error(
                                      err?.response?.data?.message ||
                                        "Từ chối khiếu nại thất bại!"
                                    );
                                  }
                                }}
                                className="bg-rose-600 text-white rounded px-4 py-2 text-sm hover:bg-rose-700"
                              >
                                ❌ Từ chối khiếu nại
                              </button>
                            </div>
                          </div>
                        )}

                        {stage === "readyToSwap" && selected && (
                          <SwapPanel
                            reservation={selected}
                            stationId={String(stationId)}
                            initialBatteryHealth={batteryHealthFromInspection}
                            onSwapped={closePanel}
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
