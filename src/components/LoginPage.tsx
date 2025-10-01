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

export function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

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

      onLogin(response.data);
      console.log(response.data);

      if (response.data.role === "Driver") {
        navigate("/driver");
      } else if (response.data.role === "Staff") {
        navigate("/staff");
      } else if (response.data.role === "Admin") {
        navigate("/admin");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.message);
        console.error("Response:", error.response?.data);
        console.error("Status:", error.response?.status);
      } else {
        console.error("Unexpected error:", error);
        alert("Login failed. Please check your credentials.");
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
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t("login.signIn")}</TabsTrigger>
                  <TabsTrigger value="demo">
                    {t("login.demoAccess")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
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
                    </div>

                    {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}

                    <Button
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600"
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
                </TabsContent>

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
              </Tabs>
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

          {/* {onBackToHome && (
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
          )} */}
        </div>
      </div>
    </div>
  );
}
