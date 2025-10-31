import React, { useMemo, useState, ChangeEvent } from "react";
import { uploadFile, type Reservation } from "../../services/staff/staffApi";
import { CheckCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";

type Props = {
  reservation: Reservation;
  onDone: (batteryHealth: number) => void;
  onCancel: () => void;
};

const toastOpts = { position: "top-right" as const, autoClose: 2200, closeOnClick: true };

export default function InspectionPanel({ reservation, onDone, onCancel }: Props) {
  const [batteryHealth, setBatteryHealth] = useState<number>(85); // % pin cũ
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<string[]>([]);

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

    let successCount = 0;
    let failCount = 0;

    for (const f of files) {
      try {
        const url = await uploadFile(f);
        setImages((prev) => [...prev, url]);
        successCount += 1;
      } catch (err: any) {
        failCount += 1;
      }
    }

    // ✅ Chỉ 1 thông báo tổng kết cho hành động upload
    if (successCount && !failCount) {
      toast.success(`Đã tải lên ${successCount} ảnh.`, {
        ...toastOpts,
        toastId: `insp-upload-success-${successCount}`,
      });
    } else if (!successCount && failCount) {
      const msg = "Tải ảnh thất bại. Vui lòng thử lại.";
      toast.error(msg, { ...toastOpts, toastId: "insp-upload-fail" });
    } else {
      toast.info(`Đã tải ${successCount} ảnh, lỗi ${failCount} ảnh.`, {
        ...toastOpts,
        toastId: `insp-upload-mixed-${successCount}-${failCount}`,
      });
    }

    e.currentTarget.value = "";
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((x) => x !== url));
    // ✅ 1 toast cho mỗi lần bấm xóa (người dùng chỉ bấm 1 lần)
    toast.info("Đã xóa ảnh.", { ...toastOpts, toastId: `insp-delete-${url}` });
  };

  const finish = () => {
    if (batteryHealth < 0 || batteryHealth > 100) {
      // ❗ 1 toast cảnh báo khi % không hợp lệ
      toast.warning("Vui lòng nhập % pin cũ trong khoảng 0-100.", {
        ...toastOpts,
        toastId: "insp-invalid-health",
      });
      return;
    }
    // ✅ 1 toast xác nhận lưu
    toast.success("Đã lưu kết quả kiểm tra pin.", {
      ...toastOpts,
      toastId: "insp-finish",
    });
    onDone(batteryHealth);
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
          <label className="block text-sm font-medium mb-1">% Pin cũ (0-100)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={batteryHealth}
            onChange={(e) => setBatteryHealth(Number(e.target.value))}
            placeholder="Nhập % pin cũ (ví dụ: 85)"
          />
          <p className="mt-1 text-xs text-gray-500">Nhập % dung lượng pin còn lại (0-100%).</p>
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
          <button
            onClick={() => {
              onCancel();
              toast.info("Đã đóng kiểm tra pin.", { ...toastOpts, toastId: "insp-cancel" });
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
              {reservation.batteryModelName || reservation.batteryModelId || "—"}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
