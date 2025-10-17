import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useLanguage } from "../LanguageContext";
import { showError } from "../ui/alert";
import { Upload, Scan, ArrowRight, ArrowLeft } from "lucide-react";
import { scanVehicleRegistration, type ScanResult } from "../../services/vehicleApi";

interface ScanVehicleRegistrationProps {
    onScanSuccess: (scanResult: ScanResult, imageFile: File) => void;
    onBack: () => void;
}

export default function ScanVehicleRegistration({ onScanSuccess, onBack }: ScanVehicleRegistrationProps) {
    const { t } = useLanguage();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setSelectedFile(file);
        setScanResult(null);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Handle scan
    const handleScan = async () => {
        if (!selectedFile) {
            showError("Vui lòng chọn ảnh cà vẹt xe trước");
            return;
        }

        setScanning(true);
        setScanResult(null);

        try {
            const result = await scanVehicleRegistration(selectedFile);
            setScanResult(result);

            if (result.errorMessage) {
                await showError(result.errorMessage);
                return;
            }

            // Validate: Phải có ít nhất VIN hoặc Plate
            if (!result.vin && !result.plate) {
                await showError(
                    "Không thể phát hiện VIN hoặc biển số xe từ ảnh. Vui lòng chụp ảnh rõ hơn hoặc nhập thủ công."
                );
                return;
            }

        } catch (err: any) {
            console.error("Scan failed:", err);
            const msg =
                err.response?.data?.error?.message ||
                "Quét ảnh thất bại. Vui lòng thử lại hoặc chụp ảnh rõ hơn.";
            await showError(msg);
        } finally {
            setScanning(false);
        }
    };

    // Handle continue to form
    const handleContinue = () => {
        if (!scanResult || !selectedFile) return;
        onScanSuccess(scanResult, selectedFile);
    };

    // Handle skip scan (manual input)
    const handleSkipScan = () => {
        onScanSuccess({ confidence: 0 } as ScanResult, null as any);
    };

    return (
        <Card className="border border-orange-500 rounded-lg max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-500 font-bold">
                    <Scan className="w-6 h-6" />
                    <span>Quét ảnh giấy đăng ký xe (Cà vẹt xe)</span>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                    Upload ảnh giấy đăng ký xe để tự động trích xuất thông tin VIN, biển số, và loại xe.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50">
                    <div className="flex flex-col items-center space-y-3">
                        <Upload className="w-12 h-12 text-orange-400" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                Chọn ảnh giấy đăng ký xe
                            </p>
                            <p className="text-xs text-gray-500">
                                Hỗ trợ: JPEG, PNG (Tối đa 10MB)
                            </p>
                        </div>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="registration-upload"
                        />
                        <label htmlFor="registration-upload">
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-white hover:bg-gray-50"
                                onClick={() => document.getElementById("registration-upload")?.click()}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Chọn file
                            </Button>
                        </label>
                    </div>
                </div>

                {/* Preview Image */}
                {previewUrl && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Ảnh đã chọn:
                        </label>
                        <div className="relative border rounded-lg overflow-hidden">
                            <img
                                src={previewUrl}
                                alt="Preview registration"
                                className="w-full h-auto max-h-96 object-contain bg-gray-100"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            File: {selectedFile?.name} ({(selectedFile!.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                    </div>
                )}

                {/* Scan Button */}
                {selectedFile && !scanResult && (
                    <Button
                        type="button"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={handleScan}
                        disabled={scanning}
                    >
                        {scanning ? (
                            <>
                                <Scan className="animate-pulse w-5 h-5 mr-2" />
                                Đang quét...
                            </>
                        ) : (
                            <>
                                <Scan className="w-5 h-5 mr-2" />
                                Quét ảnh cà vẹt
                            </>
                        )}
                    </Button>
                )}

                {/* Scan Result */}
                {scanResult && !scanResult.errorMessage && (
                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold text-green-700">
                                ✅ Quét thành công!
                            </h4>
                            <span className="text-sm text-green-600 font-medium">
                                Độ chính xác: {scanResult.confidence.toFixed(1)}%
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {scanResult.vin && (
                                <div className="p-2 bg-white rounded border border-green-200">
                                    <p className="text-xs text-gray-500 mb-1">VIN / Số khung</p>
                                    <p className="font-semibold text-gray-800">{scanResult.vin}</p>
                                </div>
                            )}
                            {scanResult.plate && (
                                <div className="p-2 bg-white rounded border border-green-200">
                                    <p className="text-xs text-gray-500 mb-1">Biển số xe</p>
                                    <p className="font-semibold text-gray-800">{scanResult.plate}</p>
                                </div>
                            )}
                            {scanResult.brand && (
                                <div className="p-2 bg-white rounded border border-green-200">
                                    <p className="text-xs text-gray-500 mb-1">Hãng xe</p>
                                    <p className="font-semibold text-gray-800">{scanResult.brand}</p>
                                </div>
                            )}
                            {scanResult.vehicleModel && (
                                <div className="p-2 bg-white rounded border border-green-200">
                                    <p className="text-xs text-gray-500 mb-1">Model xe</p>
                                    <p className="font-semibold text-gray-800">{scanResult.vehicleModel}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-start space-x-2 text-xs text-gray-600 bg-white p-2 rounded">
                            <span>💡</span>
                            <p>
                                Thông tin đã được trích xuất. Nhấn "Tiếp tục" để điền thông tin xe.
                                Bạn có thể chỉnh sửa nếu cần.
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        className="flex items-center"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>

                    <div className="flex space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkipScan}
                            className="text-gray-600"
                        >
                            Bỏ qua, nhập thủ công
                        </Button>

                        {scanResult && !scanResult.errorMessage && (
                            <Button
                                type="button"
                                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center"
                                onClick={handleContinue}
                            >
                                Tiếp tục
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

