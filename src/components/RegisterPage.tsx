import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Zap,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { User as UserType } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

interface RegisterPageProps {
  onRegister: (user: UserType) => void;
  onBackToLogin: () => void;
  onBackToHome: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage({
  onRegister,
  onBackToLogin,
  onBackToHome,
}: RegisterPageProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return (
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("register.nameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("register.emailRequired");
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("register.emailInvalid");
    }

    if (formData.password.length < 6) {
      newErrors.password = "Password phải có ít nhất 6 ký tự";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = "Password phải có ít nhất 1 chữ hoa";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = "Password phải có ít nhất 1 chữ thường";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "Password phải có ít nhất 1 số";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("register.confirmPasswordRequired");
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("register.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (
    //API call
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/register",
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        },
        { withCredentials: true }
      );

      onRegister(response.data);
      setSuccessMessage(t("register.registrationSuccess"));
      toast.success(t("register.registrationSuccess"), {
        position: "top-right",
        autoClose: 4000,
      });
      navigate("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;

        if (data.error?.code === "EMAIL_EXISTS") {
          setErrors({ email: data.error.message || "Email already exists." });
        } else {
          setErrors({ password: "Registration failed. Please try again." });
          console.error("Unexpected error:", error);
        }
      }

      toast.error(t("register.registrationFailed"), {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-[4px] items-center justify-center w-16 h-16 mb-4">
            <img
              src="src/assets/logoEV2.png "
              alt="FPTFAST Logo"
              className="w-18 h-15  rounded-full"
            />
          </div>
          <h1 className="text-3xl text-orange-500 font-bold mb-[4px]">
            F P T F A S T
          </h1>
          <p className="text-gray-600">{t("register.createAccount")}</p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600">
                <User className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {t("register.createAccount")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("register.personalInfoDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("register.name")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`h-12 bg-white border-2 transition-all duration-200 focus:ring-2 focus:ring-green-200 ${
                    errors.name
                      ? "border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-green-500"
                  }`}
                  placeholder={t("register.namePlaceholder")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("register.phoneNumber")}
                </Label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`h-12 pl-12 bg-white border-2 transition-all duration-200 focus:ring-2 focus:ring-green-200 ${
                      errors.phone
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-green-500"
                    }`}
                    placeholder="+84 (123) 456-7890"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("register.emailAddress")}
                </Label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`h-12 pl-12 bg-white border-2 transition-all duration-200 focus:ring-2 focus:ring-green-200 ${
                      errors.email
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-green-500"
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("register.password")}
                </Label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`h-12 pl-12 pr-12 bg-white border-2 transition-all duration-200 focus:ring-2 focus:ring-green-200 ${
                      errors.password
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-green-500"
                    }`}
                    placeholder={t("register.passwordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.password}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{t("register.passwordHint")}</span>
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("register.confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`h-12 pl-12 pr-12 bg-white border-2 transition-all duration-200 focus:ring-2 focus:ring-green-200 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-200"
                        : "border-gray-300 focus:border-green-500"
                    }`}
                    placeholder={t("register.confirmPasswordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Success Notice
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">
                      {t("register.defaultDriverRole")}
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      {t("register.defaultDriverRoleDesc")}
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 hover:scale-105 shadow-lg disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t("register.creating")}</span>
                    </div>
                  ) : (
                    t("register.createAccount")
                  )}
                </Button>
              </div>

              {/* Back to Login */}
              {/* <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBackToLogin}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t("register.backToLogin")}</span>
                </Button>
              </div> */}
            </form>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t("register.alreadyHaveAccount")}{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-orange-600 hover:text-orange-500 font-medium"
                >
                  {t("register.signIn")}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            {t("register.termsText")}{" "}
            <a href="#" className="text-orange-600 hover:underline">
              {t("register.termsOfService")}
            </a>{" "}
            {t("register.and")}{" "}
            <a href="#" className="text-orange-600 hover:underline">
              {t("register.privacyPolicy")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
