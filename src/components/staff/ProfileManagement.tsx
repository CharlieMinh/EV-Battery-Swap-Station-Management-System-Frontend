// src/components/staff/ProfileManagement.tsx
import React, { useEffect, useState } from "react";
import {
  getMe,
  updateUser,
  resetPassword,
  type UserMe,
} from "../../services/staff/staffApi";
import {
  User,
  Mail,
  PhoneCallIcon,
  Shield,
  Loader2,
  Edit,
  RefreshCcw,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { toast } from "react-toastify";

export default function ProfileManagement() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const applyProfile = (data: UserMe) => {
    setMe(data);
    setForm({
      fullName: (data.fullName || data.name) || "",
      phone: data.phone || "",
      avatarUrl: data.avatarUrl || "",
    });
  };

  const fetchProfile = async (withToast = false) => {
    setLoading(true);
    setError(null);
    const promise = getMe();
    try {
      if (withToast) {
        const res = await toast.promise(
          promise,
          {
            pending: "Đang tải thông tin cá nhân...",
            success: "Tải thông tin thành công.",
            error: "Không thể tải thông tin cá nhân. Vui lòng thử lại.",
          },
          { autoClose: 1800 }
        );
        applyProfile(res.data);
      } else {
        const { data } = await promise;
        applyProfile(data);
      }
    } catch (err) {
      setError("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(false); // lần đầu im lặng để đỡ ồn toast
  }, []);

  const handleUpdateProfile = async () => {
    if (!me) return;
    if (!form.fullName.trim()) {
      toast.warning("Vui lòng nhập họ tên.");
      return;
    }

    // ✅ Lấy userId an toàn
    const userId =
      (me as any)?.userId ||
      (me as any)?.id ||
      (me as any)?.user?.id ||
      (me as any)?.user?.userId ||
      (me as any)?.Id ||
      "";

    if (!userId) {
      toast.error("Không xác định được ID người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    setSaving(true);
    const promise = updateUser(userId, {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      avatarUrl: form.avatarUrl.trim(),
    });

    try {
      await toast.promise(
        promise,
        {
          pending: "Đang cập nhật hồ sơ...",
          success: "✅ Cập nhật thành công!",
          error: {
            render({ data }) {
              const err: any = data;
              return (
                err?.response?.data?.message ||
                err?.message ||
                "❌ Cập nhật thất bại. Vui lòng thử lại."
              );
            },
          },
        },
        { autoClose: 2000 }
      );
      // Tải lại hồ sơ (có toast nhẹ)
      await fetchProfile(true);
    } catch {
      // lỗi đã hiển thị qua toast.promise
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwd.oldPassword.trim()) {
      toast.warning("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!pwd.newPassword.trim()) {
      toast.warning("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      toast.warning("❌ Xác nhận mật khẩu không khớp.");
      return;
    }

    setChangingPwd(true);
    const promise = resetPassword({
      oldPassword: pwd.oldPassword,
      newPassword: pwd.newPassword,
    });

    try {
      await toast.promise(
        promise,
        {
          pending: "Đang đổi mật khẩu...",
          success: "✅ Đã đổi mật khẩu thành công!",
          error: {
            render({ data }) {
              const err: any = data;
              return (
                err?.response?.data?.message ||
                err?.message ||
                "❌ Đổi mật khẩu thất bại. Vui lòng kiểm tra lại."
              );
            },
          },
        },
        { autoClose: 2200 }
      );
      setPwd({ oldPassword: "", newPassword: "", confirm: "" });
    } catch {
      // lỗi đã hiển thị qua toast.promise
    } finally {
      setChangingPwd(false);
    }
  };

  // --- Render logic ---
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-16 py-10">
        <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <p className="mt-4 text-lg text-gray-600">
              Đang tải thông tin cá nhân...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-16 py-10">
        <Card className="border-2 border-red-200 shadow-xl bg-red-50 rounded-3xl p-6 sm:p-10">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="mt-4 text-lg text-red-700 font-semibold">
              {error || "Không tìm thấy dữ liệu người dùng."}
            </p>
            <Button
              onClick={() => fetchProfile(true)}
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 px-8 lg:px-16 py-10">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-4xl font-bold text-orange-600 tracking-tight">
          Hồ sơ nhân viên
        </h1>
      </div>

      {/* Profile Card */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-28 h-28 shadow-lg border-4 border-orange-500">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt="avatar"
                  className="rounded-full object-cover w-28 h-28"
                  onError={() => toast.error("Ảnh đại diện không hợp lệ.")}
                />
              ) : (
                <AvatarFallback className="text-4xl font-bold text-orange-600 bg-orange-100">
                  {form.fullName ? form.fullName.charAt(0).toUpperCase() : "S"}
                </AvatarFallback>
              )}
            </Avatar>

            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {me.fullName || me.name}
              </h3>
              <Badge className="mt-3 px-5 py-2 text-base bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-all">
                {me.role || "Staff"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-2 sm:px-8 lg:px-14 pb-10">
          <Separator className="bg-orange-300" />

          {/* Inputs */}
          <div className="space-y-6">
            <div>
              <Label
                htmlFor="name"
                className="text-gray-700 text-sm font-semibold flex items-center"
              >
                <User className="w-4 h-4 mr-1.5 text-blue-600" />
                Họ và tên
              </Label>
              <Input
                id="name"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={form.fullName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, fullName: e.target.value }))
                }
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-gray-700 text-sm font-semibold flex items-center"
              >
                <Mail className="w-4 h-4 mr-1.5 text-blue-600" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={me.email || ""}
                disabled
              />
            </div>

            <div>
              <Label
                htmlFor="phone"
                className="text-gray-700 text-sm font-semibold flex items-center"
              >
                <PhoneCallIcon className="w-4 h-4 mr-1.5 text-blue-600" />
                Số điện thoại
              </Label>
              <Input
                id="phone"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={form.phone}
                onChange={(e) =>
                  setForm((s) => ({ ...s, phone: e.target.value }))
                }
              />
            </div>

            <div>
              <Label
                htmlFor="avatar"
                className="text-gray-700 text-sm font-semibold flex items-center"
              >
                Ảnh đại diện (URL)
              </Label>
              <Input
                id="avatar"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                placeholder="https://..."
                value={form.avatarUrl}
                onChange={(e) =>
                  setForm((s) => ({ ...s, avatarUrl: e.target.value }))
                }
              />
            </div>
          </div>

          <Button
            onClick={handleUpdateProfile}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md mt-8 py-3 text-lg rounded-xl transition-all"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Edit className="w-5 h-5 mr-2" />
            )}
            {saving ? "Đang cập nhật..." : "Lưu thay đổi"}
          </Button>

          <Separator className="bg-orange-300 my-8" />

          {/* Đổi mật khẩu */}
          <h3 className="text-xl font-bold text-orange-600 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Đổi mật khẩu
          </h3>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Mật khẩu hiện tại"
              className="border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
              value={pwd.oldPassword}
              onChange={(e) =>
                setPwd((s) => ({ ...s, oldPassword: e.target.value }))
              }
            />
            <Input
              type="password"
              placeholder="Mật khẩu mới"
              className="border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
              value={pwd.newPassword}
              onChange={(e) =>
                setPwd((s) => ({ ...s, newPassword: e.target.value }))
              }
            />
            <Input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              className="border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
              value={pwd.confirm}
              onChange={(e) =>
                setPwd((s) => ({ ...s, confirm: e.target.value }))
              }
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changingPwd}
            variant="outline"
            className="mt-5"
          >
            {changingPwd ? "Đang đổi..." : "Đổi mật khẩu"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
