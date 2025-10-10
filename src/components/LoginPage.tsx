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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
import {
  Zap,
  Battery,
  Shield,
  User,
  Mail,
  Lock,
  Chrome,
  Github,
  Facebook,
  ArrowLeft,
} from "lucide-react";
import { User as UserType } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { on } from "events";
import { error } from "console";

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  onRegister?: () => void;
  onBackToHome?: () => void;
}

export function LoginPage({ onLogin, onBackToHome }: LoginPageProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log("handleLogin called!");

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5194/api/v1/Auth/login",
        {
          email,
          password,
        },
        { withCredentials: true }
      );

      if (response.data.role) {
        // Save token to localStorage
        if (response.data.token) {
          localStorage.setItem("authToken", response.data.token);
        }

        onLogin(response.data);
        console.log(response.data);

        if (response.data.role === "Driver") navigate("/");
        else if (response.data.role === "Staff") navigate("/staff");
        else if (response.data.role === "Admin") navigate("/admin");
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;

        // Validation lỗi 400
        if (data.error?.code === "VALIDATION_FAILED") {
          setErrorEmail(data.error.details?.email?.[0] || "");
          setErrorPassword(data.error.details?.password?.[0] || "");
        }
        // Invalid credentials 401
        else if (data.error?.code === "INVALID_CREDENTIALS") {
          setErrorPassword(data.error.message || "Invalid email or password.");
        }
      } else {
        // Lỗi không mong muốn
        setErrorPassword("Login failed. Please try again.");
        console.error("Unexpected error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col">
      <div
        className="flex items-center justify-center p-4"
        style={{ minHeight: "calc(100vh - 80px)" }}
      >
        <div className="w-full max-w-md mb-0">
          {/* Logo and Branding */}
          <div className="text-center mb-0px">
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
            <p className="text-gray-600">{t("login.batterySwapManagement")}</p>
          </div>

          <div className="flex justify-center p-4">
            <LanguageSwitcher />
          </div>

          <Card>
            <CardHeader className="pt-[14px]">
              <CardTitle className="text-2xl text-center">
                {" "}
                {t("login.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("login.enterEmail")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errorEmail && <p style={{ color: "red" }}>{errorEmail}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder={t("login.enterPassword")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {errorPassword && (
                    <p style={{ color: "red" }}>{errorPassword}</p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm text-orange-500 hover:text-orange-600 hover:underline"
                  >
                    {t("login.forgotPassword")}
                  </button>
                </div>

                {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 mb-2"
                  disabled={loading}
                >
                  {loading ? t("login.loading") : t("login.signIn")}
                </Button>
              </form>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-center">
                  <Chrome className="w-4 h-4 mr-2" />
                  {t("login.continueWithGoogle")}
                </Button>
              </div>

              {/* <TabsContent value="demo" className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    {t("login.tryPlatform")}
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/driver")}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t("login.evDriverPortal")}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate("/staff")}
                    >
                      <Battery className="w-4 h-4 mr-2" />
                      {t("login.stationStaffPortal")}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleDemoLogin("admin")}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {t("login.adminDashboard")}
                    </Button>
                  </div>
                </TabsContent> */}
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-gray-500 mt-[12px]">
            {t("login.dontHaveAccount")}{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-orange-500 hover:underline"
            >
              {t("login.signUpHere")}
            </button>
          </div>

          {onBackToHome && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("login.backToHome")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
