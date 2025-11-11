// src/components/staff/InspectionPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import { type Reservation, getUserNameById } from "../../services/staff/staffApi";
import { CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

const toastOpts = {
  position: "top-right" as const,
  autoClose: 2200,
  closeOnClick: true,
};

type Props = {
  reservation: Reservation;
  onDone: (batteryHealth: number, note: string) => void;
  onCancel: () => void;
  isComplaint?: boolean;
};

/* ===== Helpers hiển thị (không thay đổi logic dữ liệu) ===== */
function getVehicleName(r: any): string {
  return (
    r?.vehicleName ||
    r?.vehicleModelName ||
    r?.vehicle?.vehicleModel?.name ||
    r?.vehicle?.modelName ||
    r?.vehicleModel ||
    "—"
  );
}

function getPlate(r: any): string {
  const p =
    r?.licensePlate ||
    r?.vehiclePlate ||
    r?.vehicle?.plateNumber ||
    r?.vehicle?.licensePlate ||
    r?.vehicle?.plate ||
    r?.plate ||
    "";
  return (p || "—").toString().toUpperCase();
}

export default function InspectionPanel({
  reservation,
  onDone,
  onCancel,
  isComplaint = false,
}: Props) {
  // 🔧 Dùng string để tránh bị dính số 0 khi xoá / gõ lại
  const [batteryHealthInput, setBatteryHealthInput] = useState<string>("85"); // hiển thị
  const [notes, setNotes] = useState("");
  const [loadedName, setLoadedName] = useState<string>("");

  // ⭐ Nạp tên khách theo userId (dùng cache có sẵn), chỉ khi reservation.userName trống
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!reservation?.userName && reservation?.userId) {
        try {
          const name = await getUserNameById(reservation.userId);
          if (mounted) setLoadedName(name);
        } catch {
          // bỏ qua, sẽ fallback Khách #xxxx
        }
      } else {
        // nếu đã có userName từ list thì giữ nguyên
        setLoadedName(reservation.userName || "");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reservation.userId, reservation.userName, reservation.reservationId]);

  // Thông số tham khảo (ngẫu nhiên)
  const metrics = useMemo(
    () => ({
      voltage: Number((50 + Math.random() * 4).toFixed(2)),
      temperature: Number((25 + Math.random() * 5).toFixed(1)),
      SoH: Number((90 + Math.random() * 7).toFixed(1)),
    }),
    [reservation.reservationId]
  );

  // 🔧 Handler cho ô % pin cũ: cho phép "" để dễ xoá, chặn ký tự lạ, bỏ bớt 0 ở đầu
  const handleBatteryHealthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;

    // Cho phép rỗng để user xóa hết rồi gõ lại
    if (v === "") {
      setBatteryHealthInput("");
      return;
    }

    // Chỉ cho tối đa 3 ký tự (đề phòng user gõ 100)
    if (v.length > 3) return;

    // Chỉ cho số
    if (!/^\d+$/.test(v)) return;

    // Bỏ bớt 0 ở đầu cho đẹp (001 -> 1, 010 -> 10)
    if (v.length > 1) {
      v = v.replace(/^0+(\d)/, "$1");
    }

    setBatteryHealthInput(v);
  };

  const finish = () => {
    // Convert string -> number để giữ nguyên logic cũ
    const health =
      batteryHealthInput === "" ? NaN : Number(batteryHealthInput);

    // 🎯 Pin cũ 0–99, 100% là pin mới
    if (!Number.isFinite(health) || health < 0 || health > 99) {
      toast.warning("Vui lòng nhập % pin cũ trong khoảng 0-99.", {
        ...toastOpts,
        toastId: "insp-invalid-health",
      });
      return;
    }

    toast.success("Đã lưu kết quả kiểm tra pin.", {
      ...toastOpts,
      toastId: "insp-finish",
    });

    onDone(health, notes); // vẫn trả về number như trước
  };

  // Tên hiển thị (ưu tiên userName -> loadedName -> Khách #xxxx)
  const customerLabel =
    reservation.userName ||
    loadedName ||
    (reservation.userId ? `Khách #${String(reservation.userId).slice(-4)}` : "—");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT: Form kiểm tra pin cũ */}
      <section className="lg:col-span-2 rounded-2xl bg-white shadow-lg p-5">
        <header className="mb-3">
          <p className="text-xs text-gray-500">
            Kiểm tra pin cũ — Khách: <b>{customerLabel}</b>
          </p>
        </header>

        {/* % Pin cũ */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">% Pin cũ (0-99)</label>
          <input
            type="number"
            min="0"
            max="99"
            inputMode="numeric"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={batteryHealthInput}
            onChange={handleBatteryHealthChange}
            placeholder="Nhập % pin cũ (ví dụ: 85)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Nhập % dung lượng pin còn lại (0-99%). 100% là pin mới, khách sẽ không cần đi thay.
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
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 transition"
          >
            Đóng
          </button>
        </div>
      </section>

      {/* RIGHT: Thông tin đặt lịch */}
      <aside className="rounded-2xl bg-white shadow-lg p-5">
        <h4 className="text-sm font-semibold mb-3">Thông tin đặt lịch</h4>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-gray-500">Khách</div>
          <div className="font-medium text-gray-900">{customerLabel}</div>

          <div className="text-gray-500">Xe</div>
          <div className="font-medium text-gray-900">{getVehicleName(reservation)}</div>

          <div className="text-gray-500">Biển số</div>
          <div className="font-medium font-mono text-gray-900">
            {getPlate(reservation)}
          </div>

          <div className="text-gray-500">Model pin</div>
          <div className="font-semibold text-gray-900">
            {reservation.batteryModelName || reservation.batteryModelId || "—"}
          </div>
        </div>
      </aside>
    </div>
  );
}
