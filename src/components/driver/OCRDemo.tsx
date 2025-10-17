import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Camera, Upload, FileImage, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { vehicleService, VehicleRegistrationScanResult } from "../../services/vehicleService";
import { showError, showSuccess } from "../ui/alert";

export default function OCRDemo() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [ocrResult, setOcrResult] = useState<VehicleRegistrationScanResult | null>(null);
    const [imageUrl, setImageUrl] = useState("");

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const cameraInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            showError("Vui lòng chọn file ảnh hợp lệ");
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            showError("Kích thước file không được vượt quá 10MB");
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const scanImage = async () => {
        if (!selectedFile) {
            showError("Vui lòng chọn ảnh cà vẹt xe trước khi quét");
            return;
        }

        setIsScanning(true);
        try {
            const result = await vehicleService.scanRegistration(selectedFile);
            setOcrResult(result);

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

    const scanFromUrl = async () => {
        if (!imageUrl.trim()) {
            showError("Vui lòng nhập URL ảnh");
            return;
        }

        setIsScanning(true);
        try {
            const result = await vehicleService.scanRegistrationFromUrl(imageUrl);
            setOcrResult(result);

            if (result.errorMessage) {
                showError(`Lỗi quét ảnh: ${result.errorMessage}`);
            } else {
                showSuccess(`Quét thành công! Độ tin cậy: ${result.confidence.toFixed(1)}%`);
            }
        } catch (error: any) {
            console.error("OCR Error:", error);
            const errorMsg = error.response?.data?.error?.message || "Lỗi khi quét ảnh từ URL";
            showError(errorMsg);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card className="border border-blue-500 rounded-lg">
                <CardHeader>
                    <CardTitle className="text-blue-500 font-bold flex items-center">
                        <FileImage className="w-6 h-6 mr-2" />
                        Demo OCR - Quét ảnh cà vẹt xe
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* File Upload Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Tải lên ảnh cà vẹt xe</h3>
                        <div className="flex space-x-2 mb-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => cameraInputRef.current?.click()}
                                className="flex items-center space-x-2"
                            >
                                <Camera className="w-4 h-4" />
                                <span>Chụp ảnh</span>
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center space-x-2"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Chọn file</span>
                            </Button>
                        </div>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                            className="hidden"
                        />
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleCameraCapture}
                            className="hidden"
                        />

                        {previewUrl && (
                            <div className="mt-4">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-64 h-48 object-cover rounded border"
                                />
                                <Button
                                    type="button"
                                    onClick={scanImage}
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

                    {/* URL Scan Section */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-3">Hoặc quét từ URL</h3>
                        <div className="flex space-x-2">
                            <Input
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="Nhập URL ảnh cà vẹt xe..."
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                onClick={scanFromUrl}
                                disabled={isScanning || !imageUrl.trim()}
                                className="bg-blue-500 text-white hover:bg-blue-600"
                            >
                                {isScanning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Quét...
                                    </>
                                ) : (
                                    "Quét từ URL"
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* OCR Results */}
                    {ocrResult && (
                        <div className="bg-white p-4 rounded border">
                            <h3 className="font-semibold mb-3 flex items-center">
                                {ocrResult.errorMessage ? (
                                    <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                                )}
                                Kết quả quét OCR
                            </h3>
                            
                            {ocrResult.errorMessage ? (
                                <p className="text-red-600">{ocrResult.errorMessage}</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p><strong>VIN:</strong> {ocrResult.vin || "Không tìm thấy"}</p>
                                        <p><strong>Biển số:</strong> {ocrResult.plate || "Không tìm thấy"}</p>
                                        <p><strong>Hãng:</strong> {ocrResult.brand || "Không tìm thấy"}</p>
                                        <p><strong>Model:</strong> {ocrResult.vehicleModel || "Không tìm thấy"}</p>
                                        <p><strong>Độ tin cậy:</strong> {ocrResult.confidence.toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Dữ liệu thô:</h4>
                                        <div className="bg-gray-100 p-2 rounded text-xs max-h-32 overflow-y-auto">
                                            {Object.entries(ocrResult.rawData).map(([key, value]) => (
                                                <div key={key}>
                                                    <strong>{key}:</strong> {value}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
