// src/components/staff/ProfileManagement.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  getMe,
  updateUser,
  resetPassword,
  uploadFile, // vẫn giữ: thử upload rời nếu BE có endpoint
  type UserMe,
} from "../../services/staff/staffApi";
import { useLanguage } from "../LanguageContext";
import { formatDateTime } from "../../utils/dateTimeUtils";
import { fetchStationById } from "@/services/admin/stationService";
import {
  User,
  Mail,
  Phone,
  Lock,
  Upload,
  Loader2,
  Building,
  BadgeCheck,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
  avatarUploading: "prof-avatar-uploading",
  avatarSuccess: "prof-avatar-success",
  avatarError: "prof-avatar-error",
};

export default function ProfileManagement() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [stationName, setStationName] = useState<string>("");

  const { t } = useLanguage();

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

  // ⭐ giữ file thật để gửi multipart khi bấm "Sửa hồ sơ"
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ---- helper: đồng bộ lại hồ sơ từ BE (ưu tiên profilePictureUrl) ----
  const refreshMe = async () => {
    const { data } = await getMe();
    setMe(data);
    const fullName = (data.fullName || (data as any).name) || "";
    setForm({
      fullName,
      phone: (data as any).phone || (data as any).phoneNumber || "",
      avatarUrl:
        (data as any).profilePictureUrl || // ƯU TIÊN field này từ BE
        (data as any).avatarUrl ||
        (data as any).avatar ||
        "",
    });
    
    // Fetch station name if not provided by getMe()
    const stationId = data?.stationId || (data as any)?.station?.id;
    if (stationId && !((data as any)?.station?.name || (data as any)?.stationName)) {
      try {
        const station = await fetchStationById(String(stationId));
        setStationName(station.name || "");
      } catch (err) {
        console.error("Failed to fetch station name:", err);
        setStationName("");
      }
    } else {
      // If station name is already in data, use it
      setStationName(
        (data as any)?.station?.name ||
        (data as any)?.stationName ||
        ""
      );
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch (e) {
          toast.error(t("staff.profile.toastLoadError"), {
            ...toastOpts,
            toastId: TOAST_ID.loadError,
          });
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [form.avatarUrl]);

  const onSaveProfile = async () => {
    const id = (me?.userId || (me as any)?.id) as string;
    if (!id) return;

    if (!form.fullName.trim()) {
      toast.warn(t("staff.profile.toastSaveWarnName"), {
        ...toastOpts,
        toastId: TOAST_ID.saveWarnName,
      });
      return;
    }

    setSaving(true);
    try {
      // ⭐ giữ nguyên logic + gửi kèm file nếu có để BE lưu avatar thật
      await updateUser(id, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.avatarUrl.trim(), // nếu uploadFile() trả URL thì vẫn dùng
        avatarFile: avatarFile || null,   // file thật đi qua multipart
      });

      // Đồng bộ lại từ BE để chắc lấy đúng profilePictureUrl
      await refreshMe();

      toast.success(t("staff.profile.toastSaveSuccess"), { ...toastOpts, toastId: TOAST_ID.saveSuccess });
      setAvatarFile(null); // clear file tạm
    } catch (e) {
      toast.error(t("staff.profile.toastSaveError"), {
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
      toast.warn(t("staff.profile.toastPwdWarnNew"), {
        ...toastOpts,
        toastId: TOAST_ID.pwdWarnNew,
      });
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      toast.error(t("staff.profile.toastPwdMismatch"), {
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
      toast.success(t("staff.profile.toastPwdSuccess"), {
        ...toastOpts,
        toastId: TOAST_ID.pwdSuccess,
      });
      setPwd({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      toast.error(t("staff.profile.toastPwdError"), {
        ...toastOpts,
        toastId: TOAST_ID.pwdError,
      });
      console.error(e);
    } finally {
      setChangingPwd(false);
    }
  };

  const triggerPickFile = () => fileRef.current?.click();

  // ⭐ chọn ảnh: preview ngay + thử upload rời (nếu server có /files/upload)
  const onPickFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    // ——— KHỚP CHÍNH XÁC VALIDATION CỦA BE: JPEG/PNG, tối đa 10MB ———
    const isAllowedType = /^image\/(jpe?g|png)$/i.test(file.type);
    if (!isAllowedType) {
      toast.error(t("staff.profile.toastAvatarInvalidType"), toastOpts);
      ev.target.value = "";
      return;
    }
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      toast.error(t("staff.profile.toastAvatarTooLarge"), toastOpts);
      ev.target.value = "";
      return;
    }

    // preview cục bộ
    const localPreview = URL.createObjectURL(file);
    setAvatarFile(file);
    setForm((s) => ({ ...s, avatarUrl: s.avatarUrl || localPreview }));

    // cố gắng upload rời để có URL ngay (server bạn không có thì 404 → bỏ qua)
    setUploadingAvatar(true);

    try {
      const url = await uploadFile(file).catch(() => null as string | null);
      if (url) {
        setForm((s) => ({ ...s, avatarUrl: url || localPreview }));
        toast.success(t("staff.profile.toastAvatarSuccess"), { ...toastOpts, toastId: TOAST_ID.avatarSuccess });
      }
    } finally {
      setUploadingAvatar(false);
      if (ev.target) ev.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const avatarLetter = (form.fullName || (me as any)?.name || "S")
    .toString()
    .charAt(0)
    .toUpperCase();
  const roleLabel = (me as any)?.role || "Staff";

  // ⭐ ƯU TIÊN TÊN TRẠM, chỉ rớt về ID nếu thật sự không có tên
  const stationLabel =
    stationName ||
    (me as any)?.station?.name ||
    (me as any)?.station?.stationName ||
    (me as any)?.stationName ||
    (me as any)?.stationWorkingAt?.name ||
    (me as any)?.workingStation?.name ||
    (me as any)?.workingStationName ||
    (me?.station && (me.station.name || me.station.id)) ||
    me?.stationId ||
    t("staff.profile.notUpdated");

  const avatarSrc =
    (!avatarError && form.avatarUrl) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      form.fullName || (me as any)?.name || "Staff"
    )}&background=FF7A00&color=fff`;

  const lastLoginLabel =
    (me as any)?.lastLogin ||
    (me as any)?.lastLoginAt ||
    (me as any)?.lastLoginTime ||
    "";
  const createdAtLabel =
    (me as any)?.createdAt ||
    (me as any)?.createdDate ||
    (me as any)?.createdOn ||
    "";

  return (
    <div className="p-6">
      <Card className="shadow-xl border-none">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <User className="w-5 h-5" />
            {t("staff.profile.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Avatar className="w-28 h-28 ring-4 ring-orange-100">
                <AvatarImage
                  src={avatarSrc}
                  onError={() => setAvatarError(true)}
                />
                <AvatarFallback className="bg-orange-500 text-white text-3xl">
                  {avatarLetter}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={triggerPickFile}
                className="absolute -bottom-1 -right-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg transition"
                title={t("staff.profile.tooltipUploadAvatar")}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={onPickFile}
              />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mt-4">
              {form.fullName || (me as any)?.name || t("staff.profile.notUpdated")}
            </h2>
            <div className="mt-2 px-4 py-1 rounded-full text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              {roleLabel}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <User className="w-4 h-4" />
                {t("staff.profile.labelFullName")}
              </label>
              <input
                value={form.fullName}
                onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-orange-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Mail className="w-4 h-4" />
                {t("staff.profile.labelEmail")}
              </label>
              <p className="text-gray-900 font-medium">{me?.email || t("staff.profile.notUpdated")}</p>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Phone className="w-4 h-4" />
                {t("staff.profile.labelPhone")}
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-orange-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <BadgeCheck className="w-4 h-4" />
                {t("staff.profile.userId")}
              </label>
              <p className="text-gray-900 font-mono text-sm">
                {me?.userId || me?.id || t("staff.profile.notUpdated")}
              </p>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Building className="w-4 h-4" />
                {t("staff.station")}
              </label>
              <p className="text-gray-900 font-medium">{stationLabel}</p>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Clock className="w-4 h-4" />
                {t("staff.profile.lastLogin")}
              </label>
              <p className="text-gray-900 font-medium">
                {lastLoginLabel
                  ? formatDateTime(lastLoginLabel)
                  : t("staff.profile.notUpdated")}
              </p>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Calendar className="w-4 h-4" />
                {t("staff.profile.createdAt")}
              </label>
              <p className="text-gray-900 font-medium">
                {createdAtLabel
                  ? formatDateTime(createdAtLabel)
                  : t("staff.profile.notUpdated")}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {showPwdSection && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4">
                <p className="font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t("staff.profile.sectionChangePassword")}
                </p>
                <input
                  type="password"
                  placeholder={t("staff.profile.placeholderCurrentPassword")}
                  value={pwd.oldPassword}
                  onChange={(e) => setPwd((s) => ({ ...s, oldPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder={t("staff.profile.placeholderNewPassword")}
                  value={pwd.newPassword}
                  onChange={(e) => setPwd((s) => ({ ...s, newPassword: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder={t("staff.profile.placeholderConfirmNewPassword")}
                  value={pwd.confirm}
                  onChange={(e) => setPwd((s) => ({ ...s, confirm: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={onChangePassword}
                    disabled={changingPwd}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-semibold"
                  >
                    {changingPwd ? t("staff.profile.buttonChangingPassword") : t("staff.profile.buttonChangePassword")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-3 mt-8">
            <Button
              onClick={onSaveProfile}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold min-w-[160px]"
            >
              {saving ? t("staff.profile.buttonSaving") : t("staff.profile.buttonSave")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-transparent bg-yellow-400/90 hover:bg-yellow-400 text-gray-900 font-semibold px-6 py-2 text-sm min-w-[160px]"
              onClick={() => setShowPwdSection((prev) => !prev)}
            >
              {showPwdSection ? t("staff.profile.cancelChangePassword") : t("staff.profile.buttonChangePassword")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
