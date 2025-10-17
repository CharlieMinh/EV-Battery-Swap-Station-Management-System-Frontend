import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "../LanguageContext";
import { showError, showSuccess } from "../ui/alert";
import { Upload } from "lucide-react";

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
    const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);
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

    // Handle vehicle photo upload
    const handleVehiclePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type.toLowerCase())) {
            showError("Chỉ chấp nhận file ảnh định dạng JPEG hoặc PNG");
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError("Kích thước file không được vượt quá 10MB");
            return;
        }

        setVehiclePhotoFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setVehiclePhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            vin: vin.trim(),
            plate: plate.trim(),
            vehicleModelId: vehicleModelId || null,
            photoUrl: vehiclePhotoPreview || photoUrl || null, // Use uploaded photo or existing URL
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

                    {/* Ảnh xe - Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.vehiclePhoto")}</label>
                        
                        {/* Upload Section */}
                        <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 bg-orange-50">
                            <div className="flex flex-col items-center space-y-2">
                                <Upload className="w-8 h-8 text-orange-400" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                        Tải lên ảnh xe
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Hỗ trợ: JPEG, PNG (Tối đa 10MB)
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleVehiclePhotoUpload}
                                    className="hidden"
                                    id="vehicle-photo-upload"
                                />
                                <label htmlFor="vehicle-photo-upload">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="bg-white hover:bg-gray-50"
                                        onClick={() => document.getElementById("vehicle-photo-upload")?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Chọn ảnh xe
                                    </Button>
                                </label>
                            </div>
                        </div>

                        {/* Preview uploaded image */}
                        {vehiclePhotoPreview && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ảnh đã chọn:
                                </label>
                                <div className="relative border rounded-lg overflow-hidden">
                                    <img
                                        src={vehiclePhotoPreview}
                                        alt="Vehicle preview"
                                        className="w-full h-48 object-cover bg-gray-100"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    File: {vehiclePhotoFile?.name} ({(vehiclePhotoFile!.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            </div>
                        )}

                        {/* Fallback URL input (for edit mode) */}
                        {!vehiclePhotoPreview && (
                            <div className="mt-3">
                                <Input
                                    value={photoUrl}
                                    onChange={(e) => setPhotoUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Hoặc nhập URL ảnh xe đã upload lên storage
                                </p>
                            </div>
                        )}
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
