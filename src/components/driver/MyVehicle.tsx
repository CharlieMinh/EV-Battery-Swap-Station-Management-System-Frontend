import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Edit, Car, Delete } from "lucide-react";
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
            // throw err; // ĐÃ XÓA DÒNG NÀY
        }
    };

    return (
        <div className="space-y-6">
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
                    {showForm ? (
                        <VehicleFormWithOCR
                            initialData={editingVehicle}
                            isEdit={!!editingVehicle}
                            onSubmit={handleSubmit}
                            onCancel={() => setShowForm(false)}
                        // ĐÃ XÓA PROP onSuccess TẠI ĐÂY
                        />
                    ) : (
                        <>
                            {vehicles.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    {t("driver.noVehicleFound")}
                                </p>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition"
                                    >
                                        <div className="flex items-center space-x-4">
                                            {vehicle.photoUrl ? (
                                                <img
                                                    src={vehicle.photoUrl}
                                                    alt={vehicle.vehicleModelFullName || t("driver.unknownModel")}
                                                    className="w-16 h-16 object-cover rounded-md border"
                                                />
                                            ) : (
                                                <Car className="w-10 h-10 text-orange-500" />
                                            )}

                                            <div>
                                                <p className="font-semibold text-orange-600">
                                                    {vehicle.vehicleModelFullName || t("driver.unknownModel")}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {t("driver.brand")}: {vehicle.brand}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {t("driver.plate")}: {vehicle.plate}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    VIN: {vehicle.vin}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {t("driver.compatibleBattery")}: {vehicle.compatibleBatteryModelName || t("driver.noCompatibleBattery")}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-orange-500 text-white hover:bg-orange-600"
                                                onClick={() => handleEdit(vehicle)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="bg-orange-500 text-white hover:bg-orange-600"
                                                onClick={() => handleDelete(vehicle.id)}
                                            >
                                                <Delete className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
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
    );
}