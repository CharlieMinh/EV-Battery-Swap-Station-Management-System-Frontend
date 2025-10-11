import React, { useState, useEffect } from "react";
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
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type ResetStep = "email" | "verification" | "newPassword" | "success";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

interface ValidationState {
  isValid: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function ForgetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Step management
  const [currentStep, setCurrentStep] = useState<ResetStep>("email");
  
  // Form data
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [emailValidation, setEmailValidation] = useState<ValidationState>({ isValid: false, message: '', type: 'info' });
  const [passwordValidation, setPasswordValidation] = useState<ValidationState>({ isValid: false, message: '', type: 'info' });
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState<ValidationState>({ isValid: false, message: '', type: 'info' });
  
  // Rate limiting
  const [rateLimitInfo, setRateLimitInfo] = useState<{remaining: number, resetTime: string, maxRequests: number} | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // Email validation
  useEffect(() => {
    if (!email) {
      setEmailValidation({ isValid: false, message: '', type: 'info' });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailValidation({ 
        isValid: false, 
        message: t("forgotPassword.emailInvalidFormat"), 
        type: 'error' 
      });
    } else {
      setEmailValidation({ 
        isValid: true, 
        message: t("forgotPassword.emailValidFormat"), 
        type: 'success' 
      });
    }
  }, [email, t]);

  // Password validation
  useEffect(() => {
    if (!newPassword) {
      setPasswordValidation({ isValid: false, message: '', type: 'info' });
      return;
    }

    const validations = [];
    
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      validations.push(t("forgotPassword.passwordTooShort"));
    }
    
    if (!/(?=.*[a-z])/.test(newPassword)) {
      validations.push(t("forgotPassword.passwordNeedLowercase"));
    }
    
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      validations.push(t("forgotPassword.passwordNeedUppercase"));
    }
    
    if (!/(?=.*\d)/.test(newPassword)) {
      validations.push(t("forgotPassword.passwordNeedNumber"));
    }
    
    if (!/(?=.*[@$!%*?&])/.test(newPassword)) {
      validations.push(t("forgotPassword.passwordNeedSpecial"));
    }

