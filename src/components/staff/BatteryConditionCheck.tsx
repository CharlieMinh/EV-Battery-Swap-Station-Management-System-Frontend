import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
  stationId?: number;
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
    damageLevel: number; // 0-100%
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
  onReject,
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
      
      // Handle specific error cases
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

        <div className="space-y-4">
          {/* Customer Information */}
          <Card className="border border-orange-100 rounded-lg bg-gray-50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-orange-600 font-bold">
                📋 Thông Tin Khách Hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Tên khách hàng</Label>
                  <p className="font-medium text-sm">{customerInfo?.name || "Alex Chen"}</p>
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Xe</Label>
                  <p className="font-medium text-sm">{customerInfo?.vehicle || "Tesla Model 3"}</p>
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Mã đặt lịch</Label>
                  <p className="font-mono text-sm">{customerInfo?.bookingCode || "SW-2024-001"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Battery Status Parameters */}
          <Card className="border border-orange-100 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-orange-600 font-bold">
                📊 Thông Số Hiện Trạng Pin
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Điện áp (V)</Label>
                  <input
                    type="number"
                    value={inspectionData.batteryStatus.voltage}
                    onChange={(e) => handleBatteryStatusChange('voltage', Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="380"
                  />
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Nhiệt độ (°C)</Label>
                  <input
                    type="number"
                    value={inspectionData.batteryStatus.temperature}
                    onChange={(e) => handleBatteryStatusChange('temperature', Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="25"
                  />
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Dung lượng (%)</Label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inspectionData.batteryStatus.capacity}
                    onChange={(e) => handleBatteryStatusChange('capacity', Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Số chu kỳ</Label>
                  <input
                    type="number"
                    value={inspectionData.batteryStatus.cycles}
                    onChange={(e) => handleBatteryStatusChange('cycles', Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="1250"
                  />
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Độ hư hỏng (%)</Label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={inspectionData.batteryStatus.damageLevel}
                    onChange={(e) => handleBatteryStatusChange('damageLevel', Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Tình trạng đầu nối</Label>
                  <select
                    value={inspectionData.batteryStatus.connectorStatus}
                    onChange={(e) => handleBatteryStatusChange('connectorStatus', e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="good">Tốt</option>
                    <option value="fair">Khá</option>
                    <option value="poor">Kém</option>
                  </select>
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Tình trạng vỏ ngoài</Label>
                  <select
                    value={inspectionData.batteryStatus.exteriorCondition}
                    onChange={(e) => handleBatteryStatusChange('exteriorCondition', e.target.value)}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded"
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
          <Card className="border border-orange-100 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-orange-600 font-bold">
                Thông Tin Sửa Chữa
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="repairRequired"
                    checked={inspectionData.repairRequired}
                    onChange={(e) => setInspectionData(prev => ({ ...prev, repairRequired: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="repairRequired" className="text-sm font-medium">
                    Cần sửa chữa
                  </Label>
                </div>

                {inspectionData.repairRequired && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-red-600 font-medium text-xs">Chi phí sửa chữa (VNĐ)</Label>
                        <input
                          type="number"
                          value={inspectionData.repairCost}
                          onChange={(e) => handleRepairCostChange(Number(e.target.value))}
                          className="w-full mt-1 px-2 py-1 text-sm border border-red-300 rounded"
                          placeholder="Nhập chi phí sửa chữa"
                        />
                      </div>
                      <div>
                        <Label className="text-red-600 font-medium text-xs">Mô tả sửa chữa</Label>
                        <Textarea
                          value={inspectionData.repairDescription}
                          onChange={(e) => handleRepairDescriptionChange(e.target.value)}
                          className="mt-1 text-sm"
                          rows={2}
                          placeholder="Mô tả chi tiết các hư hỏng cần sửa chữa..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes and Documentation */}
          <Card className="border border-orange-100 rounded-lg shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-orange-600 font-bold">
                📝 Ghi Chú & Tài Liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="notes" className="text-orange-600 font-medium text-xs">Ghi chú kiểm tra</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú về tình trạng pin, các vấn đề phát hiện..."
                    value={inspectionData.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="mt-1 text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-orange-600 font-medium text-xs">Tài liệu đính kèm</Label>
                  <div className="flex space-x-2 mt-1">
                    <Button variant="outline" size="sm" className="text-xs px-2 py-1">
                      <Camera className="w-3 h-3 mr-1" />
                      Chụp ảnh
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs px-2 py-1">
                      <FileText className="w-3 h-3 mr-1" />
                      Tải lên file
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs px-3 py-1">
              Hủy bỏ
            </Button>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1" 
              size="sm"
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
