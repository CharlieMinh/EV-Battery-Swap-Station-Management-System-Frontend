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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function ForgetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: Replace with actual API endpoint
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/forgot-password",
        {
          email,
        }
      );

      if (response.status === 200) {
        setIsSubmitted(true);
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

  if (isSubmitted) {
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
                  {t("forgotPassword.emailSent")}
                </CardTitle>
                <CardDescription>
                  {t("forgotPassword.checkEmailDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  <p>{t("forgotPassword.emailSentTo")}</p>
                  <p className="font-medium text-gray-900">{email}</p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    {t("forgotPassword.backToLogin")}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail("");
                    }}
                    className="w-full"
                  >
                    {t("forgotPassword.resendEmail")}
                  </Button>
                </div>
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
                {t("forgotPassword.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("forgotPassword.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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