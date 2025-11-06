import React, { useMemo, useState } from "react";
import { type Reservation } from "../../services/staff/staffApi";
import { CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

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

type Props = {
  reservation: Reservation;
  onDone: (batteryHealth: number, note: string) => void;
  onCancel: () => void;
  isComplaint?: boolean;
};

export default function InspectionPanel({
  reservation,
  onDone,
  onCancel,
  isComplaint = false,
}: Props) {
  const [batteryHealth, setBatteryHealth] = useState<number>(85); // % pin cũ
  const [notes, setNotes] = useState("");

  // Thông số tham khảo (ngẫu nhiên)
  const metrics = useMemo(
    () => ({
      voltage: Number((50 + Math.random() * 4).toFixed(2)),
      temperature: Number((25 + Math.random() * 5).toFixed(1)),
      SoH: Number((90 + Math.random() * 7).toFixed(1)),
    }),
    [reservation.reservationId]
  );

  const finish = () => {
    if (batteryHealth < 0 || batteryHealth > 100) {
      // ❗ 1 toast cảnh báo khi % không hợp lệ
      toast.warning("Vui lòng nhập % pin cũ trong khoảng 0-100.", {
        ...toastOpts,
        toastId: "insp-invalid-health",
      });
      return;
    }

    // ⭐ DEBUG: Log để kiểm tra notes có giá trị không
    console.log("🔍 InspectionPanel - finish called with:", {
      batteryHealth,
      notes,
      notesLength: notes?.length || 0,
    });

    // ✅ 1 toast xác nhận lưu
    toast.success("Đã lưu kết quả kiểm tra pin.", {
      ...toastOpts,
      toastId: "insp-finish",
    });
    onDone(batteryHealth, notes);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT: Form kiểm tra pin cũ */}
      <section className="lg:col-span-2 rounded-2xl bg-white shadow-lg p-5">
        <header className="mb-3">
          <p className="text-xs text-gray-500">
            Kiểm tra pin cũ — Reservation: <b>{reservation.reservationId}</b>
          </p>
        </header>

        {/* % Pin cũ */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            % Pin cũ (0-100)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={batteryHealth}
            onChange={(e) => setBatteryHealth(Number(e.target.value))}
            placeholder="Nhập % pin cũ (ví dụ: 85)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Nhập % dung lượng pin còn lại (0-100%).
          </p>
        </div>

        {/* Ghi chú */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Ghi chú</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú thêm về tình trạng pin (nếu có)"
          />
        </div>

        {/* Thông số tham khảo */}
        <div className="mb-5 rounded-xl border bg-gray-50 p-3">
          <div className="text-sm font-medium mb-2">Thông số (tham khảo)</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md bg-white border p-2">
              <div className="text-xs text-gray-500">Voltage</div>
              <div className="font-semibold">{metrics.voltage} V</div>
            </div>
            <div className="rounded-md bg-white border p-2">
              <div className="text-xs text-gray-500">Temperature</div>
              <div className="font-semibold">{metrics.temperature} °C</div>
            </div>
            <div className="rounded-md bg-white border p-2">
              <div className="text-xs text-gray-500">SoH</div>
              <div className="font-semibold">{metrics.SoH} %</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ẩn nút Hoàn tất kiểm tra nếu đang xử lý khiếu nại */}
          {!isComplaint && (
            <button
              onClick={finish}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 transition"
            >
              <CheckCircle className="h-4 w-4" />
              Hoàn tất kiểm tra
            </button>
          )}

          <button
            onClick={() => {
              onCancel();
              toast.info("Đã đóng kiểm tra pin.", {
                ...toastOpts,
                toastId: "insp-cancel",
              });
            }}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 transition"
          >
            Đóng
          </button>
        </div>
      </section>

      {/* RIGHT: Thông tin đặt lịch */}
      <aside className="rounded-2xl bg-white shadow-lg p-5">
        <h4 className="text-sm font-semibold mb-3">Thông tin đặt lịch</h4>
        <dl className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <dt className="text-gray-500">Khách</dt>
            <dd className="font-medium">{reservation.userName || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Xe</dt>
            <dd className="font-medium">
              {reservation.vehiclePlate || reservation.vehicleModelName || "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Model pin</dt>
            <dd className="font-medium">
              {reservation.batteryModelName ||
                reservation.batteryModelId ||
                "—"}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
