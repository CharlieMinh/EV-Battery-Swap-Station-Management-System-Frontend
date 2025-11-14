import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Edit, Car, Delete, Pen, Trash2, PenBox } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import VehicleFormWithOCR from "./VehicleFormWithOCR";
import { vehicleService } from "../../services/driver/vehicleService";
import { showError, showSuccess, showConfirm } from "../ui/alert";

interface Vehicle {
    id: string;
    vin: string;
    plate: string;
    brand: string;
    vehicleModelFullName?: string;
    compatibleBatteryModelName?: string;
    photoUrl?: string;
}

interface MyVehicleProps {
    vehicles: Vehicle[];
    onRefresh: () => void;
}

export function MyVehicle({ vehicles, onRefresh }: MyVehicleProps) {
    const { t } = useLanguage();
    const [showForm, setShowForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    const handleAdd = () => {
        setEditingVehicle(null);
        setShowForm(true);
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await showConfirm(
            t("driver.confirmDeleteTitle"),
            t("driver.confirmDeleteText"), t("features.yes"),
            t("features.cancel")
        );

        if (!confirmed) return;

        try {
            await vehicleService.deleteVehicle(id);
            await showSuccess(t("driver.deleteSuccess"));
            onRefresh?.();
        } catch (err: any) {
            console.log("Lỗi khi xóa:", err);
            const msg =
                err.response?.data?.error?.message ||
                t("driver.cannotConnectServer");
            await showError(msg, t("driver.errorAddCar"));
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            if (editingVehicle) {
                await vehicleService.updateVehicle(editingVehicle.id, data);
                await showSuccess(t("driver.updateSuccess"));
            } else {
                await vehicleService.createVehicle(data);
                await showSuccess(t("driver.addSuccess"));
            }
            setShowForm(false);
            onRefresh();
        } catch (err: any) {
            const msg =
                err.response?.data?.error?.message ||
                t("driver.cannotConnectServer");
            await showError(msg, t("driver.errorAddCar"));
        }
    };

    return (
        <div className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                        {t("driver.vehicleInformation")}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {t("driver.vehicleInformationDesc")}
                    </p>
                </div>

                <Card className="border-2 border-orange-400 rounded-xl shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                        <CardDescription className="text-sm text-orange-600 font-bold">
                            {t("driver.vehicle.linkedCount")} <span className="font-bold text-orange-600">{vehicles.length}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {showForm ? (
                            <VehicleFormWithOCR
                                initialData={editingVehicle}
                                isEdit={!!editingVehicle}
                                onSubmit={handleSubmit}
                                onCancel={() => setShowForm(false)}
                            />
                        ) : (
                            <>
                                {vehicles.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">
                                        {t("driver.noVehicleFound")}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {vehicles.map((vehicle) => (
                                            <Card
                                                key={vehicle.id}
                                                className="border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg transition-all duration-200"
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-4">
                                                        {vehicle.photoUrl ? (
                                                            <img
                                                                src={vehicle.photoUrl}
                                                                alt={vehicle.vehicleModelFullName || t("driver.unknownModel")}
                                                                className="w-20 h-20 object-cover rounded-lg border-2 border-orange-300"
                                                            />
                                                        ) : (
                                                            <div className="w-20 h-20 bg-orange-100 rounded-lg flex items-center justify-center border-2 border-orange-300">
                                                                <Car className="w-10 h-10 text-orange-500" />
                                                            </div>
                                                        )}

                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-lg text-orange-600 mb-2">
                                                                {vehicle.vehicleModelFullName || t("driver.unknownModel")}
                                                            </h4>
                                                            <div className="space-y-1 text-sm">
                                                                <p className="text-gray-700">
                                                                    <span className="font-medium">{t("driver.brand")}:</span> {vehicle.brand}
                                                                </p>
                                                                <p className="text-gray-700">
                                                                    <span className="font-medium">{t("driver.plate")}:</span> <Badge variant="outline" className="ml-1">{vehicle.plate}</Badge>
                                                                </p>
                                                                <p className="text-gray-500 text-xs">
                                                                    VIN: {vehicle.vin}
                                                                </p>
                                                                <p className="text-gray-600 text-xs">
                                                                    <span className="font-medium">{t("driver.vehicle.compatibleBatteryLabel")}</span> {vehicle.compatibleBatteryModelName || t("driver.noCompatibleBattery")}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-14">
                                                            <Button
                                                                size="sm"
                                                                className="bg-blue-500 text-white hover:bg-blue-600"
                                                                onClick={() => handleEdit(vehicle)}
                                                            >
                                                                <PenBox className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleDelete(vehicle.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full bg-orange-500 text-white mt-4 hover:bg-orange-600"
                                    onClick={handleAdd}
                                >
                                    {t("driver.addVehicle")}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}