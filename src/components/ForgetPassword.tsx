import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
import {
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Lock,
  Key,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type ResetStep = "email" | "verification" | "newPassword" | "success";

export function ForgetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/forgot-password",
        {
          email,
        }
      );

      if (response.status === 200) {
        setCurrentStep("verification");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        setError(data.error?.message || t("forgotPassword.errorGeneric"));
      } else {
        setError(t("forgotPassword.errorGeneric"));
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!verificationCode || verificationCode.length !== 6) {
      setError(t("forgotPassword.invalidCodeLength"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Verifying code:", { email, code: verificationCode });
      
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/verify-reset-code",
        {
          email,
          code: verificationCode,
        }
      );

      console.log("Verification response:", response);

      if (response.status === 200 || response.data.success) {
        setCurrentStep("newPassword");
      } else {
        setError(response.data.message || t("forgotPassword.invalidCode"));
      }
    } catch (error) {
      console.error("Verification error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        console.log("Error response data:", data);
        
        // Handle specific error cases
        if (error.response.status === 400) {
          setError(data.error?.message || t("forgotPassword.invalidCode"));
        } else if (error.response.status === 429) {
          setError(t("forgotPassword.tooManyAttempts"));
        } else if (error.response.status === 410) {
          setError(t("forgotPassword.codeExpired"));
        } else {
          setError(data.error?.message || t("forgotPassword.errorGeneric"));
        }
      } else {
        setError(t("forgotPassword.errorGeneric"));
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError(t("forgotPassword.passwordMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("forgotPassword.passwordTooShort"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/reset-password",
        {
          email,
          code: verificationCode,
          newPassword,
        }
      );

      if (response.status === 200) {
        setCurrentStep("success");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        setError(data.error?.message || t("forgotPassword.errorGeneric"));
      } else {
        setError(t("forgotPassword.errorGeneric"));
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render Success Step
  if (currentStep === "success") {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col">
        <div
          className="flex items-center justify-center p-4"
          style={{ minHeight: "calc(100vh - 80px)" }}
        >
          <div className="w-full max-w-md">
            {/* Logo and Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex mb-4 items-center justify-center w-16 h-16">
                <img
                  src="src/assets/logoEV2.png"
                  alt="FPTFAST Logo"
                  className="w-18 h-15 rounded-full"
                />
              </div>
              <h1 className="text-3xl text-orange-500 font-bold mb-4">
                F P T F A S T
              </h1>
              <p className="text-gray-600">{t("login.batterySwapManagement")}</p>
            </div>

            <div className="flex justify-center mb-6">
              <LanguageSwitcher />
            </div>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl">
                  {t("forgotPassword.passwordResetSuccess")}
                </CardTitle>
                <CardDescription>
                  {t("forgotPassword.passwordResetSuccessDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  {t("forgotPassword.backToLogin")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div
        className="flex items-center justify-center p-4"
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        <div className="w-full max-w-md">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex mb-4 items-center justify-center w-16 h-16">
              <img
                src="src/assets/logoEV2.png"
                alt="FPTFAST Logo"
                className="w-18 h-15 rounded-full"
              />
            </div>
            <h1 className="text-3xl text-orange-500 font-bold mb-4">
              F P T F A S T
            </h1>
            <p className="text-gray-600">{t("login.batterySwapManagement")}</p>
          </div>

          <div className="flex justify-center mb-6">
            <LanguageSwitcher />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {currentStep === "email" && t("forgotPassword.title")}
                {currentStep === "verification" && t("forgotPassword.verificationTitle")}
                {currentStep === "newPassword" && t("forgotPassword.newPasswordTitle")}
              </CardTitle>
              <CardDescription className="text-center">
                {currentStep === "email" && t("forgotPassword.subtitle")}
                {currentStep === "verification" && t("forgotPassword.verificationSubtitle")}
                {currentStep === "newPassword" && t("forgotPassword.newPasswordSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Step 1: Email Input */}
              {currentStep === "email" && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("login.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("forgotPassword.enterEmailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
                  </Button>
                </form>
              )}

              {/* Step 2: Verification Code Input */}
              {currentStep === "verification" && (
                <form onSubmit={handleVerificationSubmit} className="space-y-4">
                  <div className="text-center text-sm text-gray-600 mb-4">
                    <p>{t("forgotPassword.codeSentTo")}</p>
                    <p className="font-medium text-gray-900">{email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">{t("forgotPassword.verificationCode")}</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="verificationCode"
                        type="text"
                        placeholder={t("forgotPassword.enterCodePlaceholder")}
                        value={verificationCode}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/\D/g, '');
                          setVerificationCode(value);
                          // Clear error when user starts typing
                          if (error) setError("");
                        }}
                        className="pl-10 text-center text-lg tracking-widest"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                      />
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {verificationCode.length}/6 {t("forgotPassword.digits")}
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={loading || verificationCode.length !== 6}
                    >
                      {loading ? t("forgotPassword.verifying") : t("forgotPassword.verifyCode")}
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          setLoading(true);
                          setError("");
                          try {
                            await axios.post("http://localhost:5194/api/v1/Auth/forgot-password", { email });
                            setError(""); // Clear any previous errors
                            console.log("Resent verification code to:", email);
                          } catch (err) {
                            console.error("Failed to resend code:", err);
                            setError(t("forgotPassword.errorGeneric"));
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="w-full"
                        disabled={loading}
                      >
                        {t("forgotPassword.resendCode")}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep("email")}
                        className="w-full"
                      >
                        {t("forgotPassword.changeEmail")}
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* Step 3: New Password Input */}
              {currentStep === "newPassword" && (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">{t("forgotPassword.newPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder={t("forgotPassword.enterNewPassword")}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("forgotPassword.confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder={t("forgotPassword.confirmNewPassword")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading ? t("forgotPassword.resetting") : t("forgotPassword.resetPassword")}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("forgotPassword.backToLogin")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}