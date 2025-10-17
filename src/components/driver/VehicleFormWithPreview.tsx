import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "../LanguageContext";
import { showError } from "../ui/alert";
import { Car, FileImage, ArrowLeft, Upload } from "lucide-react";
import { 
    getVehicleModels, 
    findVehicleModelId,
    type VehicleModel,
    type ScanResult 
} from "../../services/vehicleApi";

interface VehicleFormWithPreviewProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    initialData?: any;
    isEdit?: boolean;
    onSuccess?: (msg: string) => void;
    // New props for scan integration
    scanResult?: ScanResult | null;
    registrationImageUrl?: string | null;
}

export default function VehicleFormWithPreview({
    onSubmit,
    onCancel,
    initialData,
    isEdit = false,
    onSuccess,
    scanResult,
    registrationImageUrl,
}: VehicleFormWithPreviewProps) {
    const { t } = useLanguage();

    const [vin, setVin] = useState(initialData?.vin || "");
    const [plate, setPlate] = useState(initialData?.plate || "");
    const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || "");
    const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);
    const [registrationPhotoUrl, setRegistrationPhotoUrl] = useState(
        initialData?.registrationPhotoUrl || registrationImageUrl || ""
    );
    const [vehicleModelId, setVehicleModelId] = useState(initialData?.vehicleModelId || "");
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

    // Lấy danh sách model
    useEffect(() => {
        getVehicleModels(true)
            .then((data) => setModels(data))
            .catch(() => showError(t("driver.cannotLoadModels")));
    }, [t]);

    // Auto-fill từ scan result khi component mount
    useEffect(() => {
        if (scanResult && !isEdit) {
            const filledFields = new Set<string>();

            // Auto-fill VIN
            if (scanResult.vin) {
                setVin(scanResult.vin);
                filledFields.add("vin");
            }

            // Auto-fill Plate
            if (scanResult.plate) {
                setPlate(scanResult.plate);
                filledFields.add("plate");
            }

            // Auto-fill registration photo URL
            if (registrationImageUrl) {
                setRegistrationPhotoUrl(registrationImageUrl);
                filledFields.add("registrationPhotoUrl");
            }

            // Auto-match Vehicle Model từ Brand + Model
            if (scanResult.brand && scanResult.vehicleModel && models.length > 0) {
                const matchedModelId = findVehicleModelId(
                    scanResult.brand, 
                    scanResult.vehicleModel, 
                    models
                );
                
                if (matchedModelId) {
                    setVehicleModelId(matchedModelId);
                    filledFields.add("vehicleModelId");
                } else {
                    console.warn(
                        `Không tìm thấy model: ${scanResult.brand} ${scanResult.vehicleModel} trong danh sách.`
                    );
                }
            }

            setAutoFilledFields(filledFields);
        }
    }, [scanResult, registrationImageUrl, isEdit, models]);

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
            vin: vin.trim().toUpperCase(),
            plate: plate.trim().toUpperCase(),
            vehicleModelId: vehicleModelId || null,
            photoUrl: vehiclePhotoPreview || photoUrl || null, // Use uploaded photo or existing URL
            registrationPhotoUrl: registrationPhotoUrl || null,
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
                <CardTitle className="text-orange-500 font-bold flex items-center">
                    <Car className="w-5 h-5 mr-2" />
                    {isEdit ? t("driver.editVehicle") : "Đăng ký xe mới"}
                </CardTitle>
                {scanResult && scanResult.confidence > 0 && (
                    <div className="text-sm text-green-600 mt-2 flex items-center">
                        ✅ Thông tin đã được quét tự động (Độ chính xác: {scanResult.confidence.toFixed(1)}%)
                    </div>
                )}
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Preview Images Section */}
                    {(registrationImageUrl || photoUrl) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                            {/* Registration Photo Preview */}
                            {registrationImageUrl && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                                        <FileImage className="w-4 h-4 mr-1" />
                                        Ảnh giấy đăng ký xe (Cà vẹt)
                                    </label>
                                    <div className="relative border-2 border-orange-200 rounded-lg overflow-hidden bg-white">
                                        <img
                                            src={registrationImageUrl}
                                            alt="Registration"
                                            className="w-full h-48 object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Vehicle Photo Preview */}
                            {(vehiclePhotoPreview || photoUrl) && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                                        <Car className="w-4 h-4 mr-1" />
                                        Ảnh xe
                                    </label>
                                    <div className="relative border-2 border-orange-200 rounded-lg overflow-hidden bg-white">
                                        <img
                                            src={vehiclePhotoPreview || photoUrl}
                                            alt="Vehicle"
                                            className="w-full h-48 object-cover"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Scan Result Summary */}
                    {scanResult && scanResult.confidence > 0 && (
                        <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                            <p className="text-sm font-medium text-green-700 mb-2">
                                📋 Thông tin đã trích xuất từ ảnh cà vẹt:
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {scanResult.vin && (
                                    <div>
                                        <span className="text-gray-600">VIN:</span>{" "}
                                        <span className="font-semibold">{scanResult.vin}</span>
                                    </div>
                                )}
                                {scanResult.plate && (
                                    <div>
                                        <span className="text-gray-600">Biển số:</span>{" "}
                                        <span className="font-semibold">{scanResult.plate}</span>
                                    </div>
                                )}
                                {scanResult.brand && (
                                    <div>
                                        <span className="text-gray-600">Hãng xe:</span>{" "}
                                        <span className="font-semibold">{scanResult.brand}</span>
                                    </div>
                                )}
                                {scanResult.vehicleModel && (
                                    <div>
                                        <span className="text-gray-600">Model:</span>{" "}
                                        <span className="font-semibold">{scanResult.vehicleModel}</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 italic">
                                💡 Vui lòng kiểm tra và chỉnh sửa nếu thông tin không chính xác
                            </p>
                        </div>
                    )}

                    {/* VIN */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t("driver.vin")} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={vin}
                            onChange={(e) => setVin(e.target.value)}
                            placeholder={t("driver.enterVin")}
                            required
                            disabled={isEdit}
                            className={autoFilledFields.has("vin") ? "bg-yellow-50 border-yellow-400" : ""}
                        />
                        {autoFilledFields.has("vin") && (
                            <p className="text-xs text-yellow-600 mt-1">✨ Tự động điền từ ảnh cà vẹt</p>
                        )}
                    </div>

                    {/* Biển số */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t("driver.plate")} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={plate}
                            onChange={(e) => setPlate(e.target.value)}
                            placeholder={t("driver.enterPlate")}
                            required
                            className={autoFilledFields.has("plate") ? "bg-yellow-50 border-yellow-400" : ""}
                        />
                        {autoFilledFields.has("plate") && (
                            <p className="text-xs text-yellow-600 mt-1">✨ Tự động điền từ ảnh cà vẹt</p>
                        )}
                    </div>

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t("driver.vehicleModel")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            className={`border rounded p-2 w-full ${
                                autoFilledFields.has("vehicleModelId") ? "bg-yellow-50 border-yellow-400" : ""
                            }`}
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
                        {autoFilledFields.has("vehicleModelId") && (
                            <p className="text-xs text-yellow-600 mt-1">✨ Tự động chọn từ ảnh cà vẹt</p>
                        )}
                        {scanResult?.brand && scanResult?.vehicleModel && !autoFilledFields.has("vehicleModelId") && (
                            <p className="text-xs text-orange-600 mt-1">
                                ⚠️ Không tìm thấy "{scanResult.brand} {scanResult.vehicleModel}" trong danh sách. 
                                Vui lòng chọn thủ công.
                            </p>
                        )}
                    </div>

                    {/* Ảnh xe - Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {t("driver.vehiclePhoto")} <span className="text-red-500">*</span>
                        </label>
                        
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
                                    placeholder="https://... (URL ảnh xe)"
                                    type="url"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Hoặc nhập URL ảnh xe đã upload lên storage
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Ảnh cà vẹt (Registration Photo) - Hidden if already have */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Ảnh giấy đăng ký xe (cà vẹt) <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={registrationPhotoUrl}
                            onChange={(e) => setRegistrationPhotoUrl(e.target.value)}
                            placeholder="https://... (URL ảnh cà vẹt xe)"
                            required
                            type="url"
                            className={autoFilledFields.has("registrationPhotoUrl") ? "bg-yellow-50 border-yellow-400" : ""}
                        />
                        {autoFilledFields.has("registrationPhotoUrl") ? (
                            <p className="text-xs text-green-600 mt-1">✅ Đã có từ bước quét ảnh</p>
                        ) : (
                            <p className="text-xs text-gray-500 mt-1">
                                Cần cung cấp URL ảnh cà vẹt xe đã upload lên storage
                            </p>
                        )}
                    </div>

                    {/* Nút */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onCancel}
                            className="flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t("driver.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            className="bg-orange-500 text-white hover:bg-orange-600"
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

