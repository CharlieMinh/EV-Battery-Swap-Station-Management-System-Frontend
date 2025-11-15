import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getCurrentUser } from "@/services/authApi";
import {
  updateUser,
  UpdateUserPayload,
} from "@/services/admin/customerAdminService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User, Mail, Phone, Calendar, Clock, Upload } from "lucide-react";
import ChangePassword from "./ChangePassword";
import { useLanguage } from "../LanguageContext";

const CLOUD_NAME = "dt8hbvtd7";
const UPLOAD_PRESET = "FPTFast";

interface UserProfileData {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  stationId?: string;
  createdAt: string;
  lastLogin: string;
  avatar?: string;
  status: string;
}

export default function UserProfile() {
  const { t } = useLanguage();
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfileData>>({});
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser({
          ...data,
          avatar: data.profilePictureUrl ?? undefined, // <- map profilePictureUrl sang avatar
        });
        setFormData({
          name: data.name,
          phoneNumber: data.phoneNumber,
          avatar: data.profilePictureUrl ?? undefined,
          status: data.status,
          stationId: data.stationId,
        });
        setFormData({
          name: data.name,
          phoneNumber: data.phoneNumber,
          avatar: data.avatar,
          status: data.status,
          stationId: data.stationId,
        });
      } catch (error) {
        console.error(t("admin.errorLoadingUser"), error);
        toast.error(t("admin.cannotLoadUser"));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [t]);

  // Mapping role string sang số theo backend
  // handleUpload
  // handleUpload
  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: form }
      );
      const data = await response.json();

      if (data.secure_url) {
        const avatarUrl = data.secure_url;

        // Gửi payload đúng tên backend
        await updateUser(user.id, {
          profilePicture: avatarUrl, // đổi từ profilePicture
          role: user.role, // giữ nguyên
          status: user.status, // giữ nguyên
        });

        setUser((prev) =>
          prev
            ? { ...prev, avatar: avatarUrl, profilePictureUrl: avatarUrl }
            : prev
        );

        setFormData((prev) => ({ ...prev, avatar: avatarUrl }));

        toast.success(t("admin.uploadSuccess"));
      } else {
        toast.error(t("admin.uploadFailed"));
      }
    } catch (error) {
      console.error("Lỗi upload:", error);
      toast.error(t("admin.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  // handleSave
  const handleSave = async () => {
    if (!user) return;

    try {
      const payload: UpdateUserPayload = {
        name: formData.name ?? user.name,
        phoneNumber: formData.phoneNumber ?? user.phoneNumber,
        profilePicture: formData.avatar ?? user.avatar, // đổi key
        role: user.role,
        status: user.status,
        stationId: formData.stationId ?? user.stationId,
      };

      await updateUser(user.id, payload);
      setUser((prev) => (prev ? { ...prev, ...payload } : prev));
      toast.success(t("admin.updateSuccess"));
      setEditMode(false);
    } catch (error) {
      console.error(error);
      toast.error(t("admin.updateFailed"));
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({
      name: user.name,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      status: user.status,
      stationId: user.stationId,
    });
    setEditMode(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "manager":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "staff":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("admin.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-700 font-medium">
            {t("admin.userNotFound")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" /> {t("admin.personalInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-orange-100">
                <AvatarImage
                  src={
                    user.avatar
                      ? `${user.avatar}?v=${Date.now()}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name || "User"
                        )}&background=FF7A00&color=fff`
                  }
                />
                <AvatarFallback className="bg-orange-500 text-white text-2xl">
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Nút Upload luôn hiện */}
              <label className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-all shadow-lg">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                />
                <Upload className="w-4 h-4" />
              </label>
            </div>

            {editMode ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="text-xl font-bold text-gray-900 mt-4 border-b border-orange-400 focus:outline-none"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900 mt-4">
                {user.name}
              </h2>
            )}

            <div
              className={`mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border-2 ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role}
            </div>
          </div>

          {/* Thông tin người dùng giữ nguyên như trước */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="font-medium">{t("admin.emailLabel")}</span>
              </div>
              <p className="text-gray-900 font-medium break-all pl-6">
                {user.email}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="font-medium">{t("admin.phoneLabel")}</span>
              </div>
              {editMode ? (
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="pl-6 border-b border-gray-400 focus:outline-none w-full"
                />
              ) : (
                <p className="text-gray-900 font-medium pl-6">
                  {user.phoneNumber || t("admin.notUpdated")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">{t("admin.userId")}</span>
              </div>
              <p className="text-gray-900 font-mono text-sm break-all pl-6">
                {user.id}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{t("admin.createdDate")}</span>
              </div>
              <p className="text-gray-900 font-medium pl-6">
                {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{t("admin.lastLoginDate")}</span>
              </div>
              <p className="text-gray-900 font-medium pl-6">
                {new Date(user.lastLogin).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3 mt-4">
        {/* Nút Chỉnh sửa / Lưu / Hủy */}
        {!editMode ? (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={() => setEditMode(true)}
          >
            {t("admin.editInfo")}
          </button>
        ) : (
          <>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              onClick={handleSave}
            >
              {t("admin.saveChanges")}
            </button>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
              onClick={handleCancel}
            >
              {t("admin.cancel")}
            </button>
          </>
        )}

        {/* Nút Đổi mật khẩu */}
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
          onClick={() => setShowChangePassword((prev) => !prev)}
        >
          {showChangePassword ? t("admin.cancelChangePassword") : t("admin.changePassword")}
        </button>
      </div>

      {/* Hiển thị component ChangePassword nếu showChangePassword = true */}
      {showChangePassword && (
        <div className="mt-4 w-full max-w-3xl mx-auto">
          <ChangePassword />
        </div>
      )}
    </div>
  );
}
