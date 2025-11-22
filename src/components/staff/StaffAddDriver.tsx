// src/pages/staff/StaffAddDriver.tsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";
import {
  createDriverByStaff,
  type CreateDriverPayload,
} from "@/services/staff/staffDriverService";
import { Loader2, Eye, EyeOff } from "lucide-react";
import axios from "axios";

interface FormDriverData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

const initialForm: FormDriverData = {
  email: "",
  password: "",
  name: "",
  phoneNumber: "",
};

export default function StaffAddDriver() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<FormDriverData>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // =========================
  //  Handle change
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.target;
    // Nếu là phoneNumber, chỉ cho phép nhập số và giới hạn 11 ký tự
    if (id === "phoneNumber") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
      setFormData((prev) => ({
        ...prev,
        [id]: digitsOnly,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  // =========================
  //  Validate form
  // =========================
  const validateForm = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      return t("admin.emailInvalid");
    }

    if (!passwordRegex.test(formData.password)) {
      return t("admin.passwordRequirement");
    }

    if (!formData.name.trim()) {
      return t("admin.nameRequired");
    }

    // Kiểm tra số điện thoại: phải có 10 hoặc 11 số
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneDigits = formData.phoneNumber.replace(/\D/g, ""); // Chỉ lấy số
      if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
        return t("staff.addDriver.phoneInvalid");
      }
    }

    return null;
  };

  // =========================
  //  Submit
  // =========================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    // Payload đúng với CreateUserRequest,
    // nhưng Staff chỉ được tạo Driver => role = 0, status = 0
    const payload: CreateDriverPayload = {
      email: formData.email.trim(),
      password: formData.password,
      name: formData.name.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      role: 0,    // Driver
      status: 0,  // Active
    };

    try {
      await createDriverByStaff(payload);
      toast.success(t("admin.addUserSuccess"));
      setFormData(initialForm);
    } catch (error) {
      let errorMessage = t("admin.errorOccurred");
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 409)
          errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto bg-white p-8 shadow-2xl rounded-xl relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-gray-600 text-sm">{t("admin.processing")}</p>
            </div>
          </div>
        )}
        <h2 className="text-3xl font-extrabold mb-8 text-gray-900 text-center">
          {t("admin.addUserTitle")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* EMAIL */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              {t("admin.email")} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={t("admin.enterEmail")}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              {t("admin.password")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 pr-10 border rounded-lg"
                placeholder={t("admin.enterPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* NAME */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {t("admin.fullName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={t("admin.enterName")}
            />
          </div>

          {/* PHONE */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium mb-1"
            >
              {t("admin.phone")}
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength={11}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={t("admin.enterPhone")}
            />
          </div>

          {/* ROLE */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              {t("admin.roleLabel")}
            </label>
            <input
              type="text"
              id="role"
              value="Driver"
              readOnly
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* STATUS */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              {t("admin.statusLabel")}
            </label>
            <input
              type="text"
              id="status"
              value={t("admin.activeStatus")}
              readOnly
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isLoading ? t("admin.processing") : t("admin.addUserTitle")}
          </button>
        </form>
      </div>
    </div>
  );
}
