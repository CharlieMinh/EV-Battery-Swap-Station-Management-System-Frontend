// src/components/staff/RequireRole.tsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../../services/staff/staffApi";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

export default function RequireRole({
  roles,
  children,
}: {
  roles: Array<"Admin" | "Staff" | "Driver">;
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState<null | boolean>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMe();
        const role = (data.role as any) || "Staff";

        if (roles.includes(role)) {
          setOk(true);
          toast.success(`✅ Đăng nhập thành công với quyền: ${role}`, {
            autoClose: 2000,
          });
        } else {
          setOk(false);
          toast.error("❌ Bạn không có quyền truy cập vào trang này!", {
            autoClose: 2500,
          });
        }
      } catch (e) {
        setOk(false);
        toast.error("⚠️ Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập!", {
          autoClose: 2500,
        });
      }
    })();
  }, [roles]);

  if (ok === null)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        <span>Đang kiểm tra quyền truy cập...</span>
      </div>
    );

  if (!ok) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
