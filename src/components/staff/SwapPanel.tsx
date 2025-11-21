// src/components/staff/SwapPanel.tsx
import React, { useState } from "react";
import {
  finalizeSwapFromReservation,
  type Reservation,
  type SwapFinalizeResponse,
} from "../../services/staff/staffApi";
import { formatDateTime } from "../../utils/dateTimeUtils";
import {
  CheckCircle,
  Battery,
  BadgeCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";

type Props = {
  reservation: Reservation;
  initialBatteryHealth?: number; // ⭐ Nhận % pin từ InspectionPanel
  initialNote?: string; // ⭐ Nhận note từ InspectionPanel
  onSwapped: (info: { swapId?: string }) => void;
  onCancel: () => void;
  stationId: string;
};

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};

// ✅ Bảo đảm MỖI hành động chỉ hiển thị 1 toast (dùng toastId cố định)
const TOAST_ID = {
  swap: "swap-action-toast",
  close: "swap-close-toast",
};

export default function SwapPanel({
  reservation,
  initialBatteryHealth = 85,
  initialNote = "",
  onSwapped,
  stationId,
  onCancel,
}: Props) {
  // Giá trị số thực gửi cho BE
  const [health, setHealth] = useState<number>(initialBatteryHealth);
  // Chuỗi user đang nhập trong input (dễ gõ hơn, không bị lỗi khi rỗng)
  const [healthInput, setHealthInput] = useState<string>(
    initialBatteryHealth.toString()
  );

  const [note, setNote] = useState<string>(initialNote);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SwapFinalizeResponse | null>(null);
  const [message, setMessage] = useState("");

  // Helper: luôn thay thế toast cũ của hành động hiện tại thay vì tạo toast mới
  const oneToast = {
    success: (msg: string) =>
      toast.success(msg, { ...toastOpts, toastId: TOAST_ID.swap }),
    error: (msg: string) =>
      toast.error(msg, { ...toastOpts, toastId: TOAST_ID.swap }),
    info: (msg: string, extra?: Partial<typeof toastOpts>) =>
      toast.info(msg, { ...toastOpts, toastId: TOAST_ID.swap, ...extra }),
    warn: (msg: string) =>
      toast.warn(msg, { ...toastOpts, toastId: TOAST_ID.swap }),
  };

  const handleSwap = async () => {
    // Parse từ chuỗi người dùng nhập
    const parsed = Number(healthInput || "0");

    // 🎯 Pin cũ chỉ được 0–99%, 100% là pin mới
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99) {
      oneToast.warn("Vui lòng nhập % pin cũ trong khoảng 0-99.");
      return;
    }

    setHealth(parsed); // lưu lại giá trị hợp lệ để gửi BE
    setLoading(true);
    setMessage("");

    // ⭐ DEBUG
    console.log("🔍 SwapPanel - handleSwap called with:", {
      reservationId: reservation.reservationId,
      oldBatteryHealth: parsed,
      note: note,
      noteLength: note?.length || 0,
    });

    try {
      const res = await finalizeSwapFromReservation({
        reservationId: reservation.reservationId,
        oldBatteryHealth: parsed,
        note: note, // ⭐ Truyền note vào API
      });

      if (res.success) {
        // ✅ Thông báo có luôn thông tin dung lượng pin cũ staff nhập
        oneToast.success(
          `Đã ghi nhận % pin cũ = ${parsed}%. Thay pin thành công.`
        );
        setResult(res);
        onSwapped({ swapId: res.swapTransactionId });
      } else {
        const code = res.code;
        const msg =
          res.message ||
          "Đã có lỗi xảy ra khi hoàn tất giao dịch. Vui lòng kiểm tra lại.";

        if (code === 500 || code === 409 || code === 422) {
          oneToast.info(
            "Đã có lỗi khi hoàn tất giao dịch. Hệ thống có thể đã giữ chỗ pin (kho báo Reserved). Vui lòng kiểm tra tab Giao dịch/Doanh thu.",
            { autoClose: 3500 }
          );
          onSwapped({});
        } else {
          oneToast.error(msg.startsWith("❌") ? msg : `❌ ${msg}`);
          setMessage(msg);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể hoàn tất thay pin. Vui lòng thử lại.";
      oneToast.error(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* LEFT PANEL */}
      <section className="rounded-2xl bg-white shadow-lg p-5">
        <header className="mb-3">
          <p className="text-xs text-gray-500">
            Thay pin — Khách:&nbsp;
            <b>{reservation.userName || "Khách lẻ"}</b>
          </p>
        </header>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            % Pin cũ (0-99)
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={healthInput}
            onChange={(e) => {
              const v = e.target.value;
              // Chỉ cho phép số hoặc rỗng
              if (/^\d*$/.test(v)) {
                setHealthInput(v);
              }
            }}
            placeholder="Nhập % pin cũ (ví dụ: 85)"
          />
          <p className="mt-2 text-xs text-gray-500">
            Nhập % dung lượng pin cũ mà staff đo được (0-99%). 100% là pin mới,
            khách sẽ không cần đi thay.
          </p>
        </div>

        {/* Ghi chú (tùy chọn) */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Ghi chú (tuỳ chọn)
          </label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Pin cũ có dấu hiệu phồng nhẹ, đề nghị kiểm tra thêm."
          />
          <p className="mt-2 text-xs text-gray-500">
            Nội dung này sẽ được lưu vào trường notes của giao dịch.
          </p>
        </div>

        {message && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading}
            onClick={handleSwap}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang thực hiện…
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Xác nhận thay pin
              </>
            )}
          </button>
          <button
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 transition"
            onClick={() => {
              onCancel();
              toast.info("Đã đóng panel thay pin.", {
                ...toastOpts,
                toastId: TOAST_ID.close,
              });
            }}
            disabled={loading}
          >
            Đóng
          </button>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="rounded-2xl bg-white shadow-lg p-5">
        <h4 className="text-sm font-semibold mb-3">Kết quả hệ thống</h4>

        {!result ? (
          <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
            Sau khi bấm <b>“Xác nhận thay pin”</b>, pin mới sẽ hiển thị tại đây.
          </div>
        ) : (
          <div className="grid gap-3 text-sm">
            {/* Pin cũ */}
            <div className="rounded-xl border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                <Battery className="h-4 w-4" />
                Pin cũ
              </div>
              <div>
                <b>Serial:</b> {result.oldBattery?.serialNumber || "—"}
              </div>
              <div>
                <b>Model:</b> {result.oldBattery?.modelName || "—"}
              </div>
              <div>
                <b>Trạng thái:</b> {result.oldBattery?.status || "—"}
              </div>
            </div>

            {/* Pin mới */}
            <div className="rounded-xl border p-3 bg-emerald-50/60">
              <div className="mb-1 flex items-center gap-2 text-xs text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Pin mới
              </div>
              <div>
                <b>Serial:</b> {result.newBattery?.serialNumber || "—"}
              </div>
              <div>
                <b>Model:</b> {result.newBattery?.modelName || "—"}
              </div>
              <div>
                <b>Trạng thái:</b> {result.newBattery?.status || "—"}
              </div>
            </div>

            {/* Thông tin chung */}
            <div className="rounded-xl border p-3 bg-white">
              <div>
                <b>Mã swap:</b>{" "}
                {result.swapTransactionId || result.swapId || "—"}
              </div>
              <div>
                <b>Thời gian:</b>{" "}
                {result.timestamp
                  ? formatDateTime(result.timestamp as any)
                  : "—"}
              </div>
              <div>
                <b>Khách hàng:</b>{" "}
                {result.driverName || reservation.userName || "—"}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
