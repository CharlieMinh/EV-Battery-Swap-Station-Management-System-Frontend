import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLanguage } from "../LanguageContext";
import api from "@/configs/axios";

interface AccountPayload {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  role: number;
  status: number;
  stationId?: string; // ✅ thêm field này
}

interface FormUserData {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  role: string; // '0', '1', '2'
  status: number;
  stationId?: string; // ✅ thêm field này
}

interface Station {
  id: string;
  name: string;
  address: string;
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
  stationId: "",
};

export function AddUser() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<FormUserData>(initialUserData);
  const [isLoading, setIsLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]); // ✅ lưu danh sách trạm

  // ✅ Lấy danh sách trạm khi role = "1" (Staff)
  useEffect(() => {
    if (formData.role === "1") {
      fetchStations();
    }
  }, [formData.role]);

  const fetchStations = async () => {
    try {
      const response = await api.get("/api/v1/Stations?page=1&pageSize=100");
      const mappedItems = response.data.items.map((s: any) => ({
        id: s.id,
        name: s.name,
        address: s.address,
      }));
      setStations(mappedItems);
    } catch (error) {
      console.error("Error fetching stations:", error);
      toast.error(t("admin.cannotLoadStations"));
    }
  };

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
      return t("admin.emailInvalid");
    }

    if (!passwordRegex.test(formData.password)) {
      return t("admin.passwordRequirement");
    }

    if (!formData.name.trim()) {
      return t("admin.nameRequired");
    }

    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      return t("admin.phoneInvalid");
    }

    if (formData.role === "1" && !formData.stationId) {
      return t("admin.stationRequired");
    }

    return null;
  };

  // ✅ Submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    const payload: AccountPayload = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      role: Number(formData.role),
      status: 0,
      stationId: formData.role === "1" ? formData.stationId : undefined, // ✅ chỉ gửi khi là staff
    };

    try {
      const response = await api.post("/api/v1/Users", payload);
      toast.success(t("admin.addUserSuccess"));
      setFormData(initialUserData);
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
      <div className="max-w-xl mx-auto bg-white p-8 shadow-2xl rounded-xl">
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
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={t("admin.enterPassword")}
            />
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
              type="text"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={t("admin.enterPhone")}
            />
          </div>

          {/* ROLE */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              {t("admin.roleLabel")} <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ STATION SELECT — chỉ hiện nếu role = Staff */}
          {formData.role === "1" && (
            <div>
              <label
                htmlFor="stationId"
                className="block text-sm font-medium mb-1"
              >
                {t("admin.selectStation")} <span className="text-red-500">*</span>
              </label>
              <select
                id="stationId"
                value={formData.stationId}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">{t("admin.selectStationPlaceholder")}</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} - {station.address}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* STATUS */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">
              {t("admin.statusLabel")}
            </label>
            <input
              type="text"
              id="status"
              value={formData.status === 0 ? t("admin.activeStatus") : t("admin.inactiveStatus")}
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

export default AddUser;
