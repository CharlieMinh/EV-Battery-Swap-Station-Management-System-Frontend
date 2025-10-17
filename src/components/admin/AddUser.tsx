import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";
import api from "@/configs/axios";
import { el } from "date-fns/locale";

interface AccountPayload {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  role: number;
  status: number;
}

interface FormUserData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  role: string; // '0', '1', '2'
  status: number;
}

const ROLE_OPTIONS = [
  { value: "0", label: "Driver" },
  { value: "1", label: "Staff" },
  { value: "2", label: "Admin" },
];

const initialUserData: FormUserData = {
  email: "",
  password: "",
  name: "",
  phoneNumber: "",
  role: "0",
  status: 0,
};

export function AddUser() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<FormUserData>(initialUserData);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Xử lý thay đổi dữ liệu nhập
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // ✅ Kiểm tra dữ liệu frontend
  const validateForm = (): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    const phoneRegex = /^(0|\+84)\d{9,10}$/;

    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      return "Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: ten@gmail.com)";
    }

    if (!passwordRegex.test(formData.password)) {
      return "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
    }

    if (!formData.name.trim()) {
      return "Họ và tên không được để trống.";
    }

    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      return "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 hoặc +84 và có 10–11 số).";
    }

    return null;
  };

  // ✅ Xử lý submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Kiểm tra frontend trước khi gửi
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError, { position: "top-right", autoClose: 4000 });
      return;
    }

    setIsLoading(true);

    const payload: AccountPayload = {
      ...formData,
      role: Number(formData.role),
      status: 0,
    };

    console.log("Payload gửi lên:", payload);

    try {
      const response = await api.post("/api/v1/Users", payload, {
        withCredentials: true,
      });

      const accountId = response.data?.id || "N/A";
      toast.success(`Thêm người dùng thành công!`, {
        position: "top-right",
        autoClose: 3000,
      });

      setFormData(initialUserData);
    } catch (error) {
      let errorMessage = "Đã xảy ra lỗi không xác định.";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        if (status === 400 || status === 422) {
          // Nếu backend trả về ModelState (C#)
          const backendMessage =
            error.response?.data?.message ||
            error.response?.data?.errors ||
            "Dữ liệu không hợp lệ.";

          if (typeof backendMessage === "object") {
            // Nếu backend trả về object lỗi (ModelState)
            errorMessage = Object.values(backendMessage).join(", ");
          } else {
            errorMessage = backendMessage;
          }
        } else if (status === 500) {
          errorMessage = "Lỗi máy chủ (500). Vui lòng thử lại sau.";
        } else if (status === 409) {
          errorMessage = error.response?.data?.message || errorMessage;
        } else {
          errorMessage = `Lỗi kết nối (${status}). Vui lòng thử lại.`;
        }
      }

      toast.error(`Lỗi: ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="max-w-xl mx-auto bg-white p-8 shadow-2xl rounded-xl">
        <h2 className="text-3xl font-extrabold mb-8 text-gray-900 text-center">
          {"Thêm người dùng"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="Nhập email..."
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="Nhập mật khẩu..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>
          </div>

          {/* NAME */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="Nhập họ và tên..."
            />
          </div>

          {/* PHONE */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Số điện thoại
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="Nhập số điện thoại..."
            />
          </div>

          {/* ROLE */}
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer transition duration-150"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Trạng thái
            </label>
            <input
              type="text"
              id="status"
              value={formData.status === 0 ? "Hoạt động" : "Ngưng hoạt động"}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 cursor-not-allowed"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-orange-500 hover:bg-orange-600 py-3 px-4 rounded-lg text-white font-semibold shadow-md transition duration-200 ${
              isLoading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
            }`}
          >
            {isLoading ? "Đang xử lý..." : "Thêm người dùng"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddUser;
