// src/components/staff/CheckInManagement.tsx
import React, { useRef, useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { toast } from "react-toastify";

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
  const lockRef = useRef<number>(0);           // chống gọi liên tục
  const lastErrorMsgRef = useRef<string | null>(null); // tránh spam toast lỗi giống nhau

  if (!open) return null;

  const toastOpts = {
    position: "top-right" as const,
    autoClose: 2200,
    closeOnClick: true,
  };

  const triggerOnce = (text: string) => {
    const now = Date.now();
    if (now - lockRef.current < 1000) return; // 1s chống spam
    lockRef.current = now;

    // ✅ Giữ nguyên: chỉ gọi onDetected
    onDetected(text);

    // ✅ Thông báo quét thành công (chỉ hiển thị 1 lần nhờ toastId)
    const preview = text.length > 48 ? text.slice(0, 45).trim() + "..." : text.trim();
    toast.success(`Đã quét mã: ${preview}`, {
      ...toastOpts,
      toastId: `qr-success-${preview}`, // cùng preview => không bị hiển thị trùng
    });

    if (err) setErr(null);
  };

  const handleText = (txt?: string | null) => {
    if (!txt) return;
    triggerOnce(txt.trim());
  };

  const setErrorWithToast = (msg: string) => {
    setErr(msg);
    if (lastErrorMsgRef.current !== msg) {
      lastErrorMsgRef.current = msg;
      toast.error(msg, { ...toastOpts, toastId: `qr-error-${msg}` });
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
              toast.info("Đã đóng cửa sổ quét.", { ...toastOpts, toastId: "qr-close" });
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
                    handleText(text);
                  }
                } else if (errObj) {
                  // "Không thấy mã" sẽ lặp liên tục khi camera chưa nhìn thấy gì — bỏ qua
                  if (errObj.name === "NotFoundException") return;

                  if (errObj.name === "NotAllowedError") {
                    setErrorWithToast("Trình duyệt bị chặn quyền camera. Hãy cấp quyền và thử lại.");
                  } else if (errObj.name === "NotReadableError") {
                    setErrorWithToast("Không truy cập được camera. Kiểm tra ứng dụng khác đang dùng camera.");
                  } else if (errObj.name === "OverconstrainedError") {
                    setErrorWithToast("Không tìm thấy thiết bị camera phù hợp. Thử chuyển sang camera khác.");
                  } else {
                    setErrorWithToast("Không thể đọc mã.");
                  }
                }
              } catch {
                setErrorWithToast("Không thể đọc mã.");
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
              onClick={() => {
                const v = manual.trim();
                if (!v) {
                  toast.warn("Vui lòng nhập nội dung để xác nhận.", {
                    ...toastOpts,
                    toastId: "qr-manual-empty",
                  });
                  return;
                }
                handleText(v);
                toast.success("Đã xác nhận thủ công nội dung quét.", {
                  ...toastOpts,
                  toastId: "qr-manual-ok",
                });
              }}
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