    if (validations.length === 0) {
      setPasswordValidation({ 
        isValid: true, 
        message: t("forgotPassword.passwordStrong"), 
        type: 'success' 
      });
    } else {
      setPasswordValidation({ 
        isValid: false, 
        message: validations.join(', '), 
        type: 'error' 
      });
    }
  }, [newPassword, t]);

  // Confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordValidation({ isValid: false, message: '', type: 'info' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordValidation({ 
        isValid: false, 
        message: t("forgotPassword.passwordMismatch"), 
        type: 'error' 
      });
    } else {
      setConfirmPasswordValidation({ 
        isValid: true, 
        message: t("forgotPassword.passwordMatch"), 
        type: 'success' 
      });
    }
  }, [newPassword, confirmPassword, t]);

  // Rate limit countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rateLimitCountdown > 0) {
      interval = setInterval(() => {
        setRateLimitCountdown(prev => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rateLimitCountdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailValidation.isValid) {
      setError(t("forgotPassword.emailInvalidFormat"));
      return;
    }

    if (isRateLimited) {
      setError(t("forgotPassword.rateLimitExceeded"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Sending forgot password request:", { email });
      
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/forgot-password",
        { email }
      );

      console.log("Forgot password response:", response);

      if (response.status === 200 || response.data.success) {
        setCurrentStep("verification");
        // Update rate limit info if provided
        if (response.data.rateLimitInfo) {
          setRateLimitInfo(response.data.rateLimitInfo);
        }
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        
        // Handle rate limiting
        if (error.response.status === 429) {
          setIsRateLimited(true);
          if (data.rateLimitInfo) {
            setRateLimitInfo(data.rateLimitInfo);
            const resetTime = new Date(data.rateLimitInfo.resetTime);
            const now = new Date();
            const secondsUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
            setRateLimitCountdown(Math.max(0, secondsUntilReset));
          } else {
            setRateLimitCountdown(3600); // Default 1 hour
          }
          setError(t("forgotPassword.rateLimitExceeded"));
        } else {
          setError(data.error?.message || t("forgotPassword.errorGeneric"));
        }
      } else {
        setError(t("forgotPassword.errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError(t("forgotPassword.invalidCodeLength"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Verifying OTP:", { email, otp: verificationCode });
      
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/verify-otp",
        {
          email,
          otp: verificationCode,
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
        
        if (error.response.status === 400) {
          setError(data.error?.message || t("forgotPassword.invalidCode"));
        } else if (error.response.status === 404) {
          setError(t("forgotPassword.apiNotFound"));
        } else if (error.response.status === 429) {
          setError(t("forgotPassword.tooManyAttempts"));
        } else if (error.response.status === 410) {
          setError(t("forgotPassword.codeExpired"));
        } else {
          setError(data.error?.message || t("forgotPassword.errorGeneric"));
        }
      } else {
        setError(t("forgotPassword.errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      setError(t("forgotPassword.passwordRequirementsNotMet"));
      return;
    }

    if (!confirmPasswordValidation.isValid) {
      setError(t("forgotPassword.passwordMismatch"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Resetting password:", { email, otp: verificationCode });
      
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/reset-password",
        {
          email,
          otp: verificationCode,
          newPassword,
          confirmPassword,
        }
      );

      console.log("Reset password response:", response);

      if (response.status === 200 || response.data.success) {
        setCurrentStep("success");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        setError(data.error?.message || t("forgotPassword.errorGeneric"));
      } else {
        setError(t("forgotPassword.errorGeneric"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
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
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        className={`pl-10 ${
                          emailValidation.type === 'error' ? 'border-red-500' : 
                          emailValidation.type === 'success' ? 'border-green-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {/* Email validation message */}
                    {emailValidation.message && (
                      <div className={`flex items-center space-x-2 text-sm ${
                        emailValidation.type === 'error' ? 'text-red-600' :
                        emailValidation.type === 'success' ? 'text-green-600' :
                        emailValidation.type === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {emailValidation.type === 'error' && <AlertCircle className="w-4 h-4" />}
                        {emailValidation.type === 'success' && <CheckCircle className="w-4 h-4" />}
                        <span>{emailValidation.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Rate limit info */}
                  {rateLimitInfo && !isRateLimited && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                      {t("forgotPassword.rateLimitInfo")} {rateLimitInfo.remaining}/{rateLimitInfo.maxRequests}
                    </div>
                  )}

                  {/* Rate limit warning */}
                  {isRateLimited && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{t("forgotPassword.rateLimitExceededDesc")}</span>
                      </div>
                      <div className="mt-2 font-mono text-lg">
                        {t("forgotPassword.timeRemaining")}: {formatTime(rateLimitCountdown)}
                      </div>
                    </div>
                  )}

                  {/* General error */}
                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading || !emailValidation.isValid || isRateLimited}
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
                          const value = e.target.value.replace(/\D/g, '');
                          setVerificationCode(value);
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
                        onClick={handleResendCode}
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
                        type={showPassword ? "text" : "password"}
                        placeholder={t("forgotPassword.enterNewPassword")}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (error) setError("");
                        }}
                        className={`pl-10 pr-10 ${
                          passwordValidation.type === 'error' ? 'border-red-500' : 
                          passwordValidation.type === 'success' ? 'border-green-500' : ''
                        }`}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Password validation message */}
                    {passwordValidation.message && (
                      <div className={`flex items-start space-x-2 text-sm ${
                        passwordValidation.type === 'error' ? 'text-red-600' :
                        passwordValidation.type === 'success' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {passwordValidation.type === 'error' && <AlertCircle className="w-4 h-4 mt-0.5" />}
                        {passwordValidation.type === 'success' && <CheckCircle className="w-4 h-4 mt-0.5" />}
                        <span>{passwordValidation.message}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("forgotPassword.confirmPassword")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("forgotPassword.confirmNewPassword")}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError("");
                        }}
                        className={`pl-10 pr-10 ${
                          confirmPasswordValidation.type === 'error' ? 'border-red-500' : 
                          confirmPasswordValidation.type === 'success' ? 'border-green-500' : ''
                        }`}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Confirm password validation message */}
                    {confirmPasswordValidation.message && (
                      <div className={`flex items-center space-x-2 text-sm ${
                        confirmPasswordValidation.type === 'error' ? 'text-red-600' :
                        confirmPasswordValidation.type === 'success' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {confirmPasswordValidation.type === 'error' && <AlertCircle className="w-4 h-4" />}
                        {confirmPasswordValidation.type === 'success' && <CheckCircle className="w-4 h-4" />}
                        <span>{confirmPasswordValidation.message}</span>
                      </div>
                    )}
                  </div>

                  {/* General error */}
                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading || !passwordValidation.isValid || !confirmPasswordValidation.isValid}
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
