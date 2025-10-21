import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  Battery, 
  AlertTriangle, 
  Plus, 
  RefreshCw, 
  Bell, 
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  Package,
  Truck,
  FileText,
  X
} from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface PinInventory {
  id: string;
  serial: string;
  model: string;
  capacity: number;
  voltage: number;
  health: number;
  temperature: number;
  cycles: number;
  status: number; // 0: empty, 1: charging, 2: full, 3: maintenance
  slot: string;
  lastSwap: string;
}

interface InventoryRequest {
  id: string;
  stationId: string;
  stationName: string;
  requestedBy: string;
  requestedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  currentCount: number;
  requestedCount: number;
  reason: string;
  notes?: string;
}

interface StaffInventoryMonitoringProps {
  stationId?: string;
  stationName?: string;
}

export function StaffInventoryMonitoring({ 
  stationId = "station-001",
  stationName = "Trạm Trung Tâm"
}: StaffInventoryMonitoringProps) {
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<PinInventory[]>([]);
  const [requests, setRequests] = useState<InventoryRequest[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isAddingPinDialogOpen, setIsAddingPinDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(15);
  const [criticalStockThreshold, setCriticalStockThreshold] = useState(10);

  // Form states for new request
  const [requestForm, setRequestForm] = useState({
    requestedCount: 20,
    reason: 'low_stock',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  // Form states for adding pin
  const [pinForm, setPinForm] = useState({
    serial: '',
    model: '',
    capacity: '',
    voltage: '',
    health: '',
    cycles: '',
    slot: ''
  });

  // Mock data initialization
  useEffect(() => {
    // Simulate inventory data
    const mockInventory: PinInventory[] = [
      {
        id: 'pin-1',
        serial: 'TESLA-S-2024-001',
        model: 'Tesla Model 3 Battery',
        capacity: 100,
        voltage: 400,
        health: 95,
        temperature: 25,
        cycles: 150,
        status: 2,
        slot: 'A1',
        lastSwap: '2024-01-15'
      },
      {
        id: 'pin-2',
        serial: 'BYD-S-2024-002',
        model: 'BYD Blade Battery',
        capacity: 120,
        voltage: 350,
        health: 88,
        temperature: 28,
        status: 2,
        cycles: 200,
        slot: 'A2',
        lastSwap: '2024-01-14'
      },
      {
        id: 'pin-3',
        serial: 'VINFAST-S-2024-003',
        model: 'VinFast VF8 Battery',
        capacity: 90,
        voltage: 380,
        health: 92,
        temperature: 26,
        status: 1,
        cycles: 100,
        slot: 'A3',
        lastSwap: '2024-01-13'
      },
      {
        id: 'pin-4',
        serial: 'TESLA-S-2024-004',
        model: 'Tesla Model Y Battery',
        capacity: 110,
        voltage: 420,
        health: 78,
        temperature: 32,
        status: 3,
        cycles: 800,
        slot: 'A4',
        lastSwap: '2024-01-12'
      },
      {
        id: 'pin-5',
        serial: 'BYD-S-2024-005',
        model: 'BYD Dolphin Battery',
        capacity: 95,
        voltage: 360,
        health: 85,
        temperature: 29,
        status: 2,
        cycles: 300,
        slot: 'A5',
        lastSwap: '2024-01-11'
      }
    ];

    setInventory(mockInventory);

    // Simulate existing requests
    const mockRequests: InventoryRequest[] = [
      {
        id: 'req-1',
        stationId: 'station-001',
        stationName: 'Trạm Trung Tâm',
        requestedBy: 'Nguyễn Văn A',
        requestedAt: '2024-01-15T10:30:00Z',
        priority: 'high',
        status: 'pending',
        currentCount: 8,
        requestedCount: 20,
        reason: 'low_stock',
        notes: 'Số lượng pin đang ở mức thấp, cần bổ sung gấp'
      },
      {
        id: 'req-2',
        stationId: 'station-002',
        stationName: 'Trạm Mall',
        requestedBy: 'Trần Thị B',
        requestedAt: '2024-01-14T14:20:00Z',
        priority: 'urgent',
        status: 'approved',
        currentCount: 5,
        requestedCount: 25,
        reason: 'critical_stock',
        notes: 'Tình trạng khẩn cấp, chỉ còn 5 pin'
      }
    ];

    setRequests(mockRequests);
  }, []);

  // Calculate inventory statistics
  const inventoryStats = {
    total: inventory.length,
    available: inventory.filter(pin => pin.status === 2).length,
    charging: inventory.filter(pin => pin.status === 1).length,
    maintenance: inventory.filter(pin => pin.status === 3).length,
    empty: inventory.filter(pin => pin.status === 0).length,
    lowStock: inventory.length < lowStockThreshold,
    criticalStock: inventory.length < criticalStockThreshold
  };

  // Check if auto-request should be triggered
  useEffect(() => {
    if (inventoryStats.criticalStock && !requests.some(req => req.status === 'pending' && req.stationId === stationId)) {
      // Auto-create urgent request
      const autoRequest: InventoryRequest = {
        id: `auto-req-${Date.now()}`,
        stationId,
        stationName,
        requestedBy: 'Hệ thống tự động',
        requestedAt: new Date().toISOString(),
        priority: 'urgent',
        status: 'pending',
        currentCount: inventoryStats.total,
        requestedCount: 30,
        reason: 'critical_stock',
        notes: `Tự động tạo yêu cầu do số lượng pin chỉ còn ${inventoryStats.total} (dưới ngưỡng ${criticalStockThreshold})`
      };
      setRequests(prev => [...prev, autoRequest]);
    }
  }, [inventoryStats.total, criticalStockThreshold, stationId, stationName, requests]);

  const handleCreateRequest = () => {
    const newRequest: InventoryRequest = {
      id: `req-${Date.now()}`,
      stationId,
      stationName,
      requestedBy: 'Admin',
      requestedAt: new Date().toISOString(),
      priority: requestForm.priority,
      status: 'pending',
      currentCount: inventoryStats.total,
      requestedCount: requestForm.requestedCount,
      reason: requestForm.reason,
      notes: requestForm.notes
    };

    setRequests(prev => [...prev, newRequest]);
    setIsRequestDialogOpen(false);
    
    // Reset form
    setRequestForm({
      requestedCount: 20,
      reason: 'low_stock',
      notes: '',
      priority: 'medium'
    });
  };

  const handleApproveRequest = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved' as const }
          : req
      )
    );
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected' as const }
          : req
      )
    );
  };

  const handleFulfillRequest = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'fulfilled' as const }
          : req
      )
    );
  };

  const handleAddPin = () => {
    const newPin: PinInventory = {
      id: `pin-${Date.now()}`,
      serial: pinForm.serial,
      model: pinForm.model,
      capacity: parseInt(pinForm.capacity),
      voltage: parseInt(pinForm.voltage),
      health: parseInt(pinForm.health),
      temperature: 25,
      cycles: parseInt(pinForm.cycles),
      status: 2,
      slot: pinForm.slot,
      lastSwap: new Date().toISOString().split('T')[0]
    };

    setInventory(prev => [...prev, newPin]);
    setIsAddingPinDialogOpen(false);
    
    // Reset form
    setPinForm({
      serial: '',
      model: '',
      capacity: '',
      voltage: '',
      health: '',
      cycles: '',
      slot: ''
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPinStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-gray-500';
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-green-500';
      case 3: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPinStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Trống';
      case 1: return 'Sạc';
      case 2: return 'Đầy';
      case 3: return 'Bảo trì';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-orange-600">
            Giám Sát Kho Pin
          </h2>
          <p className="text-gray-600">Quản lý tồn kho và yêu cầu bổ sung pin</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setIsRequestDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo Yêu Cầu
          </Button>
          <Button 
            size="sm" 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => setIsAddingPinDialogOpen(true)}
          >
            <Package className="w-4 h-4 mr-2" />
            Thêm Pin
          </Button>
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-blue-200 rounded-lg bg-blue-50">
          <CardContent className="p-4 text-center">
            <Battery className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{inventoryStats.total}</p>
            <p className="text-sm text-blue-700">Tổng số pin</p>
          </CardContent>
        </Card>

        <Card className="border border-green-200 rounded-lg bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{inventoryStats.available}</p>
            <p className="text-sm text-green-700">Sẵn sàng</p>
          </CardContent>
        </Card>

        <Card className="border border-yellow-200 rounded-lg bg-yellow-50">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{inventoryStats.charging}</p>
            <p className="text-sm text-yellow-700">Đang sạc</p>
          </CardContent>
        </Card>

        <Card className={`border rounded-lg ${inventoryStats.criticalStock ? 'border-red-200 bg-red-50' : inventoryStats.lowStock ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${inventoryStats.criticalStock ? 'text-red-600' : inventoryStats.lowStock ? 'text-orange-600' : 'text-gray-600'}`} />
            <p className={`text-2xl font-bold ${inventoryStats.criticalStock ? 'text-red-600' : inventoryStats.lowStock ? 'text-orange-600' : 'text-gray-600'}`}>
              {inventoryStats.maintenance}
            </p>
            <p className={`text-sm ${inventoryStats.criticalStock ? 'text-red-700' : inventoryStats.lowStock ? 'text-orange-700' : 'text-gray-700'}`}>
              {inventoryStats.criticalStock ? 'Khẩn cấp!' : inventoryStats.lowStock ? 'Thấp' : 'Bảo trì'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Level Indicator */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center">
            <TrendingDown className="w-5 h-5 mr-2" />
            Mức Tồn Kho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tổng số pin hiện tại: {inventoryStats.total}</span>
              <span className="text-sm text-gray-500">Ngưỡng cảnh báo: {lowStockThreshold}</span>
            </div>
            <Progress 
              value={(inventoryStats.total / (lowStockThreshold * 2)) * 100} 
              className={`h-3 ${inventoryStats.criticalStock ? 'bg-red-100 [&>div]:bg-red-500' : inventoryStats.lowStock ? 'bg-orange-100 [&>div]:bg-orange-500' : 'bg-green-100 [&>div]:bg-green-500'}`}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>{lowStockThreshold}</span>
              <span>{lowStockThreshold * 2}</span>
            </div>
            {inventoryStats.criticalStock && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Cảnh báo khẩn cấp!</span>
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Số lượng pin đã xuống dưới ngưỡng khẩn cấp ({criticalStockThreshold}). 
                  Hệ thống đã tự động tạo yêu cầu bổ sung.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Current Inventory */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Tồn Kho Hiện Tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((pin) => (
              <div key={pin.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-800">Slot {pin.slot}</h3>
                    <p className="text-sm text-gray-500">{pin.model}</p>
                    <p className="text-xs text-gray-400 font-mono">{pin.serial}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getPinStatusColor(pin.status)}`}></div>
                    <Badge variant="secondary" className="text-xs">
                      {getPinStatusText(pin.status)}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Sức khỏe:</span>
                    <span className={`font-medium ${pin.health >= 90 ? 'text-green-600' : pin.health >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {pin.health}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Điện áp:</span>
                    <span className="font-medium">{pin.voltage}V</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chu kỳ:</span>
                    <span className="font-medium">{pin.cycles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nhiệt độ:</span>
                    <span className={`font-medium ${pin.temperature > 45 ? 'text-red-600' : ''}`}>
                      {pin.temperature}°C
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Progress 
                    value={pin.health} 
                    className={`h-2 ${pin.health >= 90 ? 'bg-green-100 [&>div]:bg-green-500' : pin.health >= 70 ? 'bg-yellow-100 [&>div]:bg-yellow-500' : 'bg-red-100 [&>div]:bg-red-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-orange-600 mb-2">
              📝 Tạo Yêu Cầu Bổ Sung Pin
            </DialogTitle>
            <p className="text-gray-600">Tạo yêu cầu bổ sung pin cho trạm</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">Thông Tin Trạm</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Trạm:</span>
                  <p className="font-medium">{stationName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tồn kho hiện tại:</span>
                  <p className="font-medium">{inventoryStats.total} pin</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="requestedCount" className="text-sm font-medium text-gray-700">
                  Số lượng yêu cầu *
                </Label>
                <Input
                  id="requestedCount"
                  type="number"
                  value={requestForm.requestedCount}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, requestedCount: parseInt(e.target.value) }))}
                  className="w-full"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Mức độ ưu tiên *
                </Label>
                <Select value={requestForm.priority} onValueChange={(value: any) => setRequestForm(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                    <SelectItem value="urgent">Khẩn cấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
                  Lý do *
                </Label>
                <Select value={requestForm.reason} onValueChange={(value) => setRequestForm(prev => ({ ...prev, reason: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_stock">Tồn kho thấp</SelectItem>
                    <SelectItem value="critical_stock">Tồn kho khẩn cấp</SelectItem>
                    <SelectItem value="maintenance">Bảo trì định kỳ</SelectItem>
                    <SelectItem value="expansion">Mở rộng trạm</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Ghi chú
                </Label>
                <Textarea
                  id="notes"
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full"
                  rows={3}
                  placeholder="Thêm ghi chú về yêu cầu..."
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsRequestDialogOpen(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={handleCreateRequest}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              ✅ Tạo Yêu Cầu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pin Dialog */}
      <Dialog open={isAddingPinDialogOpen} onOpenChange={setIsAddingPinDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-green-600 mb-2">
              🔋 Thêm Pin Mới
            </DialogTitle>
            <p className="text-gray-600">Thêm pin mới vào kho</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serial" className="text-sm font-medium text-gray-700">
                  Serial Number *
                </Label>
                <Input
                  id="serial"
                  value={pinForm.serial}
                  onChange={(e) => setPinForm(prev => ({ ...prev, serial: e.target.value }))}
                  className="w-full"
                  placeholder="VD: TESLA-S-2024-001"
                />
              </div>
              <div>
                <Label htmlFor="model" className="text-sm font-medium text-gray-700">
                  Model *
                </Label>
                <Input
                  id="model"
                  value={pinForm.model}
                  onChange={(e) => setPinForm(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full"
                  placeholder="VD: Tesla Model 3 Battery"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">
                  Dung lượng (Ah) *
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  value={pinForm.capacity}
                  onChange={(e) => setPinForm(prev => ({ ...prev, capacity: e.target.value }))}
                  className="w-full"
                  placeholder="VD: 100"
                />
              </div>
              <div>
                <Label htmlFor="voltage" className="text-sm font-medium text-gray-700">
                  Điện áp (V) *
                </Label>
                <Input
                  id="voltage"
                  type="number"
                  value={pinForm.voltage}
                  onChange={(e) => setPinForm(prev => ({ ...prev, voltage: e.target.value }))}
                  className="w-full"
                  placeholder="VD: 400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="health" className="text-sm font-medium text-gray-700">
                  Sức khỏe (%) *
                </Label>
                <Input
                  id="health"
                  type="number"
                  value={pinForm.health}
                  onChange={(e) => setPinForm(prev => ({ ...prev, health: e.target.value }))}
                  className="w-full"
                  placeholder="VD: 95"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <Label htmlFor="cycles" className="text-sm font-medium text-gray-700">
                  Chu kỳ *
                </Label>
                <Input
                  id="cycles"
                  type="number"
                  value={pinForm.cycles}
                  onChange={(e) => setPinForm(prev => ({ ...prev, cycles: e.target.value }))}
                  className="w-full"
                  placeholder="VD: 150"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="slot" className="text-sm font-medium text-gray-700">
                Slot *
              </Label>
              <Input
                id="slot"
                value={pinForm.slot}
                onChange={(e) => setPinForm(prev => ({ ...prev, slot: e.target.value }))}
                className="w-full"
                placeholder="VD: A6"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsAddingPinDialogOpen(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={handleAddPin}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 shadow-lg"
            >
              <Package className="w-5 h-5 mr-2" />
              ✅ Thêm Pin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
