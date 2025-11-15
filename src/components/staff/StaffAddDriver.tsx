// src/pages/staff/StaffAddDriver.tsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";
import {
  createDriverByStaff,
  type CreateDriverPayload,
} from "@/services/staff/staffDriverService";

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

  // =========================
  //  Handle change
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // =========================
  //  Validate form
  // =========================
  const validateForm = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    const phoneRegex = /^(0|\+84)\d{9,10}$/;

    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      return "Email không hợp lệ.";
    }

    if (!passwordRegex.test(formData.password)) {
      return "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
    }

    if (!formData.name.trim()) {
      return "Họ và tên không được để trống.";
    }

    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      return "Số điện thoại không hợp lệ.";
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
      toast.success("Thêm khách hàng thành công!");
      setFormData(initialForm);
    } catch (error: any) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Đã xảy ra lỗi khi tạo khách hàng.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto bg-white p-8 shadow-2xl rounded-xl">
        <h2 className="text-3xl font-extrabold mb-8 text-gray-900 text-center">
          Thêm khách hàng
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* EMAIL */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Nhập email..."
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Nhập mật khẩu..."
            />
          </div>

          {/* NAME */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Nhập họ và tên..."
            />
          </div>

          {/* PHONE */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium mb-1"
            >
              Số điện thoại
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Nhập số điện thoại..."
            />
          </div>

          {/* ROLE – hiển thị readonly cho rõ là Khách hàng */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Vai trò
            </label>
            <input
              type="text"
              value="Khách hàng"
              readOnly
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* STATUS – luôn Active */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Trạng thái
            </label>
            <input
              type="text"
              value="Hoạt động"
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
            {isLoading ? "Đang xử lý..." : "Thêm khách hàng"}
          </button>
        </form>
      </div>
    </div>
  );
}
