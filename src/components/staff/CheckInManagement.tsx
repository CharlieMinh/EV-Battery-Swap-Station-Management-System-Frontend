// src/components/staff/CheckInManagement.tsx
import React, { useRef, useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

export default function CheckInManagement({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (rawQrOrText: string) => void;
}) {
  const [manual, setManual] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const lockRef = useRef<number>(0); // chống gọi liên tục

  if (!open) return null;

  const triggerOnce = (text: string) => {
    const now = Date.now();
    if (now - lockRef.current < 1000) return; // 1s chống spam
    lockRef.current = now;
    onDetected(text);
  };

  const handleText = (txt?: string | null) => {
    if (!txt) return;
    triggerOnce(txt.trim());
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
            onUpdate={(errObj: any, result: any) => {
              try {
                if (result && typeof result.getText === "function") {
                  const text = result.getText();
                  if (text) handleText(text);
                } else if (errObj && errObj.name !== "NotFoundException") {
                  setErr("Không thể đọc mã.");
                }
              } catch {
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
              placeholder="Dán chuỗi QR (base64) hoặc nhập ReservationId"
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
