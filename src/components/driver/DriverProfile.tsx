import React, { useState, useEffect } from "react";
import axios from "axios"; // 👈 Thêm
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Edit, Mail, PhoneCallIcon, User, Loader2, AlertCircle, RefreshCcw } from "lucide-react"; // 👈 Thêm Loader2, AlertCircle
import { useLanguage } from "../LanguageContext";
import { toast } from "react-toastify"; // 👈 Thêm
import { showError, showSuccess } from "../ui/alert"; // 👈 Sửa đường dẫn (giả sử nó ở /ui)

// ✅ Interface này giờ sẽ ở nội bộ
interface UserData {
  id: string;
  email: string;
  phoneNumber: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string;
}

// ❌ Xóa DriverProfileProps

export function DriverProfile() { // 👈 Xóa props
  const { t } = useLanguage();

  // ✅ Thêm state để quản lý data, loading, error
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // ✅ State cho input (giữ nguyên)
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  // ✅ Hàm fetchProfile (chuyển từ Dashboard vào đây)
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:5194/api/v1/auth/me", {
        withCredentials: true,
      });
      setUserData(res.data);
      // Cập nhật state của input sau khi fetch
      setName(res.data.name || "");
      setPhoneNumber(res.data.phoneNumber || "");
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      setError("Không thể tải thông tin cá nhân. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Gọi fetchProfile khi component mount
  useEffect(() => {
    fetchProfile();
  }, []); // [] = chạy 1 lần duy nhất

  // ✅ Hàm handleUpdateProfile (chuyển từ Dashboard vào đây)
  const handleUpdateProfile = async () => {
    if (!userData) return; // Không có data thì không làm gì

    setIsUpdating(true); // Bật loading nút
    try {
      await axios.put(`http://localhost:5194/api/v1/Users/${userData.id}`, {
        "name": name, // Gửi state 'name'
        "phoneNumber": phoneNumber // Gửi state 'phoneNumber'
      }, { withCredentials: true });

      showSuccess("Cập nhật thông tin thành công!");
      fetchProfile(); // Tải lại data mới sau khi cập nhật
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
      if (backendErrorMessage) {
        showError("Không thể cập nhật thông tin!", backendErrorMessage);
      } else {
        showError("Không thể cập nhật thông tin!", "Lỗi không xác định");
      }
    } finally {
      setIsUpdating(false); // Tắt loading nút
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-16 py-10">
        <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <p className="mt-4 text-lg text-gray-600">Đang tải thông tin cá nhân...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-16 py-10">
        <Card className="border-2 border-red-200 shadow-xl bg-red-50 rounded-3xl p-6 sm:p-10">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="mt-4 text-lg text-red-700 font-semibold">{error || "Không tìm thấy dữ liệu người dùng."}</p>
            <Button onClick={fetchProfile} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white">
              <RefreshCcw className="w-4 h-4 mr-2" /> Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Nếu không loading, không error, và có userData
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in px-8 lg:px-16 py-10">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-4xl font-bold text-orange-600 tracking-tight">
          {t("driver.profile.title")}
        </h1>
      </div>

      {/* Profile Card */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-28 h-28 shadow-lg border-4 border-orange-500">
              <AvatarFallback className="text-4xl font-bold text-orange-600 bg-orange-100">
                {/* Sửa lại: Dùng 'name' từ state vì 'userData.name' có thể cũ */}
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {userData.name} {/* Hiển thị tên từ data gốc */}
              </h3>
              <Badge className="mt-3 px-5 py-2 text-base bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-all">
                {userData.role === "Driver"
                  ? t("role.driver")
                  : userData.role === "Admin"
                    ? t("role.admin")
                    : t("role.staff")}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-2 sm:px-8 lg:px-14 pb-10">
          <Separator className="bg-orange-300" />

          {/* Inputs mỗi dòng */}
          <div className="space-y-6">
            <div>
              <Label
                htmlFor="name"
                className="text-gray-700 text-sm font-semibold flex items-center" // Thêm flex
              >
                <User className="w-4 h-4 mr-1.5 text-blue-600" /> {/* Sửa style */}
                {t("driver.fullName")}
              </Label>
              <Input
                id="name"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={name} // Dùng state 'name'
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-gray-700 text-sm font-semibold flex items-center" // Thêm flex
              >
                <Mail className="w-4 h-4 mr-1.5 text-blue-600" /> {/* Sửa style */}
                {t("driver.email")}
              </Label>
              <Input
                id="email"
                type="email"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={userData.email || ""} // Dùng userData
                disabled={true}
              />
            </div>

            <div>
              <Label
                htmlFor="phone"
                className="text-gray-700 text-sm font-semibold flex items-center" // Thêm flex
              >
                <PhoneCallIcon className="w-4 h-4 mr-1.5 text-blue-600" /> {/* Sửa style */}
                {t("driver.phone")}
              </Label>
              <Input
                id="phone"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={phoneNumber} // Dùng state 'phoneNumber'
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleUpdateProfile} // 👈 Gọi hàm nội bộ
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md mt-8 py-3 text-lg rounded-xl transition-all"
            disabled={isUpdating} // 👈 Thêm disabled
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> // 👈 Thêm loading
            ) : (
              <Edit className="w-5 h-5 mr-2" />
            )}
            {isUpdating ? "Đang cập nhật..." : t("driver.profile.editProfile")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}