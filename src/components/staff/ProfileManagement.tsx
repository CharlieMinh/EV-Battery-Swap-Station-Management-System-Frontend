import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Building2,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getMyProfile,
  updateProfile,
  getStationInfo,
  UserProfile,
  StationInfo,
} from "../../services/staff/profileApi";

interface ProfileManagementProps {
  userId: string;
  stationId?: string;
}

export function ProfileManagement({
  userId,
  stationId,
}: ProfileManagementProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stationInfo, setStationInfo] = useState<StationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    fetchData();
  }, [userId, stationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileData = await getMyProfile();
      setProfile(profileData);
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
        phoneNumber: profileData.phoneNumber || "",
      });

      if (stationId) {
        const stationData = await getStationInfo(stationId);
        setStationInfo(stationData);
      }
    } catch (error: any) {
      toast.error(
        "Không thể tải thông tin: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile(userId, formData);
      toast.success("Cập nhật thông tin thành công!");
      setEditing(false);
      fetchData();
    } catch (error: any) {
      toast.error(
        "Cập nhật thất bại: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phoneNumber: profile?.phoneNumber || "",
    });
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Thông tin cá nhân
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý thông tin tài khoản và trạm làm việc
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-linear-to-r from-orange-50 to-orange-100 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                Thông tin cá nhân
              </CardTitle>
              {!editing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Chỉnh sửa
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Lưu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4 ring-4 ring-orange-100">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback className="bg-orange-500 text-white text-2xl">
                  {profile?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-gray-900">
                {profile?.name}
              </h2>
              <p className="text-sm text-gray-500">{profile?.role}</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Họ và tên
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={!editing}
                  className={!editing ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!editing}
                  className={!editing ? "bg-gray-50" : ""}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  disabled={!editing}
                  className={!editing ? "bg-gray-50" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Station Info Card */}
        {stationInfo && (
          <Card className="shadow-lg">
            <CardHeader className="bg-linear-to-r from-blue-50 to-blue-100 border-b">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Thông tin trạm
              </CardTitle>
              <CardDescription>Trạm đang làm việc</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <Label className="text-gray-600">Tên trạm</Label>
                  </div>
                  <p className="font-semibold text-lg">{stationInfo.name}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <Label className="text-gray-600">Địa chỉ</Label>
                  </div>
                  <p className="text-gray-700">{stationInfo.address}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <Label className="text-gray-600">Giờ hoạt động</Label>
                  </div>
                  <p className="text-gray-700">
                    {stationInfo.operatingHours.open} -{" "}
                    {stationInfo.operatingHours.close}
                  </p>
                </div>

                {stationInfo.phoneNumber && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <Label className="text-gray-600">Số điện thoại</Label>
                    </div>
                    <p className="text-gray-700">{stationInfo.phoneNumber}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Tổng số slot</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stationInfo.totalSlots}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Slot khả dụng</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stationInfo.availableSlots}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div
                    className={`px-4 py-2 rounded-lg text-center font-medium ${
                      stationInfo.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {stationInfo.status === "Active"
                      ? "🟢 Đang hoạt động"
                      : "🔴 Ngừng hoạt động"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
