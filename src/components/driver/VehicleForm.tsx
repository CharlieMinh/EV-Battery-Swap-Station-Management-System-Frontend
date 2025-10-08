import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "../LanguageContext";
import { showError, showSuccess } from "../ui/alert";

interface VehicleFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    initialData?: any;
    isEdit?: boolean;
    onSuccess?: (msg: string) => void;
}

interface VehicleModel {
    id: string;
    name: string;
    fullName: string;
    brand: string;
}

export default function VehicleForm({
    onSubmit,
    onCancel,
    initialData,
    isEdit = false,
    onSuccess,
}: VehicleFormProps) {
    const { t } = useLanguage();

    const [vin, setVin] = useState(initialData?.vin || "");
    const [plate, setPlate] = useState(initialData?.plate || "");
    const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "");
    const [vehicleModelId, setVehicleModelId] = useState(initialData?.vehicleModelId || "");
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [loading, setLoading] = useState(false);

    // Lấy danh sách model
    useEffect(() => {
        axios
            .get("http://localhost:5194/api/v1/vehicle-models", { withCredentials: true })
            .then((res) => setModels(res.data))
            .catch(() => showError(t("driver.cannotLoadModels")));
    }, [t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            vin: vin.trim(),
            plate: plate.trim(),
            vehicleModelId: vehicleModelId || null,
            photoUrl: photoUrl || null,
        };

        try {
            setLoading(true);
            await onSubmit(payload);

            const msg = isEdit ? t("driver.vehicleUpdated") : t("driver.vehicleAdded");
            onSuccess?.(msg);
        } catch (err: any) {
            console.error("Lỗi khi gửi form:", err);
            const msg =
                err.response?.data?.error?.message ||
                err.response?.data?.error?.code ||
                t("driver.cannotConnectServer");
            await showError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border border-orange-500 rounded-lg">
            <CardHeader>
                <CardTitle className="text-orange-500 font-bold">
                    {isEdit ? t("driver.editVehicle") : t("driver.addVehicle")}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* VIN */}
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.vin")}</label>
                        <Input
                            value={vin}
                            onChange={(e) => setVin(e.target.value)}
                            placeholder={t("driver.enterVin")}
                            required
                            disabled={isEdit}
                        />
                    </div>

                    {/* Biển số */}
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.plate")}</label>
                        <Input
                            value={plate}
                            onChange={(e) => setPlate(e.target.value)}
                            placeholder={t("driver.enterPlate")}
                            required
                        />
                    </div>

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.vehicleModel")}</label>
                        <select
                            className="border rounded p-2 w-full"
                            value={vehicleModelId}
                            onChange={(e) => setVehicleModelId(e.target.value)}
                            disabled={isEdit}
                            required
                        >
                            <option value="">{t("driver.selectVehicleModel")}</option>
                            {models.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.fullName} ({m.brand})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ảnh */}
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.vehiclePhoto")}</label>
                        <Input
                            value={photoUrl}
                            onChange={(e) => setPhotoUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    {/* Nút */}
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            {t("driver.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            className="bg-orange-500 text-white"
                            disabled={loading}
                        >
                            {loading
                                ? t("driver.processing")
                                : isEdit
                                    ? t("driver.save")
                                    : t("driver.create")}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
