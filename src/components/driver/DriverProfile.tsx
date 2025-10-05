import React from "react";
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
import { Edit, User, Star, Car, CreditCard, Shield } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { User as UserType } from "../../App";
import { Battery } from "lucide-react";

interface DriverProfileProps {
  user: UserType;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
  onPhoneChange: (phone: string) => void;
}

export function DriverProfile({
  user,
  profileName,
  profileEmail,
  profilePhone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
}: DriverProfileProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-500 fond-bold">
            <User className="w-5 h-5" />
            <span>{t("driver.personalInformation")}</span>
          </CardTitle>
          <CardDescription>
            {t("driver.personalInformationDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{user.name}</h3>
              <p className="text-sm text-gray-500">
                {t("driver.driverSince")} January 2024
              </p>
              <Badge className="mt-1">{t("driver.verifiedDriver")}</Badge>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t("driver.fullName")}</Label>
              <Input
                id="name"
                value={profileName}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">{t("driver.emailAddress")}</Label>
              <Input
                id="email"
                type="email"
                value={profileEmail}
                onChange={(e) => onEmailChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("driver.phoneNumber")}</Label>
              <Input
                id="phone"
                value={profilePhone}
                onChange={(e) => onPhoneChange(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("driver.membershipStatus")}</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-green-100 text-green-800">
                  {t("driver.active")}
                </Badge>
                <span className="text-sm text-gray-500">
                  {t("driver.monthlyUnlimited")}
                </span>
              </div>
            </div>
          </div>
          <Button className="w-full bg-orange-500">
            <Edit className="w-4 h-4 mr-2" /> {t("driver.updateProfile")}
          </Button>
        </CardContent>
      </Card>



      {/* Payment Methods */}
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-500 fond-bold">
            <CreditCard className="w-5 h-5" />
            <span>{t("driver.paymentMethods")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">•••• •••• •••• 4232</p>
                  <p className="text-sm text-gray-500">Expires 12/26</p>
                </div>
              </div>
              <Badge className="bg-orange-500">{t("driver.primary")}</Badge>
            </div>
            <Button variant="outline" className="w-full bg-orange-500 text-white">
              {t("driver.addPaymentMethod")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}