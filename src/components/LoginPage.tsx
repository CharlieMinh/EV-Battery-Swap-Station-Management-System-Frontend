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

interface LoginPageProps {
  onLogin: (user: UserType) => void;
  onRegister?: () => void;
  onBackToHome?: () => void;
}

export function LoginPage({
  onLogin,
  onRegister,
  onBackToHome,
}: LoginPageProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleDemoLogin = (role: "driver" | "staff" | "admin") => {
    const demoUsers = {
      driver: {
        id: "1",
        name: "Alex Chen",
        email: "alex.chen@example.com",
        role: "driver" as const,
        avatar: "AC",
      },
      staff: {
        id: "2",
        name: "Sarah Johnson",
        email: "sarah.johnson@evswap.com",
        role: "staff" as const,
        avatar: "SJ",
      },
      admin: {
        id: "3",
        name: "Michael Rodriguez",
        email: "michael.rodriguez@evswap.com",
        role: "admin" as const,
        avatar: "MR",
      },
    };
    onLogin(demoUsers[role]);
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

                <TabsContent value="login" className="space-y-4 ">
                  {/* Social Login Options */}

                  {/* <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t("login.orContinueWithEmail")}
                      </span>
                    </div>
                  </div> */}

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
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-gray-600">
                        {t("login.rememberMe")}
                      </span>
                    </label>
                    <a href="#" className="text-orange-500 hover:underline">
                      {t("login.forgotPassword")}
                    </a>
                  </div>

                  <Button
                    className="w-full mb-[6px] bg-orange-500 hover:bg-orange-600"
                    onClick={() => handleDemoLogin("driver")}
                  >
                    {t("login.signIn")}
                  </Button>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-center">
                      <Chrome className="w-4 h-4 mr-2" />
                      {t("login.continueWithGoogle")}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="demo" className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    {t("login.tryPlatform")}
                  </div>

                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleDemoLogin("driver")}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t("login.evDriverPortal")}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleDemoLogin("staff")}
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-gray-500 mt-[12px]">
            {t("login.dontHaveAccount")}{" "}
            <button
              onClick={onRegister}
              className="text-orange-500 hover:underline"
            >
              {t("login.signUpHere")}
            </button>
          </div>

          {onBackToHome && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                onClick={onBackToHome}
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
