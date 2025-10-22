import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "../LanguageContext";
import { showError, showSuccess } from "../ui/alert";
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { vehicleService, VehicleModel, VehicleRegistrationScanResult } from "../../services/vehicleService";

interface VehicleFormWithOCRProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
    initialData?: any;
    isEdit?: boolean;
    onSuccess?: (msg: string) => void;
}

export default function VehicleFormWithOCR({
    onSubmit,
    onCancel,
    initialData,
    isEdit = false,
    onSuccess,
}: VehicleFormWithOCRProps) {
    const { t } = useLanguage();

    const registrationFileInputRef = useRef<HTMLInputElement>(null);
    const vehicleFileInputRef = useRef<HTMLInputElement>(null);

    const [vin, setVin] = useState(initialData?.vin || "");
    const [plate, setPlate] = useState(initialData?.plate || "");
    const [vehicleModelId, setVehicleModelId] = useState(initialData?.vehicleModelId || "");
    const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
    const [registrationPhoto, setRegistrationPhoto] = useState<File | null>(null);

    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
    const [registrationPhotoPreview, setRegistrationPhotoPreview] = useState<string | null>(initialData?.registrationPhotoUrl || null);

    const [isScanning, setIsScanning] = useState(false);
    const [ocrResult, setOcrResult] = useState<VehicleRegistrationScanResult | null>(null);
    const [showOcrResult, setShowOcrResult] = useState(false);

    const [models, setModels] = useState<VehicleModel[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            try {
                const models = await vehicleService.getVehicleModels(true);
                setModels(models);
            } catch (error) {
                console.error("Error loading vehicle models:", error);

                showError(t("driver.cannotLoadModels"), t("driver.errorAddCar"));
            }
        };
        loadModels();
    }, [t]);

    const handleFileSelect = (file: File, type: 'vehicle' | 'registration') => {
        if (!file.type.startsWith('image/')) {

            showError("Vui lòng chọn file ảnh hợp lệ", t("driver.errorAddCar"));
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB

            showError("Kích thước file không được vượt quá 10MB", t("driver.errorAddCar"));
            return;
        }

        const reader = new FileReader();
        if (type === 'vehicle') {
            setVehiclePhoto(file);
            reader.onload = (e) => setVehiclePhotoPreview(e.target?.result as string);
        } else {
            setRegistrationPhoto(file);
            reader.onload = (e) => setRegistrationPhotoPreview(e.target?.result as string);
        }
        reader.readAsDataURL(file);
    };

    const scanRegistrationImage = async () => {
        if (!registrationPhoto) {
            // ✨ SỬA: Thêm tham số title
            showError("Vui lòng chọn ảnh cà vẹt xe trước khi quét", t("driver.errorAddCar"));
            return;
        }
        setIsScanning(true);
        try {
            const result = await vehicleService.scanRegistration(registrationPhoto);
            setOcrResult(result);
            setShowOcrResult(true);
            if (result.vin) setVin(result.vin);
            if (result.plate) setPlate(result.plate);

            if (result.brand && result.vehicleModel) {
                const matchedModel = models.find(m =>
                    m.brand.toLowerCase() === result.brand?.toLowerCase() &&
                    (m.name.toLowerCase().includes(result.vehicleModel?.toLowerCase() || '') ||
                        m.fullName.toLowerCase().includes(result.vehicleModel?.toLowerCase() || ''))
                );
                if (matchedModel) {
                    setVehicleModelId(matchedModel.id);
                    showSuccess(`Đã tự động chọn model: ${matchedModel.fullName}`);
                } else {
                    // ✨ SỬA: Thêm tham số title
                    showError(`Không tìm thấy model "${result.vehicleModel}" của hãng "${result.brand}". Vui lòng chọn model phù hợp từ danh sách.`, t("driver.errorAddCar"));
                }
            }

            if (result.errorMessage) {
                // ✨ SỬA: Thêm tham số title
                showError(`Lỗi quét ảnh: ${result.errorMessage}`, t("driver.errorAddCar"));
            } else {
                showSuccess(`Quét thành công! Độ tin cậy: ${result.confidence.toFixed(1)}%`);
            }
        } catch (error: any) {
            console.error("OCR Error:", error);
            const errorMsg = error.response?.data?.error?.message || "Lỗi khi quét ảnh cà vẹt xe";
            // ✨ SỬA: Thêm tham số title
            showError(errorMsg, t("driver.errorAddCar"));
        } finally {
            setIsScanning(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEdit && (!vehiclePhoto || !registrationPhoto)) {
            // ✨ SỬA: Thêm tham số title
            showError("Khi tạo xe mới, vui lòng chọn đầy đủ ảnh xe và ảnh cà vẹt xe", t("driver.errorAddCar"));
            return;
        }

        if (!isEdit && !vehiclePhoto) {
            // ✨ SỬA: Thêm tham số title
            showError("Vui lòng cung cấp ảnh xe", t("driver.errorAddCar"));
            return;
        }

        const formData = new FormData();
        formData.append('Vin', vin.trim());
        formData.append('Plate', plate.trim());
        formData.append('VehicleModelId', vehicleModelId);

        if (vehiclePhoto) {
            formData.append('Photo', vehiclePhoto);
        }

        if (!isEdit && registrationPhoto) {
            formData.append('RegistrationPhoto', registrationPhoto);
        }

        try {
            setLoading(true);
            await onSubmit(formData);
            const msg = isEdit ? t("driver.vehicleUpdated") : t("driver.vehicleAdded");
            onSuccess?.(msg);
        } catch (err: any) {
            console.error("Lỗi khi gửi form:", err);
            const msg = err.response?.data?.error?.message || t("driver.cannotConnectServer");
            // ✨ SỬA: Thêm tham số title
            await showError(msg, t("driver.errorAddCar"));
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

            <CardContent className="space-y-6">
                {!isEdit && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                            <FileImage className="w-5 h-5 mr-2" />
                            Quét ảnh cà vẹt xe để điền tự động thông tin
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Ảnh cà vẹt xe (bắt buộc)</label>
                                <div className="flex space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => registrationFileInputRef.current?.click()}
                                        className="flex items-center space-x-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        <span>Chọn file</span>
                                    </Button>
                                </div>

                                <input
                                    ref={registrationFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file, 'registration');
                                    }}
                                    className="hidden"
                                />

                                {registrationPhotoPreview && (
                                    <div className="mt-2">

                                        <div className="relative inline-block overflow-hidden rounded border">

                                            <img
                                                src={registrationPhotoPreview}
                                                alt="Registration preview"
                                                className="w-32 h-24 object-cover filter blur-sm"
                                            />

                                            <img
                                                src="src/assets/logoEV2.png"
                                                alt="Logo"
                                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 object-contain opacity-75"
                                            />
                                        </div>

                                        <Button type="button" onClick={scanRegistrationImage} disabled={isScanning} className="mt-2 bg-blue-500 text-white hover:bg-blue-600">
                                            {isScanning ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang quét...</>
                                            ) : (
                                                <><FileImage className="w-4 h-4 mr-2" /> Quét thông tin</>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            {showOcrResult && ocrResult && (
                                <div className="bg-white p-3 rounded border">
                                    {/* ... Code hiển thị kết quả OCR giữ nguyên ... */}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isEdit && registrationPhotoPreview && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Ảnh cà vẹt xe (không thể thay đổi)</label>

                        <div className="relative inline-block overflow-hidden rounded border">
                            <img
                                src={registrationPhotoPreview}
                                alt="Registration preview"
                                className="w-32 h-24 object-cover filter blur-sm"
                            />
                            <img
                                src="src/assets/logoEV2.png"
                                alt="Logo"
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 object-contain opacity-75"
                            />
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.vin")}</label>
                        <Input value={vin} onChange={(e) => setVin(e.target.value)} placeholder={t("driver.enterVin")} required disabled={isEdit} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.plate")}</label>
                        <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder={t("driver.enterPlate")} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.vehicleModel")}</label>
                        <select className="border rounded p-2 w-full" value={vehicleModelId} onChange={(e) => setVehicleModelId(e.target.value)} disabled={isEdit} required>
                            <option value="">{t("driver.selectVehicleModel")}</option>
                            {models.map((m) => (
                                <option key={m.id} value={m.id}>{m.fullName} ({m.brand})</option>
                            ))}
                        </select>
                        {/* ... code hiển thị cảnh báo OCR giữ nguyên ... */}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {isEdit ? "Thay đổi ảnh xe của bạn (tùy chọn)" : "Ảnh xe của bạn (bắt buộc)"}
                        </label>
                        <div className="flex space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => vehicleFileInputRef.current?.click()}
                                className="flex items-center space-x-2"
                            >
                                <Upload className="w-4 h-4" />
                                <span>{isEdit ? "Chọn file mới" : "Chọn file"}</span>
                            </Button>
                        </div>

                        <input
                            ref={vehicleFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file, 'vehicle');
                            }}
                            className="hidden"
                        />

                        {vehiclePhotoPreview && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Ảnh hiện tại:</p>
                                <img
                                    src={vehiclePhotoPreview}
                                    alt="Vehicle preview"
                                    className="w-32 h-24 object-cover rounded border"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={onCancel}>{t("driver.cancel")}</Button>
                        <Button type="submit" className="bg-orange-500 text-white" disabled={loading}>
                            {loading ? t("driver.processing") : isEdit ? t("driver.save") : t("driver.create")}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}