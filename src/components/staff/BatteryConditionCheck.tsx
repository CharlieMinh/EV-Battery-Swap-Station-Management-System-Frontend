import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Battery,
  Camera,
  FileText
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import staffApi from "../../services/staffApi";

interface BatteryConditionCheckProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (inspectionData: BatteryInspectionData) => void;
  onReject: (reason: string) => void;
  customerInfo?: {
    name: string;
    vehicle: string;
    bookingCode: string;
  };
  batteryId?: string;
  staffId?: string;
  stationId?: number | string;
}

interface BatteryInspectionData {
  batteryId: string;
  repairRequired: boolean;
  repairCost: number;
  repairDescription: string;
  batteryStatus: {
    voltage: number;
    temperature: number;
    capacity: number;
    cycles: number;
    damageLevel: number; 
    connectorStatus: 'good' | 'fair' | 'poor';
    exteriorCondition: 'good' | 'fair' | 'poor';
  };
  notes: string;
  photos: string[];
}

export function BatteryConditionCheck({
  isOpen,
  onClose,
  onApprove,
  customerInfo,
  batteryId,
  staffId,
  stationId
}: BatteryConditionCheckProps) {
  const { t } = useLanguage();
  const [inspectionData, setInspectionData] = useState<BatteryInspectionData>({
    batteryId: batteryId || "BAT-2024-001",
    repairRequired: false,
    repairCost: 0,
    repairDescription: '',
    batteryStatus: {
      voltage: 380,
      temperature: 25,
      capacity: 85,
      cycles: 1250,
      damageLevel: 10,
      connectorStatus: 'good',
      exteriorCondition: 'good'
    },
    notes: '',
    photos: []
  });


  const handleRepairCostChange = (cost: number) => {
    setInspectionData(prev => ({
      ...prev,
      repairCost: cost
    }));
  };

  const handleRepairDescriptionChange = (description: string) => {
    setInspectionData(prev => ({
      ...prev,
      repairDescription: description
    }));
  };

  const handleBatteryStatusChange = (field: keyof BatteryInspectionData['batteryStatus'], value: any) => {
    setInspectionData(prev => ({
      ...prev,
      batteryStatus: {
        ...prev.batteryStatus,
        [field]: value
      }
    }));
  };

  const handleNotesChange = (notes: string) => {
    setInspectionData(prev => ({
      ...prev,
      notes
    }));
  };

  const handleApprove = async () => {
    try {
      console.log('BatteryConditionCheck: Creating inspection for battery:', batteryId);

      if (staffId && stationId) {
        await staffApi.createInspection({
          batteryId: inspectionData.batteryId,
          health: inspectionData.batteryStatus.capacity,
          voltage: inspectionData.batteryStatus.voltage,
          temperature: inspectionData.batteryStatus.temperature,
          notes: inspectionData.notes,
          issues: inspectionData.repairRequired ? [inspectionData.repairDescription] : []
        }, staffId, stationId);

        console.log('BatteryConditionCheck: Inspection created successfully');
      }

      onApprove(inspectionData);
      onClose();
    } catch (error: any) {
      console.error("BatteryConditionCheck: Error creating inspection:", error);
      if (error.response?.status === 401) {
        console.warn('BatteryConditionCheck: Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }

      if (error.response?.status === 403) {
        console.warn('BatteryConditionCheck: Access forbidden for battery inspection');
        alert('Không có quyền thực hiện kiểm tra pin này');
        return;
      }

      alert('Có lỗi xảy ra khi tạo báo cáo kiểm tra pin');
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border border-orange-200 rounded-lg bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-orange-600 text-xl font-bold flex items-center">
            <Battery className="w-5 h-5 mr-2" />
            Kiểm Tra Tình Trạng Pin Trả Về
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            Đánh giá tình trạng pin và báo cáo sửa chữa nếu cần
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="border border-orange-200 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-600">
                📋 Thông Tin Khách Hàng
              </CardTitle>
              <CardDescription>Thông tin chi tiết về khách hàng và xe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Tên khách hàng</Label>
                  <p className="font-semibold text-gray-900 mt-1">{customerInfo?.name || "Alex Chen"}</p>
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Xe</Label>
                  <p className="font-semibold text-gray-900 mt-1">{customerInfo?.vehicle || "Tesla Model 3"}</p>
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Mã đặt lịch</Label>
                  <p className="font-mono text-gray-900 mt-1">{customerInfo?.bookingCode || "SW-2024-001"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Battery Status Parameters */}
          <Card className="border border-orange-200 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-600">
                📊 Thông Số Hiện Trạng Pin
              </CardTitle>
              <CardDescription>Các thông số kỹ thuật và tình trạng pin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Điện áp (V)</Label>
                  <input
                    type="number"
                    value={inspectionData.batteryStatus.voltage}
                    onChange={(e) => handleBatteryStatusChange('voltage', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="380"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Nhiệt độ (°C)</Label>
                  <input
                    type="number"
                    value={inspectionData.batteryStatus.temperature}
                    onChange={(e) => handleBatteryStatusChange('temperature', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Dung lượng (%)</Label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inspectionData.batteryStatus.capacity}
                    onChange={(e) => handleBatteryStatusChange('capacity', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Số chu kỳ</Label>
                  <input
                    type="number"
                    value={inspectionData.batteryStatus.cycles}
                    onChange={(e) => handleBatteryStatusChange('cycles', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="1250"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Độ hư hỏng (%)</Label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inspectionData.batteryStatus.damageLevel}
                    onChange={(e) => handleBatteryStatusChange('damageLevel', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Tình trạng đầu nối</Label>
                  <select
                    value={inspectionData.batteryStatus.connectorStatus}
                    onChange={(e) => handleBatteryStatusChange('connectorStatus', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="good">Tốt</option>
                    <option value="fair">Khá</option>
                    <option value="poor">Kém</option>
                  </select>
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Tình trạng vỏ ngoài</Label>
                  <select
                    value={inspectionData.batteryStatus.exteriorCondition}
                    onChange={(e) => handleBatteryStatusChange('exteriorCondition', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="good">Tốt</option>
                    <option value="fair">Khá</option>
                    <option value="poor">Kém</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repair Information */}
          <Card className="border border-orange-200 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-600">
                🔧 Thông Tin Sửa Chữa
              </CardTitle>
              <CardDescription>Đánh giá và báo cáo sửa chữa nếu cần thiết</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="repairRequired"
                    checked={inspectionData.repairRequired}
                    onChange={(e) => setInspectionData(prev => ({ ...prev, repairRequired: e.target.checked }))}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <Label htmlFor="repairRequired" className="text-sm font-medium text-gray-700">
                    Cần sửa chữa
                  </Label>
                </div>

                {inspectionData.repairRequired && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-red-600 font-medium text-sm">Chi phí sửa chữa (VNĐ)</Label>
                        <input
                          type="number"
                          value={inspectionData.repairCost}
                          onChange={(e) => handleRepairCostChange(Number(e.target.value))}
                          className="w-full mt-1 px-3 py-2 text-sm border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          placeholder="Nhập chi phí sửa chữa"
                        />
                      </div>
                      <div>
                        <Label className="text-red-600 font-medium text-sm">Mô tả sửa chữa</Label>
                        <Textarea
                          value={inspectionData.repairDescription}
                          onChange={(e) => handleRepairDescriptionChange(e.target.value)}
                          className="mt-1 text-sm border-red-300 focus:ring-red-500 focus:border-red-500"
                          rows={3}
                          placeholder="Mô tả chi tiết các hư hỏng cần sửa chữa..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Notes & Documents */}
          <Card className="border border-orange-200 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-600">
                📝 Ghi Chú & Tài Liệu
              </CardTitle>
              <CardDescription>Thêm ghi chú và tài liệu đính kèm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-gray-600 font-medium text-sm">Ghi chú kiểm tra</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú về tình trạng pin, các vấn đề phát hiện..."
                    value={inspectionData.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="mt-1 text-sm border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-gray-600 font-medium text-sm">Tài liệu đính kèm</Label>
                  <div className="flex space-x-3 mt-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Camera className="w-4 h-4" />
                      Chụp ảnh
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Tải lên file
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="px-6 py-2"
            >
              Hủy bỏ
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              onClick={handleApprove}
            >
              Chấp nhận thay pin
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
