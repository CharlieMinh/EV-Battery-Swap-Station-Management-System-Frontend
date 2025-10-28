import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../../services/staff/staffApi";

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
        setOk(roles.includes((data.role as any) || "Staff"));
      } catch (e) {
        setOk(false);
      }
    })();
  }, [roles]);

  if (ok === null) return <div className="p-6 text-sm text-gray-500">Đang kiểm tra quyền…</div>;
  if (!ok) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
