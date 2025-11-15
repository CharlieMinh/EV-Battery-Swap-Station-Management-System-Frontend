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
  const [err, setErr] = useState<string | null>(null);

  // ✅ chống spam gọi detect
  const lockRef = useRef<number>(0);

  // ✅ chống spam lỗi giống nhau
  const lastErrorMsgRef = useRef<string | null>(null);

  if (!open) return null;

  const toastOpts = {
    position: "top-right" as const,
    autoClose: 2200,
    closeOnClick: true,
  };

  /* =====================================================
   ✅ Hàm chỉ quét 1 lần / 1s (giữ nguyên logic cũ)
  ===================================================== */
  const triggerOnce = (text: string) => {
    const now = Date.now();
    if (now - lockRef.current < 1000) return;
    lockRef.current = now;

    // Gửi raw QR cho cha xử lý (giữ nguyên logic)
    onDetected(text);

    // vẫn tính preview để dùng làm toastId (tránh spam trùng id)
    const preview =
      text.length > 48 ? text.slice(0, 45).trim() + "..." : text.trim();

    // 🔔 CHỈ ĐỔI NỘI DUNG THÔNG BÁO, KHÔNG HIỆN DÃY KÝ TỰ QR
    toast.success("Đã quét mã thành công.", {
      ...toastOpts,
      toastId: `qr-success-${preview}`,
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

  /* ===========================
     RENDER 
  ============================ */
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg">
        {/* HEADER */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">📷 Quét mã Check-in</h3>
          <button
            onClick={() => {
              onClose();
              toast.info("Đã đóng cửa sổ quét.", {
                ...toastOpts,
                toastId: "qr-close",
              });
            }}
            className="border px-3 py-1 rounded-lg"
          >
            Đóng
          </button>
        </div>

        {/* CAMERA */}
        <div className="overflow-hidden rounded-lg border relative">
          <BarcodeScannerComponent
            width={640}
            height={360}
            facingMode="environment"
            onUpdate={(errObj: any, result: any) => {
              try {
                // ✅ khi quét được
                if (result && typeof result.getText === "function") {
                  const text = result.getText();
                  if (text) handleText(text);
                  return;
                }

                // ✅ khi lỗi
                if (errObj) {
                  if (errObj.name === "NotFoundException") return;

                  if (errObj.name === "NotAllowedError") {
                    setErrorWithToast(
                      "Trình duyệt bị chặn quyền camera. Hãy cấp quyền và thử lại."
                    );
                  } else if (errObj.name === "NotReadableError") {
                    setErrorWithToast(
                      "Không truy cập được camera. Kiểm tra ứng dụng khác đang dùng camera."
                    );
                  } else if (errObj.name === "OverconstrainedError") {
                    setErrorWithToast(
                      "Không tìm thấy thiết bị camera phù hợp. Thử chuyển sang camera khác."
                    );
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

        {/* ✅ Thông báo lỗi */}
        {err && <p className="text-xs text-red-600 mt-2">{err}</p>}

        <p className="mt-3 text-xs text-gray-500 text-center">
          Lưu ý: Trình duyệt cần chạy trên HTTPS hoặc localhost để mở camera.
        </p>
      </div>
    </div>
  );
}
