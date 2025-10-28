import React, { useEffect, useState } from "react";
import {
  getMe,
  updateUser,
  resetPassword,
  type UserMe,
} from "../../services/staff/staffApi";
import {
  UserCircle2,
  Save,
  Shield,
  Phone,
  Mail,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export default function ProfileManagement() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    avatarUrl: "",
  });

  const [pwd, setPwd] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMe();
        setMe(data);
        const fullName = (data.fullName || data.name) || "";
        setForm({
          fullName,
          phone: data.phone || "",
          avatarUrl: data.avatarUrl || "",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSaveProfile = async () => {
    const id = (me?.userId || me?.id) as string;
    if (!id) return;
    if (!form.fullName.trim()) {
      alert("Vui lòng nhập họ tên.");
      return;
    }
    setSaving(true);
    try {
      await updateUser(id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl.trim(),
      });
      alert("✅ Đã lưu hồ sơ.");
    } catch (e) {
      alert("❌ Lưu hồ sơ thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (!pwd.newPassword) {
      alert("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      alert("❌ Xác nhận mật khẩu không khớp.");
      return;
    }
    setChangingPwd(true);
    try {
      await resetPassword({
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword,
      });
      alert("✅ Đã đổi mật khẩu.");
      setPwd({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      alert("❌ Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white shadow-lg p-5 text-sm text-gray-500">
        Đang tải hồ sơ…
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Hồ sơ cá nhân */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <UserCircle2 className="h-5 w-5" />
            Hồ sơ cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent>

        {/* Avatar + Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <div className="flex items-center gap-3">
            <input
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
              value={form.avatarUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, avatarUrl: e.target.value }))
              }
              placeholder="https://…"
            />
            <div className="h-12 w-12 overflow-hidden rounded-full border bg-gray-50 grid place-items-center">
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarUrl}
                  alt="avatar"
                  className="h-12 w-12 object-cover"
                />
              ) : (
                <ImageIcon className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/* Họ tên */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Họ tên</label>
          <input
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={form.fullName}
            onChange={(e) =>
              setForm((s) => ({ ...s, fullName: e.target.value }))
            }
            placeholder="Nguyễn Văn A"
          />
        </div>

        {/* SĐT */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
          <div className="flex items-center gap-2">
            <div className="grid place-items-center h-9 w-9 rounded-lg border bg-gray-50">
              <Phone className="h-4 w-4 text-gray-600" />
            </div>
            <input
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
              value={form.phone}
              onChange={(e) =>
                setForm((s) => ({ ...s, phone: e.target.value }))
              }
              placeholder="090…"
            />
          </div>
        </div>

        {/* Thông tin chỉ xem */}
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border p-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Email</div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span className="font-medium break-all">{me?.email}</span>
            </div>
          </div>
          <div className="rounded-xl border p-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Role</div>
            <div className="font-medium">{me?.role || "—"}</div>
          </div>
          <div className="rounded-xl border p-3 bg-gray-50">
            <div className="text-xs text-gray-500 mb-1">Trạm</div>
            <div className="font-medium">
              {me?.station?.name || me?.stationId || "—"}
            </div>
          </div>
        </div>

        <Button
          disabled={saving}
          onClick={onSaveProfile}
          className="inline-flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
        </CardContent>
      </Card>

      {/* Đổi mật khẩu */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Đổi mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Mật khẩu hiện tại
          </label>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={pwd.oldPassword}
            onChange={(e) =>
              setPwd((s) => ({ ...s, oldPassword: e.target.value }))
            }
            placeholder="••••••••"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={pwd.newPassword}
            onChange={(e) =>
              setPwd((s) => ({ ...s, newPassword: e.target.value }))
            }
            placeholder="••••••••"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-1">
            Xác nhận mật khẩu mới
          </label>
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            value={pwd.confirm}
            onChange={(e) =>
              setPwd((s) => ({ ...s, confirm: e.target.value }))
            }
            placeholder="••••••••"
          />
        </div>

          <Button
            onClick={onChangePassword}
            disabled={changingPwd}
            variant="outline"
          >
            {changingPwd ? "Đang đổi…" : "Đổi mật khẩu"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
