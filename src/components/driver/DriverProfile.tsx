import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Edit, Mail, PhoneCallIcon, User, Loader2, AlertCircle, RefreshCcw, Camera, Upload, Lock, Eye, EyeOff, Calendar, Clock } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { toast } from "react-toastify";
import { showError, showSuccess } from "../ui/alert";

interface UserData {
  id: string;
  email: string;
  phoneNumber: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string;
  profilePictureUrl?: string;
}

export function DriverProfile() {
  const { t } = useLanguage();

  const [editMode, setEditMode] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "Admin":
        return "bg-blue-500 text-white border-blue-500";
      case "Driver":
        return "bg-orange-500 text-white border-orange-500";
      case "Staff":
        return "bg-green-500 text-white border-green-500";
      default:
        return "bg-gray-400 text-white border-gray-400";
    }
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:5194/api/v1/auth/me", {
        withCredentials: true,
      });
      setUserData(res.data);
      setName(res.data.name || "");
      setPhoneNumber(res.data.phoneNumber || "");
    } catch (error) {
      console.error(t("driver.history.errorLoadFailed"), error);
      setError(t("driver.profile.errorLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError(t("common.error"), t("driver.profile.errorInvalidFileType"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError(t("common.error"), t("driver.profile.errorFileTooLarge"));
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !userData) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('ProfilePicture', selectedFile);
      formData.append('Name', name);
      formData.append('PhoneNumber', phoneNumber);

      await axios.put(
        `http://localhost:5194/api/v1/Users/${userData.id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      showSuccess(t("driver.profile.successUploadAvatar"));
      setSelectedFile(null);
      setPreviewUrl(null);
      await fetchProfile();
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
      if (backendErrorMessage) {
        showError(t("driver.profile.errorUploadFailed"), backendErrorMessage);
      } else {
        showError(t("driver.profile.errorUploadFailed"), t("driver.profile.errorUnknown"));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData) return;

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('Name', name);
      formData.append('PhoneNumber', phoneNumber);

      await axios.put(
        `http://localhost:5194/api/v1/Users/${userData.id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      showSuccess(t("driver.profile.successUpdateInfo"));
      fetchProfile();
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
      if (backendErrorMessage) {
        showError(t("driver.profile.errorUpdateFailed"), backendErrorMessage);
      } else {
        showError(t("driver.profile.errorUpdateFailed"), t("driver.profile.errorUnknown"));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError(t("common.error"), t("driver.password.errorEmptyFields"));
      return;
    }

    if (newPassword.length < 6) {
      showError(t("common.error"), t("driver.password.errorTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      showError(t("common.error"), t("driver.password.errorMismatch"));
      return;
    }

    setIsChangingPassword(true);
    try {
      await axios.post(
        "http://localhost:5194/api/v1/Users/change-password",
        {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        {
          withCredentials: true,
        }
      );

      showSuccess(t("driver.password.successChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.error || error?.response?.data?.message;
      if (backendErrorMessage) {
        showError(t("driver.password.errorChangeFailed"), backendErrorMessage);
      } else {
        showError(t("driver.password.errorChangeFailed"), t("driver.profile.errorUnknown"));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-8 lg:px-16 py-10">
        <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            <p className="mt-4 text-lg text-gray-600">{t("driver.profile.loadingMessage")}</p>
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
            <p className="mt-4 text-lg text-red-700 font-semibold">{error || t("driver.profile.errorNotFound")}</p>
            <Button onClick={fetchProfile} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white">
              <RefreshCcw className="w-4 h-4 mr-2" /> {t("driver.profile.retryButton")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            {t("driver.profile.title")}
          </h2>
        </div>

        <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative group mb-2">
                <Avatar className="w-28 h-28 shadow-lg border-4 border-orange-500">
                  {previewUrl || userData.profilePictureUrl ? (
                    <AvatarImage
                      src={previewUrl || userData.profilePictureUrl}
                      alt={name}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="text-4xl font-bold text-orange-600 bg-orange-100">
                    {name ? name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                {editMode && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      type="button"
                    >
                      <Camera className="w-8 h-8 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              {editMode && selectedFile && (
                <div className="flex gap-2 mb-2">
                  <Button
                    onClick={handleUploadPhoto}
                    disabled={isUploading}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm"
                    size="sm"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1" />
                    )}
                    {isUploading ? t("driver.profile.uploading") : t("driver.profile.uploadAvatar")}
                  </Button>
                  <Button
                    onClick={handleCancelUpload}
                    disabled={isUploading}
                    variant="outline"
                    className="text-sm"
                    size="sm"
                  >
                    {t("driver.profile.cancelUpload")}
                  </Button>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mt-2">
                {userData.name}
              </h2>
              <div className={`mt-2 px-4 py-1.5 rounded-full text-sm font-semibold border-2 ${getRoleBadgeColor(userData.role)}`}>
                {userData.role === "Driver"
                  ? t("role.driver")
                  : userData.role === "Admin"
                    ? t("role.admin")
                    : t("role.staff")}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{t("driver.fullName")}</span>
                </div>
                {editMode ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-6 border-b border-gray-400 focus:outline-none w-full"
                  />
                ) : (
                  <p className="text-gray-900 font-medium pl-6">
                    {userData.name || t("driver.profile.notUpdated")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">{t("driver.email")}</span>
                </div>
                <p className="text-gray-900 font-medium break-all pl-6">
                  {userData.email}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PhoneCallIcon className="w-4 h-4" />
                  <span className="font-medium">{t("driver.phone")}</span>
                </div>
                {editMode ? (
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-6 border-b border-gray-400 focus:outline-none w-full"
                  />
                ) : (
                  <p className="text-gray-900 font-medium pl-6">
                    {userData.phoneNumber || t("driver.profile.notUpdated")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{t("driver.profile.createdAt")}</span>
                </div>
                <p className="text-gray-900 font-medium pl-6">
                  {new Date(userData.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

            </div>

            <div className="flex justify-end space-x-3 mt-8">
              {!editMode ? (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => setEditMode(true)}
                >
                  {t("driver.profile.editInfo")}
                </button>
              ) : (
                <>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    onClick={handleUpdateProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? t("driver.profile.saving") : t("driver.profile.saveChanges")}
                  </button>
                  <button
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                    onClick={() => {
                      setEditMode(false);
                      setPhoneNumber(userData.phoneNumber || "");
                      setName(userData.name || "");
                    }}
                  >
                    {t("driver.profile.cancel")}
                  </button>
                </>
              )}
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                onClick={() => setShowChangePassword((prev) => !prev)}
              >
                {showChangePassword ? t("driver.profile.cancelChangePassword") : t("driver.profile.changePassword")}
              </button>
            </div>

            {showChangePassword && (
              <div className="mt-8 w-full max-w-3xl mx-auto">
                <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold text-orange-600 flex items-center">
                      <Lock className="w-6 h-6 mr-2" />
                      {t("driver.password.title")}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {t("driver.password.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 px-2 sm:px-8 lg:px-14 pb-10">
                    <Separator className="bg-orange-300" />
                    <div className="space-y-6">
                      <div>
                        <Label
                          htmlFor="currentPassword"
                          className="text-gray-700 text-sm font-semibold flex items-center"
                        >
                          <Lock className="w-4 h-4 mr-1.5 text-orange-600" />
                          {t("driver.password.currentPassword")}
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            className="w-full text-base py-3 pr-10 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder={t("driver.password.placeholderCurrent")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="newPassword"
                          className="text-gray-700 text-sm font-semibold flex items-center"
                        >
                          <Lock className="w-4 h-4 mr-1.5 text-orange-600" />
                          {t("driver.password.newPassword")}
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            className="w-full text-base py-3 pr-10 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t("driver.password.placeholderNew")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="confirmPassword"
                          className="text-gray-700 text-sm font-semibold flex items-center"
                        >
                          <Lock className="w-4 h-4 mr-1.5 text-orange-600" />
                          {t("driver.password.confirmPassword")}
                        </Label>
                        <div className="relative mt-2">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            className="w-full text-base py-3 pr-10 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t("driver.password.placeholderConfirm")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handleChangePassword}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md mt-8 py-3 text-lg rounded-xl transition-all"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Lock className="w-5 h-5 mr-2" />
                      )}
                      {isChangingPassword ? t("driver.password.changing") : t("driver.password.changeButton")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}