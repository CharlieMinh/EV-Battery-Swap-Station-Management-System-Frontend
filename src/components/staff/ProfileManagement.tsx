import React, { useEffect, useState } from "react";
import {
  getMe,
  updateUser,
  resetPassword,
  type UserMe,
} from "../../services/staff/staffApi";
import { User, Mail, Phone, Lock, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "react-toastify";

const toastOpts = { position: "top-right" as const, autoClose: 2200, closeOnClick: true };
const TOAST_ID = {
  loadError: "prof-load-error",
  saveWarnName: "prof-save-warn-name",
  saveSuccess: "prof-save-success",
  saveError: "prof-save-error",
  pwdWarnNew: "prof-pwd-warn-new",
  pwdMismatch: "prof-pwd-mismatch",
  pwdSuccess: "prof-pwd-success",
  pwdError: "prof-pwd-error",
};

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
        const fullName = (data.fullName || (data as any).name) || "";
        setForm({
          fullName,
          phone: (data as any).phone || (data as any).phoneNumber || "",
          avatarUrl: (data as any).avatarUrl || (data as any).avatar || "",
        });
      } catch (e) {
        toast.error("Không thể tải hồ sơ. Vui lòng thử lại!", {
          ...toastOpts,
          toastId: TOAST_ID.loadError,
        });
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSaveProfile = async () => {
    const id = (me?.userId || (me as any)?.id) as string;
    if (!id) return;

    if (!form.fullName.trim()) {
      toast.warn("Vui lòng nhập họ tên.", {
        ...toastOpts,
        toastId: TOAST_ID.saveWarnName,
      });
      return;
    }

    setSaving(true);
    try {
      await updateUser(id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl.trim(),
      });
      toast.success("Đã lưu hồ sơ ✅", {
        ...toastOpts,
        toastId: TOAST_ID.saveSuccess,
      });
    } catch (e) {
      toast.error("Lưu hồ sơ thất bại. Vui lòng thử lại!", {
        ...toastOpts,
        toastId: TOAST_ID.saveError,
      });
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    if (!pwd.newPassword) {
      toast.warn("Vui lòng nhập mật khẩu mới.", {
        ...toastOpts,
        toastId: TOAST_ID.pwdWarnNew,
      });
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      toast.error("Xác nhận mật khẩu không khớp.", {
        ...toastOpts,
        toastId: TOAST_ID.pwdMismatch,
      });
      return;
    }
    setChangingPwd(true);
    try {
      await resetPassword({
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword,
      });
      toast.success("Đổi mật khẩu thành công ✅", {
        ...toastOpts,
        toastId: TOAST_ID.pwdSuccess,
      });
      setPwd({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      toast.error("Đổi mật khẩu thất bại. Vui lòng kiểm tra lại!", {
        ...toastOpts,
        toastId: TOAST_ID.pwdError,
      });
      console.error(e);
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-3xl bg-[#FFF3E5] rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-[#FF7A00] mb-8">
          Hồ sơ cá nhân
        </h1>

        {/* Avatar + Tên */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-[#FF7A00] flex items-center justify-center text-3xl font-bold text-[#FF7A00] bg-white">
            {(form.fullName || (me as any)?.name || "S").toString().charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mt-4">
            {form.fullName || (me as any)?.name || "—"}
          </h2>
          <div className="bg-[#FF7A00] text-white px-4 py-1 rounded-md mt-2 text-sm font-semibold">
            {(me as any)?.role || "Staff"}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              <User className="inline w-4 h-4 mr-1 text-[#FF7A00]" />
              Tên Đầy Đủ
            </label>
            <input
              value={form.fullName}
              onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
              className="w-full border-2 border-[#FF7A00] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FF7A00]/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              <Mail className="inline w-4 h-4 mr-1 text-[#FF7A00]" />
              Email
            </label>
            <input
              value={me?.email || ""}
              disabled
              className="w-full border-2 border-[#FF7A00]/40 bg-gray-50 rounded-lg px-3 py-2 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              <Phone className="inline w-4 h-4 mr-1 text-[#FF7A00]" />
              Số Điện Thoại
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              className="w-full border-2 border-[#FF7A00] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FF7A00]/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Save */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={onSaveProfile}
            disabled={saving}
            className="bg-[#FF7A00] hover:bg-[#e56a00] text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            {saving ? "Đang lưu..." : "Sửa hồ sơ"}
          </Button>
        </div>

        {/* Change password */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-[#FF7A00] mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" /> Đổi mật khẩu
          </h2>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Mật khẩu hiện tại"
              value={pwd.oldPassword}
              onChange={(e) => setPwd((s) => ({ ...s, oldPassword: e.target.value }))}
              className="w-full border-2 border-[#FF7A00] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FF7A00]/40 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={pwd.newPassword}
              onChange={(e) => setPwd((s) => ({ ...s, newPassword: e.target.value }))}
              className="w-full border-2 border-[#FF7A00] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FF7A00]/40 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={pwd.confirm}
              onChange={(e) => setPwd((s) => ({ ...s, confirm: e.target.value }))}
              className="w-full border-2 border-[#FF7A00] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#FF7A00]/40 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              onClick={onChangePassword}
              disabled={changingPwd}
              className="bg-[#FF7A00] hover:bg-[#e56a00] text-white px-6 py-2 rounded-lg text-sm font-semibold"
            >
              {changingPwd ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
