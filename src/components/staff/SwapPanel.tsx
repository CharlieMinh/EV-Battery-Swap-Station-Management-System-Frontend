// src/components/staff/SwapPanel.tsx
import React, { useState } from "react";
import {
  finalizeSwapFromReservation,
  type Reservation,
  type SwapFinalizeResponse,
} from "../../services/staff/staffApi";
import {
  CheckCircle,
  Battery,
  BadgeCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type Props = {
  reservation: Reservation;
  oldBatterySerial: string;
  onSwapped: (info: { swapId?: string }) => void;
  onCancel: () => void;
};

export default function SwapPanel({
  reservation,
  oldBatterySerial,
  onSwapped,
  onCancel,
}: Props) {
  const [serial, setSerial] = useState(oldBatterySerial || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SwapFinalizeResponse | null>(null);
  const [message, setMessage] = useState("");

  const handleSwap = async () => {
    if (!serial.trim()) {
      alert("⚠️ Vui lòng nhập serial pin cũ.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await finalizeSwapFromReservation({
        reservationId: reservation.reservationId,
        oldBatterySerial: serial.trim(),
      });

      if (res.success) {
        alert("✅ Đã xác nhận thay pin thành công.");
        setResult(res);
        onSwapped({ swapId: res.swapTransactionId });
      } else {
        // Xử lý fallback lỗi
        const code = res.code;
        const msg =
          res.message ||
          "Đã có lỗi xảy ra khi hoàn tất giao dịch. Vui lòng kiểm tra lại.";

        if (code === 500 || code === 409 || code === 422) {
          alert(
            "⚠️ Đã có lỗi xảy ra khi hoàn tất giao dịch.\n" +
              "Tuy nhiên hệ thống có thể đã giữ chỗ pin (kho báo Reserved).\n" +
              "Mình sẽ đóng bảng này. Vui lòng kiểm tra tab Giao dịch/Doanh thu."
          );
          onSwapped({});
        } else {
          alert(`❌ ${msg}`);
          setMessage(msg);
        }
      }
    } catch (err: any) {
      console.error("SwapPanel error:", err);
      alert("❌ Không thể hoàn tất thay pin. Vui lòng thử lại.");
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
            Thay pin — Reservation: <b>{reservation.reservationId}</b>
          </p>
        </header>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Serial pin cũ
          </label>
          <input
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Nhập serial pin cũ"
          />
          <p className="mt-2 text-xs text-gray-500">
            Hệ thống sẽ kiểm tra tương thích và tự chọn pin mới phù hợp.
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
            onClick={onCancel}
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
                <b>Mã swap:</b> {result.swapTransactionId || result.swapId || "—"}
              </div>
              <div>
                <b>Thời gian:</b>{" "}
                {result.timestamp
                  ? new Date(result.timestamp).toLocaleString()
                  : "—"}
              </div>
              <div>
                <b>Khách hàng:</b> {result.driverName || "—"}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
