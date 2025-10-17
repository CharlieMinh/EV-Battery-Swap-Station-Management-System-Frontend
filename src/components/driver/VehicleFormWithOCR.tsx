import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "../LanguageContext";
import { showError, showSuccess } from "../ui/alert";
import { Camera, Upload, FileImage, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
    const registrationCameraInputRef = useRef<HTMLInputElement>(null);
    const vehicleFileInputRef = useRef<HTMLInputElement>(null);
    const vehicleCameraInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [vin, setVin] = useState(initialData?.vin || "");
    const [plate, setPlate] = useState(initialData?.plate || "");
    const [vehicleModelId, setVehicleModelId] = useState(initialData?.vehicleModelId || "");
    const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
    const [registrationPhoto, setRegistrationPhoto] = useState<File | null>(null);
    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
    const [registrationPhotoPreview, setRegistrationPhotoPreview] = useState<string | null>(initialData?.registrationPhotoUrl || null);

    // OCR states
    const [isScanning, setIsScanning] = useState(false);
    const [ocrResult, setOcrResult] = useState<VehicleRegistrationScanResult | null>(null);
    const [showOcrResult, setShowOcrResult] = useState(false);

    // Vehicle models
    const [models, setModels] = useState<VehicleModel[]>([]);
    const [loading, setLoading] = useState(false);

    // Load vehicle models
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

    // Handle file selection
    const handleFileSelect = (file: File, type: 'vehicle' | 'registration') => {
        if (!file.type.startsWith('image/')) {
            showError("Vui lòng chọn file ảnh hợp lệ");
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            showError("Kích thước file không được vượt quá 10MB");
            return;
        }

        if (type === 'vehicle') {
            setVehiclePhoto(file);
            const reader = new FileReader();
            reader.onload = (e) => setVehiclePhotoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setRegistrationPhoto(file);
            const reader = new FileReader();
            reader.onload = (e) => setRegistrationPhotoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Handle camera capture
    const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>, type: 'vehicle' | 'registration') => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileSelect(file, type);
        }
    };

    // Scan registration image
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

            // Auto-fill form if OCR was successful
            if (result.vin) setVin(result.vin);
            if (result.plate) setPlate(result.plate);
            
            // Try to match vehicle model
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

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!vehiclePhoto || !registrationPhoto) {
            showError("Vui lòng chọn đầy đủ ảnh xe và ảnh cà vẹt xe");
            return;
        }

        const formData = new FormData();
        formData.append('Vin', vin.trim());
        formData.append('Plate', plate.trim());
        formData.append('VehicleModelId', vehicleModelId);
        formData.append('Photo', vehiclePhoto);
        formData.append('RegistrationPhoto', registrationPhoto);

        // Debug: Log form data
        console.log('Form Data being sent:');
        console.log('Vin:', vin.trim());
        console.log('Plate:', plate.trim());
        console.log('VehicleModelId:', vehicleModelId);
        console.log('Photo file:', vehiclePhoto);
        console.log('RegistrationPhoto file:', registrationPhoto);
        
        // Debug: Log all FormData entries
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        try {
            setLoading(true);
            await onSubmit(formData);

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

            <CardContent className="space-y-6">
                {/* OCR Section */}
                {!isEdit && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                            <FileImage className="w-5 h-5 mr-2" />
                            Quét ảnh cà vẹt xe để điền tự động thông tin
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Registration Photo Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Ảnh cà vẹt xe (bắt buộc)
                                </label>
                                <div className="flex space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => registrationCameraInputRef.current?.click()}
                                        className="flex items-center space-x-2"
                                    >
                                        <Camera className="w-4 h-4" />
                                        <span>Chụp ảnh</span>
                                    </Button>
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
                                <input
                                    ref={registrationCameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => handleCameraCapture(e, 'registration')}
                                    className="hidden"
                                />

                                {registrationPhotoPreview && (
                                    <div className="mt-2">
                                        <img
                                            src={registrationPhotoPreview}
                                            alt="Registration preview"
                                            className="w-32 h-24 object-cover rounded border"
                                        />
                                        <Button
                                            type="button"
                                            onClick={scanRegistrationImage}
                                            disabled={isScanning}
                                            className="mt-2 bg-blue-500 text-white hover:bg-blue-600"
                                        >
                                            {isScanning ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Đang quét...
                                                </>
                                            ) : (
                                                <>
                                                    <FileImage className="w-4 h-4 mr-2" />
                                                    Quét thông tin
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* OCR Result */}
                            {showOcrResult && ocrResult && (
                                <div className="bg-white p-3 rounded border">
                                    <h4 className="font-medium mb-2 flex items-center">
                                        {ocrResult.errorMessage ? (
                                            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        )}
                                        Kết quả quét OCR
                                    </h4>
                                    
                                    {ocrResult.errorMessage ? (
                                        <p className="text-red-600 text-sm">{ocrResult.errorMessage}</p>
                                    ) : (
                                        <div className="space-y-2 text-sm">
                                            <p><strong>VIN:</strong> {ocrResult.vin || "Không tìm thấy"}</p>
                                            <p><strong>Biển số:</strong> {ocrResult.plate || "Không tìm thấy"}</p>
                                            <p><strong>Hãng:</strong> {ocrResult.brand || "Không tìm thấy"}</p>
                                            <p><strong>Model:</strong> {ocrResult.vehicleModel || "Không tìm thấy"}</p>
                                            <p><strong>Độ tin cậy:</strong> {ocrResult.confidence.toFixed(1)}%</p>
                                            {ocrResult.brand && ocrResult.vehicleModel && (
                                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                                    <p className="text-xs text-yellow-800">
                                                        💡 Hệ thống sẽ tự động chọn model phù hợp nếu có trong danh sách
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
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

                    {/* Plate */}
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("driver.plate")}</label>
                        <Input
                            value={plate}
                            onChange={(e) => setPlate(e.target.value)}
                            placeholder={t("driver.enterPlate")}
                            required
                        />
                    </div>

                    {/* Vehicle Model */}
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
                        {ocrResult && ocrResult.brand && ocrResult.vehicleModel && !vehicleModelId && (
                            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-xs text-red-600">
                                    ⚠️ Không tìm thấy model "{ocrResult.vehicleModel}" của hãng "{ocrResult.brand}". Vui lòng chọn model phù hợp từ danh sách.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Vehicle Photo */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Ảnh xe của bạn (bắt buộc)
                        </label>
                        <div className="flex space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => vehicleCameraInputRef.current?.click()}
                                className="flex items-center space-x-2"
                            >
                                <Camera className="w-4 h-4" />
                                <span>Chụp ảnh</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => vehicleFileInputRef.current?.click()}
                                className="flex items-center space-x-2"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Chọn file</span>
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
                        <input
                            ref={vehicleCameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => handleCameraCapture(e, 'vehicle')}
                            className="hidden"
                        />
                        
                        {vehiclePhotoPreview && (
                            <div className="mt-2">
                                <img
                                    src={vehiclePhotoPreview}
                                    alt="Vehicle preview"
                                    className="w-32 h-24 object-cover rounded border"
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
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
