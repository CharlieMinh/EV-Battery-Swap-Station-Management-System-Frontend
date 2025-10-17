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

    // Ref cho các input file (đã bỏ ref cho camera)
    const registrationFileInputRef = useRef<HTMLInputElement>(null);
    const vehicleFileInputRef = useRef<HTMLInputElement>(null);

    // State cho các trường trong form
    const [vin, setVin] = useState(initialData?.vin || "");
    const [plate, setPlate] = useState(initialData?.plate || "");
    const [vehicleModelId, setVehicleModelId] = useState(initialData?.vehicleModelId || "");
    const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
    const [registrationPhoto, setRegistrationPhoto] = useState<File | null>(null);

    // State cho việc hiển thị ảnh xem trước (preview)
    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
    const [registrationPhotoPreview, setRegistrationPhotoPreview] = useState<string | null>(initialData?.registrationPhotoUrl || null);

    // State cho chức năng OCR
    const [isScanning, setIsScanning] = useState(false);
    const [ocrResult, setOcrResult] = useState<VehicleRegistrationScanResult | null>(null);
    const [showOcrResult, setShowOcrResult] = useState(false);

    // State cho danh sách loại xe và trạng thái loading
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [loading, setLoading] = useState(false);

    // Load danh sách loại xe khi component được tạo (giữ nguyên)
    useEffect(() => {
        const loadModels = async () => {
            try {
                const models = await vehicleService.getVehicleModels(true);
                setModels(models);
            } catch (error) {
                console.error("Error loading vehicle models:", error);
                showError(t("driver.cannotLoadModels"));
            }
        };
        loadModels();
    }, [t]);

    // Xử lý khi người dùng chọn file (giữ nguyên)
    const handleFileSelect = (file: File, type: 'vehicle' | 'registration') => {
        if (!file.type.startsWith('image/')) {
            showError("Vui lòng chọn file ảnh hợp lệ");
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB
            showError("Kích thước file không được vượt quá 10MB");
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

    // Xử lý quét ảnh cà vẹt (giữ nguyên)
    const scanRegistrationImage = async () => {
        if (!registrationPhoto) {
            showError("Vui lòng chọn ảnh cà vẹt xe trước khi quét");
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
                    showError(`Không tìm thấy model "${result.vehicleModel}" của hãng "${result.brand}". Vui lòng chọn model phù hợp từ danh sách.`);
                }
            }

            if (result.errorMessage) {
                showError(`Lỗi quét ảnh: ${result.errorMessage}`);
            } else {
                showSuccess(`Quét thành công! Độ tin cậy: ${result.confidence.toFixed(1)}%`);
            }
        } catch (error: any) {
            console.error("OCR Error:", error);
            const errorMsg = error.response?.data?.error?.message || "Lỗi khi quét ảnh cà vẹt xe";
            showError(errorMsg);
        } finally {
            setIsScanning(false);
        }
    };

    // ✨ SỬA: Cập nhật logic submit để phân biệt giữa Tạo mới và Sửa
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation: Chỉ bắt buộc cả 2 ảnh khi tạo mới
        if (!isEdit && (!vehiclePhoto || !registrationPhoto)) {
            showError("Khi tạo xe mới, vui lòng chọn đầy đủ ảnh xe và ảnh cà vẹt xe");
            return;
        }

        // Validation cho ảnh xe khi tạo mới
        if (!isEdit && !vehiclePhoto) {
            showError("Vui lòng cung cấp ảnh xe");
            return;
        }

        const formData = new FormData();
        formData.append('Vin', vin.trim());
        formData.append('Plate', plate.trim());
        formData.append('VehicleModelId', vehicleModelId);

        // 2. FormData: Chỉ thêm file vào FormData nếu người dùng có chọn file mới
        if (vehiclePhoto) {
            formData.append('Photo', vehiclePhoto);
        }

        // Chỉ thêm ảnh cà vẹt khi tạo mới (vì không cho sửa)
        if (!isEdit && registrationPhoto) {
            formData.append('RegistrationPhoto', registrationPhoto);
        }

        try {
            setLoading(true);
            await onSubmit(formData); // Gửi FormData lên component cha
            const msg = isEdit ? t("driver.vehicleUpdated") : t("driver.vehicleAdded");
            onSuccess?.(msg);
        } catch (err: any) {
            console.error("Lỗi khi gửi form:", err);
            const msg = err.response?.data?.error?.message || t("driver.cannotConnectServer");
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

            <CardContent className="space-y-6">
                {/* ✨ SỬA: Chỉ hiện mục OCR khi tạo mới */}
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
                                    {/* 🗑️ XÓA: Đã bỏ nút "Chụp ảnh" */}
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
                                        <img src={registrationPhotoPreview} alt="Registration preview" className="w-32 h-24 object-cover rounded border" />
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

                {/* ✨ SỬA: Hiển thị ảnh cà vẹt ở dạng chỉ xem khi sửa */}
                {isEdit && registrationPhotoPreview && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Ảnh cà vẹt xe (không thể thay đổi)</label>
                        <img
                            src={registrationPhotoPreview}
                            alt="Registration preview"
                            className="w-32 h-24 object-cover rounded border"
                        />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Các input VIN, Plate, Model giữ nguyên */}
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

                    {/* ✨ SỬA: Chỉnh sửa lại khu vực upload ảnh xe */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            {isEdit ? "Thay đổi ảnh xe của bạn (tùy chọn)" : "Ảnh xe của bạn (bắt buộc)"}
                        </label>
                        <div className="flex space-x-2">
                            {/* 🗑️ XÓA: Đã bỏ nút "Chụp ảnh" */}
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