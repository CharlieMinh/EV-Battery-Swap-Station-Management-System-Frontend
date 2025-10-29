// src/components/staff/CheckInManagement.tsx
import React, { useEffect, useRef, useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { toast, Id } from "react-toastify"; // ✅ dùng Id thay cho React.ReactText

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

  // Chặn gọi liên tục khi camera đọc liên tiếp
  const fireLockRef = useRef<number>(0);
  // Chặn spam toast lỗi liên tục
  const lastErrAtRef = useRef<number>(0);
  // Lưu toast id để đóng khi đóng modal
  const openTipsToastIdRef = useRef<Id | null>(null); // ✅ sửa kiểu

  // Khi modal mở, nhắc người dùng về HTTPS/quyền camera
  useEffect(() => {
    if (!open) return;

    const tips =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.protocol !== "https:"
        ? "⚠️ Hãy chạy trên HTTPS (hoặc localhost) để mở camera."
        : "📷 Đang mở camera… nếu trình duyệt hỏi quyền, hãy bấm Cho phép.";

    openTipsToastIdRef.current = toast.info(tips, { autoClose: 3500 });

    return () => {
      if (openTipsToastIdRef.current != null) {
        toast.dismiss(openTipsToastIdRef.current);
        openTipsToastIdRef.current = null;
      }
    };
  }, [open]);

  if (!open) return null;

  const triggerOnce = (text: string, source: "auto" | "manual") => {
    const now = Date.now();
    if (now - fireLockRef.current < 1000) return; // 1s chống spam
    fireLockRef.current = now;

    const preview =
      text.length > 36 ? `${text.slice(0, 16)}…${text.slice(-12)}` : text;
    toast.success(
      source === "auto"
        ? `Đã đọc mã: ${preview}`
        : `Đã gửi mã nhập tay: ${preview}`,
      { autoClose: 1800 }
    );

    onDetected(text);
  };

  const handleText = (
    txt?: string | null,
    source: "auto" | "manual" = "auto"
  ) => {
    const val = (txt ?? "").trim();
    if (!val) return;
    triggerOnce(val, source);
  };

  const pushErrorOnce = (message: string) => {
    setErr(message);
    const now = Date.now();
    if (now - lastErrAtRef.current > 3000) {
      lastErrAtRef.current = now;
      toast.error(message, { autoClose: 2200 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">📷 Quét mã Check-in</h3>
          <button
            onClick={() => {
              onClose();
              if (openTipsToastIdRef.current != null) {
                toast.dismiss(openTipsToastIdRef.current);
                openTipsToastIdRef.current = null;
              }
            }}
            className="border px-3 py-1 rounded-lg"
          >
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
                  if (text) {
                    handleText(text, "auto");
                    return;
                  }
                }

                if (errObj) {
                  const name = String(errObj?.name || "");
                  // "NotFoundException" xuất hiện liên tục khi mỗi frame không thấy mã — bỏ qua
                  if (name === "NotFoundException") return;

                  if (name === "NotAllowedError") {
                    pushErrorOnce(
                      "Truy cập camera bị từ chối. Hãy cho phép quyền camera."
                    );
                  } else if (name === "NotReadableError") {
                    pushErrorOnce(
                      "Không truy cập được camera. Thiết bị đang bận?"
                    );
                  } else if (name === "NotSupportedError") {
                    pushErrorOnce("Trình duyệt không hỗ trợ camera.");
                  } else {
                    pushErrorOnce("Không thể đọc mã. Thử lại hoặc nhập tay.");
                  }
                }
              } catch {
                pushErrorOnce("Không thể đọc mã. Thử lại hoặc nhập tay.");
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && manual.trim()) {
                  handleText(manual, "manual");
                }
              }}
            />
            <button
              className="rounded border px-3 py-2"
              onClick={() => manual.trim() && handleText(manual, "manual")}
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
