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
interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    batteryModel: string;
}

interface MyVehicleProps {
    vehicles: Vehicle[];
}
export function MyVehicle({
    vehicles,
}: MyVehicleProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            {/* Vehicle Information */}
            <Card className="border border-orange-500 rounded-lg">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-500 font-bold">
                        <Car className="w-5 h-5" />
                        <span>{t("driver.vehicleInformation")}</span>
                    </CardTitle>
                    <CardDescription>
                        {t("driver.vehicleInformationDesc")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {vehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="flex items-center justify-between p-4 border rounded-lg text-orange-500 font-bold"
                            >
                                <div className="flex items-center space-x-3">
                                    <Car className="w-8 h-8 text-blue-500" />
                                    <div>
                                        <p className="font-medium">
                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t("driver.battery")} {vehicle.batteryModel}
                                        </p>
                                        <p className="text-xs text-gray-400">VIN: {vehicle.vin}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge className="bg-orange-500 text-white" variant="secondary">{t("driver.primary")}</Badge>
                                    <Button size="sm" variant="outline" className="bg-orange-500 text-white">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button variant="outline" className="w-full bg-orange-500 text-white">
                            {t("driver.addVehicle")}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Driver Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border border-orange-500 rounded-lg">
                    <CardContent className="p-4 text-center">
                        <Battery className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">127</p>
                        <p className="text-sm text-gray-500">{t("driver.totalSwaps")}</p>
                    </CardContent>
                </Card>
                <Card className="border border-orange-500 rounded-lg">
                    <CardContent className="p-4 text-center">
                        <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">4.9</p>
                        <p className="text-sm text-gray-500">{t("driver.averageRating")}</p>
                    </CardContent>
                </Card>
                <Card className="border border-orange-500 rounded-lg">
                    <CardContent className="p-4 text-center">
                        <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">$1,847</p>
                        <p className="text-sm text-gray-500">{t("driver.totalSavings")}</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}





