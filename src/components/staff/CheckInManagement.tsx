import React, { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

export default function CheckInManagement({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (reservationId: string) => void;
}) {
  const [manual, setManual] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const handleText = (txt?: string | null) => {
    if (!txt) return;
    let id = "";
    try {
      const p = JSON.parse(txt);
      id = p.reservationId || p.id || p.code || "";
    } catch {
      id = txt.trim();
    }
    if (id) onDetected(id);
    else setErr("QR/Barcode không hợp lệ");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">📷 Quét mã Check-in</h3>
          <button onClick={onClose} className="border px-3 py-1 rounded-lg">
            Đóng
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border relative">
          <BarcodeScannerComponent
            width={640}
            height={360}
            facingMode="environment"
            onUpdate={(err: any, result: any) => {
              // react-qr-barcode-scanner API
              // result.getText() chứa nội dung mã nếu đọc được
              if (result && typeof result.getText === "function") {
                const text = result.getText();
                if (text) handleText(text);
              } else if (err && err.name !== "NotFoundException") {
                setErr("Không thể đọc mã.");
              }
            }}
          />
        </div>

        <div className="mt-3">
          {err && <div className="text-xs text-red-600 mb-2">{err}</div>}
          <div className="flex gap-2">
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Nhập Reservation ID (fallback)"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
            />
            <button
              className="rounded border px-3 py-2"
              onClick={() => manual.trim() && handleText(manual.trim())}
            >
              Xác nhận
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Lưu ý: Trình duyệt cần chạy trên HTTPS hoặc localhost để mở camera.
          </p>
        </div>
      </div>
    </div>
  );
}
