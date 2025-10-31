import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getCurrentUser } from "@/services/authApi";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User, Mail, Phone, Calendar, Clock, Upload } from "lucide-react";

const CLOUD_NAME = "dt8hbvtd7"; // ✅ đúng tên Cloudinary account
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
}

export default function UserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();
        setUser(data);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin user:", error);
        toast.error("Không thể tải thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        const imageUrl = data.secure_url;
        toast.success("🎉 Tải ảnh lên thành công!");
        console.log("✅ Upload thành công:", imageUrl);

        // ✅ Cập nhật lại state user.avatar để render lại avatar
        setUser((prev) => (prev ? { ...prev, avatar: imageUrl } : prev));
      } else {
        console.error("❌ Upload thất bại:", data);
        toast.error("Không thể tải ảnh lên Cloudinary!");
      }
    } catch (error) {
      console.error("Lỗi khi upload:", error);
      toast.error("Đã xảy ra lỗi khi tải ảnh!");
    } finally {
      setUploading(false);
    }
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
          <p className="text-gray-600">Đang tải...</p>
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
            Không tìm thấy thông tin người dùng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}

      {/* Profile Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-600" />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Avatar Section */}
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

              {/* Upload Button */}
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

            <h2 className="text-xl font-bold text-gray-900 mt-4">
              {user.name}
            </h2>
            <div
              className={`mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border-2 ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role}
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="font-medium">Email</span>
              </div>
              <p className="text-gray-900 font-medium break-all pl-6">
                {user.email}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="font-medium">Số điện thoại</span>
              </div>
              <p className="text-gray-900 font-medium pl-6">
                {user.phoneNumber || "Chưa cập nhật"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="font-medium">Mã người dùng</span>
              </div>
              <p className="text-gray-900 font-mono text-sm break-all pl-6">
                {user.id}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Ngày tạo tài khoản</span>
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
                <span className="font-medium">Đăng nhập gần nhất</span>
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
    </div>
  );
}
