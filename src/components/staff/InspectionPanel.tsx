// src/components/staff/InspectionPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import { type Reservation, getUserNameById } from "../../services/staff/staffApi";
import { CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";

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
  const { t } = useLanguage();

  // 🔧 Dùng string tránh lỗi nhập 0
  const [batteryHealthInput, setBatteryHealthInput] = useState<string>("85");
  const [notes, setNotes] = useState("");
  const [loadedName, setLoadedName] = useState<string>("");

  // Nạp tên khách nếu userName trống
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!reservation?.userName && reservation?.userId) {
        try {
          const name = await getUserNameById(reservation.userId);
          if (mounted) setLoadedName(name);
        } catch {}
      } else {
        setLoadedName(reservation.userName || "");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [reservation.userId, reservation.userName, reservation.reservationId]);

  // Thông số random tham khảo
  const metrics = useMemo(
    () => ({
      voltage: Number((50 + Math.random() * 4).toFixed(2)),
      temperature: Number((25 + Math.random() * 5).toFixed(1)),
      SoH: Number((90 + Math.random() * 7).toFixed(1)),
    }),
    [reservation.reservationId]
  );

  // Xử lý input % pin
  const handleBatteryHealthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;

    if (v === "") {
      setBatteryHealthInput("");
      return;
    }
    if (v.length > 3) return;
    if (!/^\d+$/.test(v)) return;
    if (v.length > 1) v = v.replace(/^0+(\d)/, "$1");

    setBatteryHealthInput(v);
  };

  const finish = () => {
    const health =
      batteryHealthInput === "" ? NaN : Number(batteryHealthInput);

    if (!Number.isFinite(health) || health < 0 || health > 99) {
      toast.warning(t("staff.inspection.invalid"), {
        ...toastOpts,
        toastId: "insp-invalid-health",
      });
      return;
    }

    toast.success(t("staff.inspection.toastSaved"), {
      ...toastOpts,
      toastId: "insp-finish",
    });

    onDone(health, notes);
  };

  const customerLabel =
    reservation.userName ||
    loadedName ||
    (reservation.userId ? `${t("staff.inspection.customer")} #${String(reservation.userId).slice(-4)}` : "—");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT SECTION */}
      <section className="lg:col-span-2 rounded-2xl bg-white shadow-lg p-5">
        <header className="mb-3">
          <p className="text-xs text-gray-500">
            {t("staff.inspection.headerPrefix")} <b>{customerLabel}</b>
          </p>
        </header>

        {/* % Pin cũ */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t("staff.inspection.labelHealth")}
          </label>
          <input
            type="number"
            min="0"
            max="99"
            inputMode="numeric"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={batteryHealthInput}
            onChange={handleBatteryHealthChange}
            placeholder={t("staff.inspection.placeholderHealth")}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t("staff.inspection.helpHealth")}
          </p>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {t("staff.inspection.labelNotes")}
          </label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("staff.inspection.placeholderNotes")}
          />
        </div>

        {/* Metrics */}
        <div className="mb-5 rounded-xl border bg-gray-50 p-3">
          <div className="text-sm font-medium mb-2">{t("staff.inspection.metricsTitle")}</div>
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
              {t("staff.inspection.buttonFinish")}
            </button>
          )}

          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50 transition"
          >
            {t("staff.inspection.buttonClose")}
          </button>
        </div>
      </section>

      {/* RIGHT SECTION */}
      <aside className="rounded-2xl bg-white shadow-lg p-5">
        <h4 className="text-sm font-semibold mb-3">
          {t("staff.inspection.rightTitle")}
        </h4>

        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-gray-500">{t("staff.inspection.labelCustomer")}</div>
          <div className="font-medium text-gray-900">{customerLabel}</div>

          <div className="text-gray-500">{t("staff.inspection.labelVehicle")}</div>
          <div className="font-medium text-gray-900">{getVehicleName(reservation)}</div>

          <div className="text-gray-500">{t("staff.inspection.labelPlate")}</div>
          <div className="font-medium font-mono text-gray-900">{getPlate(reservation)}</div>

          <div className="text-gray-500">{t("staff.inspection.labelBatteryModel")}</div>
          <div className="font-semibold text-gray-900">
            {reservation.batteryModelName || reservation.batteryModelId || "—"}
          </div>
        </div>
      </aside>
    </div>
  );
}
