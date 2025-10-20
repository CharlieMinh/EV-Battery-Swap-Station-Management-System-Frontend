import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Edit, Mail, PhoneCallIcon, User } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface UserData {
  id: string;
  email: string;
  phoneNumber: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string;
}

interface DriverProfileProps {
  submitUpdateProfile: (name: string, phone: string) => void,
  userData: UserData | null;
}

export function DriverProfile({
  userData, submitUpdateProfile,
}: DriverProfileProps) {
  const { t } = useLanguage();
  const [name, setName] = useState<any>(userData?.name);
  const [phoneNumber, setphoneNumber] = useState<any>(userData?.phoneNumber);
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in px-8 lg:px-16 py-10">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-4xl font-bold text-orange-600 tracking-tight">
          {t("driver.profile.title")}
        </h1>
      </div>

      {/* Profile Card */}
      <Card className="border-none shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 sm:p-10">
        <CardHeader className="text-center pb-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-28 h-28 shadow-lg border-4 border-orange-500">
              <AvatarFallback className="text-4xl font-bold text-orange-600 bg-orange-100">
                {userData?.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="text-3xl font-semibold text-gray-900">
                {userData?.name}
              </h3>
              <Badge className="mt-3 px-5 py-2 text-base bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-all">
                {userData?.role === "Driver"
                  ? t("role.driver")
                  : userData?.role === "Admin"
                    ? t("role.admin")
                    : t("role.staff")}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 px-2 sm:px-8 lg:px-14 pb-10">
          <Separator className="bg-orange-300" />

          {/* Inputs mỗi dòng */}
          <div className="space-y-6">
            <div>
              <Label
                htmlFor="name"
                className="text-gray-700 text-sm font-semibold"
              >
                <User className="w-4 h-4 text-blue-600" />
                {t("driver.fullName")}
              </Label>
              <Input
                id="name"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-gray-700 text-sm font-semibold"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                {t("driver.email")}
              </Label>
              <Input
                id="email"
                type="email"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={userData?.email}
                disabled={true}
              />
            </div>

            <div>
              <Label
                htmlFor="phone"
                className="text-gray-700 text-sm font-semibold"
              >
                <PhoneCallIcon className="w-4 h-4 text-blue-600" />
                {t("driver.phone")}
              </Label>
              <Input
                id="phone"
                className="mt-2 w-full text-base py-3 border-2 border-orange-400 focus:border-orange-500 focus:ring-orange-500"
                value={phoneNumber}
                onChange={(e) => setphoneNumber(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={() => submitUpdateProfile(name, phoneNumber)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md mt-8 py-3 text-lg rounded-xl transition-all">
            <Edit className="w-5 h-5 mr-2" /> {t("driver.profile.editProfile")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}