import React, { useMemo, useState, useEffect, ChangeEvent } from "react";
import { uploadFile, type Reservation } from "../../services/staff/staffApi";
import { CheckCircle, Upload, X, Image as ImageIcon, AlertTriangle } from "lucide-react";

type Props = {
  reservation: Reservation;
  onDone: (oldSerial: string) => void;
  onCancel: () => void;
};

// Tạo serial ổn định theo reservationId (tự sinh, không cần nút)
function makeStableSerial(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = (h ^ seed.charCodeAt(i)) * 16777619;
  const n1 = Math.abs(h % 1000000);
  const n2 = Math.abs(((h >>> 1) ^ 0x9e3779b9) % 1000000);
  return `OLD-${n1.toString().padStart(6, "0")}-${n2.toString().padStart(6, "0")}`;
}

export default function InspectionPanel({ reservation, onDone, onCancel }: Props) {
  const [appearance, setAppearance] = useState<"OK" | "Damaged">("OK");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [serial, setSerial] = useState("");

  // Tự sinh serial khi mở panel (một lần)
  useEffect(() => {
    if (!serial) {
      const seed = reservation?.reservationId || crypto.randomUUID();
      setSerial(makeStableSerial(seed));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation?.reservationId]);

  // Thông số tham khảo (ngẫu nhiên)
  const metrics = useMemo(
    () => ({
      voltage: Number((50 + Math.random() * 4).toFixed(2)),
      temperature: Number((25 + Math.random() * 5).toFixed(1)),
      SoH: Number((90 + Math.random() * 7).toFixed(1)),
    }),
    [reservation.reservationId]
  );

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const f of files) {
      try {
        const url = await uploadFile(f);
        setImages((prev) => [...prev, url]);
      } catch {
        alert("Tải ảnh thất bại. Vui lòng thử lại.");
      }
    }
    e.currentTarget.value = "";
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((x) => x !== url));

  const finish = () => {
    if (!serial.trim()) {
      alert("Vui lòng nhập hoặc giữ serial pin cũ.");
      return;
    }
    onDone(serial.trim());
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

        {/* Serial */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Serial pin cũ</label>
          <input
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            placeholder="Nhập serial pin cũ"
          />
          <p className="mt-1 text-xs text-gray-500">Đã tự điền ngẫu nhiên. Bạn có thể sửa nếu cần.</p>
        </div>

        {/* Ngoại hình */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Ngoại hình</label>
          <select
            className="w-full rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
            value={appearance}
            onChange={(e) => setAppearance(e.target.value as "OK" | "Damaged")}
          >
            <option value="OK">OK</option>
            <option value="Damaged">Damaged</option>
          </select>
          {appearance === "Damaged" && (
            <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Vui lòng chụp ảnh rõ khu vực hư hỏng và ghi chú chi tiết.
            </div>
          )}
        </div>

        {/* Ghi chú */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Ghi chú</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Trầy nhẹ ở cạnh phải, chụp ảnh kèm theo"
          />
        </div>

        {/* Ảnh pin cũ */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Ảnh pin cũ</div>
            <div className="text-xs text-gray-500">{images.length} ảnh đã tải</div>
          </div>

          <label className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            <span className="text-sm">Tải ảnh (có thể chọn nhiều)</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          </label>

          {images.length ? (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((url) => (
                <div key={url} className="group relative overflow-hidden rounded-lg border">
                  <img src={url} alt="battery" className="h-32 w-full object-cover" />
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute top-1 right-1 rounded-full bg-white/90 p-1 shadow hover:bg-white"
                    title="Xóa ảnh"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
              <ImageIcon className="h-4 w-4" />
              Chưa có ảnh nào được tải lên.
            </div>
          )}
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
          <button
            onClick={finish}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800 transition"
          >
            <CheckCircle className="h-4 w-4" />
            Hoàn tất kiểm tra
          </button>
          <button onClick={onCancel} className="rounded-lg border px-4 py-2 hover:bg-gray-50 transition">
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
            <dd className="font-medium">{reservation.batteryModelName || reservation.batteryModelId || "—"}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
