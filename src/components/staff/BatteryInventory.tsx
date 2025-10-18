import React, { useState, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RefreshCw, Wrench, FileText, Filter, Plus, Battery, Layers, AlertTriangle, Download } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Battery as BatteryType } from "../../services/staffApi";
import staffApi from "../../services/staffApi";

interface BatteryInventoryProps {
  batteries: BatteryType[];
  selectedBattery: string | null;
  onBatterySelect: (batteryId: string) => void;
  onNewInspection: () => void;
  onTakeBattery: (batteryId: string) => void;
}

export function BatteryInventory({
  batteries,
  selectedBattery,
  onBatterySelect,
  onNewInspection,
  onTakeBattery,
}: BatteryInventoryProps) {
  const { t } = useLanguage();
  const [filterBy, setFilterBy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("slot");
  const [isAddingBattery, setIsAddingBattery] = useState(false);
  
  // Form states for adding new battery
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTakeBatteryDialogOpen, setIsTakeBatteryDialogOpen] = useState(false);
  const [selectedBatteryForTaking, setSelectedBatteryForTaking] = useState<BatteryType | null>(null);
  const [batteryForm, setBatteryForm] = useState({
    serial: "",
    batteryModelId: "",
    capacity: "",
    voltage: "",
    manufacturer: "",
    model: "",
    customerName: "",
    inspectionNotes: "",
    inspectionChecklist: {
      physicalDamage: false,
      connection: false,
      temperature: false,
      voltage: false,
      capacity: false
    }
  });
  const [availableBatteryModels, setAvailableBatteryModels] = useState<any[]>([]);

  // Load battery models when dialog opens
  const loadBatteryModels = async () => {
    try {
      const response = await fetch('http://localhost:5194/api/BatteryModels', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const batteryModels = await response.json();
        setAvailableBatteryModels(batteryModels);
        console.log('BatteryInventory: Loaded battery models:', batteryModels);
      } else {
        console.warn('BatteryInventory: Could not load battery models, status:', response.status);
      }
    } catch (error) {
      console.error('BatteryInventory: Error loading battery models:', error);
    }
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: string | boolean) => {
    if (field.startsWith('inspectionChecklist.')) {
      const checklistField = field.split('.')[1];
      setBatteryForm(prev => ({
        ...prev,
        inspectionChecklist: {
          ...prev.inspectionChecklist,
          [checklistField]: value
        }
      }));
    } else {
      setBatteryForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Reset form when dialog closes
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setBatteryForm({
      serial: "",
      batteryModelId: "",
      capacity: "",
      voltage: "",
      manufacturer: "",
      model: "",
      customerName: "",
      inspectionNotes: "",
      inspectionChecklist: {
        physicalDamage: false,
        connection: false,
        temperature: false,
        voltage: false,
        capacity: false
      }
    });
  };

  // Function to check available data before adding battery
  const checkAvailableData = async () => {
    try {
      console.log('BatteryInventory: Checking available data...');
      
      // Check 1: Get current user info
      try {
        const userInfo = await staffApi.getCurrentUser();
        console.log('BatteryInventory: Current user info:', userInfo);
      } catch (e) {
        console.warn('BatteryInventory: Could not get user info:', e);
      }
      
      // Check 2: Get staff profile
      try {
        const staffProfile = await staffApi.getStaffProfile('current');
        console.log('BatteryInventory: Staff profile:', staffProfile);
      } catch (e) {
        console.warn('BatteryInventory: Could not get staff profile:', e);
      }
      
      // Check 3: Get batteries to see existing data structure
      try {
        const batteries = await staffApi.getBatteries(1);
        console.log('BatteryInventory: Existing batteries:', batteries);
        if (batteries.length > 0) {
          console.log('BatteryInventory: Sample battery structure:', batteries[0]);
          console.log('BatteryInventory: Battery Model ID from existing data:', batteries[0].batteryModelId);
        }
      } catch (e) {
        console.warn('BatteryInventory: Could not get batteries:', e);
      }
      
      // Check 4: Try to get battery models from API
      try {
        console.log('BatteryInventory: Trying to get battery models...');
        const response = await fetch('http://localhost:5194/api/BatteryModels', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const batteryModels = await response.json();
          console.log('BatteryInventory: Available battery models:', batteryModels);
          if (batteryModels.length > 0) {
            console.log('BatteryInventory: First battery model ID:', batteryModels[0].id);
            console.log('BatteryInventory: First battery model name:', batteryModels[0].name);
          }
        } else {
          console.warn('BatteryInventory: Could not get battery models, status:', response.status);
        }
      } catch (e) {
        console.warn('BatteryInventory: Could not get battery models:', e);
      }
      
      // Check 5: Try different API endpoints
      const possibleEndpoints = [
        '/api/BatteryUnits/add-to-station',
        '/api/v1/BatteryUnits/add-to-station', 
        '/api/BatteryUnits',
        '/api/v1/BatteryUnits'
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`BatteryInventory: Testing endpoint: ${endpoint}`);
          // Just test if endpoint exists (GET request)
          const response = await fetch(`http://localhost:5194${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`BatteryInventory: Endpoint ${endpoint} status:`, response.status);
        } catch (e) {
          console.warn(`BatteryInventory: Endpoint ${endpoint} failed:`, e);
        }
      }
      
    } catch (error) {
      console.error('BatteryInventory: Error checking available data:', error);
    }
  };

  // Function to try different request formats
  const tryDifferentRequestFormats = async (stationId: string, batteryModelId: string, serial: string) => {
    const formats = [
      // Format 1: Correct DTO format based on error message
      {
        name: "Correct DTO format",
        data: {
          dto: {
            stationId: stationId,
            batteryUnits: [
              {
                serial: serial,
                batteryModelId: batteryModelId
              }
            ]
          }
        }
      },
      // Format 2: Direct format without dto wrapper
      {
        name: "Direct format",
        data: {
          stationId: stationId,
          batteryUnits: [
            {
              serial: serial,
              batteryModelId: batteryModelId
            }
          ]
        }
      },
      // Format 3: Array format
      {
        name: "Array format",
        data: [
          {
            stationId: stationId,
            serial: serial,
            batteryModelId: batteryModelId
          }
        ]
      }
    ];
    
    for (let i = 0; i < formats.length; i++) {
      try {
        console.log(`BatteryInventory: Trying format ${i + 1}/${formats.length}: ${formats[i].name}`);
        console.log('BatteryInventory: Request data:', JSON.stringify(formats[i].data, null, 2));
        
        const response = await staffApi.addBatteryUnitsToStation(formats[i].data);
        console.log(`BatteryInventory: Success with format: ${formats[i].name}`);
        return response;
        
      } catch (error: any) {
        console.warn(`BatteryInventory: Failed with format ${formats[i].name}:`, error.response?.data);
        
        // Log the specific error details
        if (error.response?.data?.errors) {
          console.error('BatteryInventory: Detailed validation errors:', error.response.data.errors);
        }
        
        // If this is the last attempt, throw the error
        if (i === formats.length - 1) {
          throw error;
        }
      }
    }
  };

  // Function to try adding battery with different model IDs
  const tryAddBatteryWithDifferentModels = async (stationId: string) => {
    const possibleBatteryModelIds = [
      "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Example GUID 1
      "b43acc9d-6c71-4572-8988-40a531d18081", // Example GUID 2 (from staff API)
      "1", // Try numeric ID
      "2", // Try another numeric ID
    ];
    
    for (let i = 0; i < possibleBatteryModelIds.length; i++) {
      try {
        console.log(`BatteryInventory: Trying battery model ID ${i + 1}/${possibleBatteryModelIds.length}:`, possibleBatteryModelIds[i]);
        
        const batteryUnits = [
          {
            serial: `BAT-${Date.now()}-${i + 1}`,
            batteryModelId: possibleBatteryModelIds[i]
          }
        ];
        
        const requestData = {
          dto: {
            stationId: stationId,
            batteryUnits: batteryUnits
          }
        };
        
        // Log the exact request data being sent
        console.log('BatteryInventory: Exact request data:', JSON.stringify(requestData, null, 2));
        
        const response = await staffApi.addBatteryUnitsToStation(requestData);
        console.log(`BatteryInventory: Success with battery model ID:`, possibleBatteryModelIds[i]);
        return response;
        
      } catch (error: any) {
        console.warn(`BatteryInventory: Failed with battery model ID ${possibleBatteryModelIds[i]}:`, error.response?.data);
        
        // Log the specific error details
        if (error.response?.data?.errors) {
          console.error('BatteryInventory: Detailed validation errors:', error.response.data.errors);
        }
        
        // If this is the last attempt, throw the error
        if (i === possibleBatteryModelIds.length - 1) {
          throw error;
        }
      }
    }
  };

  // Function to get real battery model ID
  const getRealBatteryModelId = async (): Promise<string | null> => {
    try {
      // Try to get from existing batteries first
      const batteries = await staffApi.getBatteries(1);
      if (batteries.length > 0 && batteries[0].batteryModelId) {
        console.log('BatteryInventory: Using battery model ID from existing batteries:', batteries[0].batteryModelId);
        return batteries[0].batteryModelId;
      }
      
      // Try to get from BatteryModels API
      const response = await fetch('http://localhost:5194/api/BatteryModels', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const batteryModels = await response.json();
        if (batteryModels.length > 0) {
          console.log('BatteryInventory: Using battery model ID from API:', batteryModels[0].id);
          return batteryModels[0].id;
        }
      }
      
      console.warn('BatteryInventory: Could not get real battery model ID');
      return null;
    } catch (error) {
      console.error('BatteryInventory: Error getting battery model ID:', error);
      return null;
    }
  };

  // Function to handle taking battery with confirmation
  const handleTakeBatteryClick = (batteryId: string) => {
    const battery = batteries.find(b => b.id === batteryId);
    if (battery) {
      setSelectedBatteryForTaking(battery);
      setIsTakeBatteryDialogOpen(true);
    }
  };

  // Function to confirm taking battery
  const handleConfirmTakeBattery = async () => {
    if (!selectedBatteryForTaking) return;
    
    try {
      console.log('BatteryInventory: Taking battery:', selectedBatteryForTaking.id);
      
      // Call the new API
      await staffApi.takeBatteryFromStation(selectedBatteryForTaking.id);
      
      // Show success message
      alert(`✅ Đã lấy pin thành công!\nSlot: ${selectedBatteryForTaking.slot}\nModel: ${selectedBatteryForTaking.model}`);
      
      // Close dialog
      setIsTakeBatteryDialogOpen(false);
      setSelectedBatteryForTaking(null);
      
      // Refresh battery list
      if (onNewInspection) {
        onNewInspection();
      }
      
    } catch (error: any) {
      console.error('BatteryInventory: Error taking battery:', error);
      alert(`❌ Lỗi khi lấy pin:\n${error.message}`);
    }
  };

  // Function to cancel taking battery
  const handleCancelTakeBattery = () => {
    setIsTakeBatteryDialogOpen(false);
    setSelectedBatteryForTaking(null);
  };

  // Function to add battery units to station with form data
  const handleAddBatteryToStation = async () => {
    try {
      setIsAddingBattery(true);
      console.log('BatteryInventory: Adding battery units to station with form data...');
      
      // Validate form data
      if (!batteryForm.serial.trim()) {
        alert('Vui lòng nhập Serial Number');
        return;
      }
      if (!batteryForm.batteryModelId) {
        alert('Vui lòng chọn Battery Model');
        return;
      }
      
      // Try to get real station ID from user context or use fallback
      let stationId = "7756DCE5-4961-45E7-877C-624437403F82"; // Fallback UUID
      
      // Try to get station ID from localStorage or user context
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.stationId) {
            stationId = user.stationId;
            console.log('BatteryInventory: Using station ID from user context:', stationId);
          }
        }
      } catch (e) {
        console.warn('BatteryInventory: Could not get station ID from user context, using fallback');
      }
      
      console.log('BatteryInventory: Using station ID:', stationId);
      console.log('BatteryInventory: Using form data:', batteryForm);
      
      // Try different request formats with the form data
      const response = await tryDifferentRequestFormats(stationId, batteryForm.batteryModelId, batteryForm.serial);
      console.log('BatteryInventory: API response:', response);
      
      // Show success message
      alert(`Thêm pin thành công!\nSerial: ${batteryForm.serial}\nModel: ${batteryForm.batteryModelId}`);
      
      // Close dialog and reset form
      handleDialogClose();
      
      // Refresh battery list
      if (onNewInspection) {
        onNewInspection();
      }
      
    } catch (error: any) {
      console.error('BatteryInventory: Error adding battery units:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('BatteryInventory: Error response:', error.response.data);
        console.error('BatteryInventory: Error status:', error.response.status);
        console.error('BatteryInventory: Error headers:', error.response.headers);
      }
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData?.errors?.BatteryUnits) {
          alert(`Lỗi validation:\n${errorData.errors.BatteryUnits.join('\n')}\n\nCó thể Station ID hoặc Battery Model ID không tồn tại trong database.`);
        } else {
          alert(`Lỗi 400 Bad Request:\n${JSON.stringify(errorData, null, 2)}`);
        }
        return;
      }
      
      if (error.response?.status === 401) {
        alert('Token đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      if (error.response?.status === 403) {
        alert('Không có quyền thêm pin vào trạm này.');
        return;
      }
      
      alert('Có lỗi xảy ra khi thêm pin vào trạm');
    } finally {
      setIsAddingBattery(false);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: // Empty
        return "bg-gray-500";
      case 1: // Charging
        return "bg-yellow-500";
      case 2: // Full
        return "bg-green-500";
      case 3: // Maintenance
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return "text-green-600";
    if (health >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Phân loại theo dung lượng
  const getCapacityCategory = (health: number | undefined) => {
    if (!health) return "critical";
    if (health >= 90) return "high";
    if (health >= 70) return "medium";
    if (health >= 50) return "low";
    return "critical";
  };

  // Phân loại theo model
  const getModelCategory = (model: string | undefined) => {
    if (!model) return "other";
    if (model.includes("Tesla")) return "tesla";
    if (model.includes("BYD")) return "byd";
    if (model.includes("VinFast")) return "vinfast";
    return "other";
  };

  // Phân loại theo tình trạng
  const getConditionCategory = (battery: BatteryType) => {
    if (battery.status === 3) return "maintenance"; // Maintenance status
    if ((battery.health || 0) < 50) return "critical";
    if ((battery.temperature || 0) > 45) return "overheated";
    if ((battery.cycles || 0) > 1000) return "aged";
    return "good";
  };

  // Lọc và sắp xếp pin
  const filteredAndSortedBatteries = useMemo(() => {
    let filtered = batteries;

    // Lọc theo dung lượng
    if (filterBy === "capacity-high") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "high");
    } else if (filterBy === "capacity-medium") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "medium");
    } else if (filterBy === "capacity-low") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "low");
    } else if (filterBy === "capacity-critical") {
      filtered = filtered.filter(battery => getCapacityCategory(battery.health) === "critical");
    }
    // Lọc theo model
    else if (filterBy === "model-tesla") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "tesla");
    } else if (filterBy === "model-byd") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "byd");
    } else if (filterBy === "model-vinfast") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "vinfast");
    } else if (filterBy === "model-other") {
      filtered = filtered.filter(battery => getModelCategory(battery.model) === "other");
    }
    // Lọc theo tình trạng
    else if (filterBy === "condition-maintenance") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "maintenance");
    } else if (filterBy === "condition-critical") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "critical");
    } else if (filterBy === "condition-overheated") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "overheated");
    } else if (filterBy === "condition-aged") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "aged");
    } else if (filterBy === "condition-good") {
      filtered = filtered.filter(battery => getConditionCategory(battery) === "good");
    }

    // Sắp xếp
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "health":
          return (b.health || 0) - (a.health || 0);
        case "cycles":
          return (b.cycles || 0) - (a.cycles || 0);
        case "temperature":
          return (b.temperature || 0) - (a.temperature || 0);
        case "voltage":
          return (b.voltage || 0) - (a.voltage || 0);
        case "model":
          return (a.model || "").localeCompare(b.model || "");
        case "status":
          return a.status - b.status;
        default:
          return (a.slot || "").localeCompare(b.slot || "");
      }
    });
  }, [batteries, filterBy, sortBy]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const total = batteries.length;
    const highCapacity = batteries.filter(b => getCapacityCategory(b.health) === "high").length;
    const mediumCapacity = batteries.filter(b => getCapacityCategory(b.health) === "medium").length;
    const lowCapacity = batteries.filter(b => getCapacityCategory(b.health) === "low").length;
    const criticalCapacity = batteries.filter(b => getCapacityCategory(b.health) === "critical").length;
    
    const teslaCount = batteries.filter(b => getModelCategory(b.model) === "tesla").length;
    const bydCount = batteries.filter(b => getModelCategory(b.model) === "byd").length;
    const vinfastCount = batteries.filter(b => getModelCategory(b.model) === "vinfast").length;
    const otherCount = batteries.filter(b => getModelCategory(b.model) === "other").length;

    const maintenanceCount = batteries.filter(b => getConditionCategory(b) === "maintenance").length;
    const criticalCount = batteries.filter(b => getConditionCategory(b) === "critical").length;
    const overheatedCount = batteries.filter(b => getConditionCategory(b) === "overheated").length;
    const agedCount = batteries.filter(b => getConditionCategory(b) === "aged").length;
    const goodCount = batteries.filter(b => getConditionCategory(b) === "good").length;

    return {
      total,
      capacity: { highCapacity, mediumCapacity, lowCapacity, criticalCapacity },
      models: { teslaCount, bydCount, vinfastCount, otherCount },
      conditions: { maintenanceCount, criticalCount, overheatedCount, agedCount, goodCount }
    };
  }, [batteries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border border-orange-200 rounded-lg bg-gray-50 p-4 mb-2">
        <h2 className="text-2xl font-bold text-orange-600">
          {t("staff.batteryInventory")}
        </h2>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg border-none" 
            onClick={checkAvailableData}
          >
            <RefreshCw className="w-4 h-4 mr-2 text-white" />
            Kiểm Tra Dữ Liệu
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg border-none"
                onClick={() => {
                  setIsDialogOpen(true);
                  loadBatteryModels();
                }}
              >
                <Plus className="w-4 h-4 mr-2 text-white" />
                Thêm Pin Mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader className="text-center pb-6">
                <DialogTitle className="text-2xl font-bold text-orange-600 mb-2">
                  🔋 Thêm Pin Mới & Kiểm Tra
                </DialogTitle>
                <p className="text-gray-600">Nhập thông tin pin và thực hiện kiểm tra trước khi thêm vào kho</p>
              </DialogHeader>
              
              <div className="space-y-8">
                {/* Thông Tin Pin Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                    📋 Thông Tin Pin
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serial" className="text-sm font-medium text-gray-700">
                        Serial Number *
                      </Label>
                      <Input
                        id="serial"
                        value={batteryForm.serial}
                        onChange={(e) => handleFormChange('serial', e.target.value)}
                        className="w-full"
                        placeholder="VD: TESLA-S-2024-001"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="batteryModel" className="text-sm font-medium text-gray-700">
                        Battery Model *
                      </Label>
                      <Select 
                        value={batteryForm.batteryModelId} 
                        onValueChange={(value) => handleFormChange('batteryModelId', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn battery model" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBatteryModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name || model.model || model.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">
                        Capacity (Ah)
                      </Label>
                      <Input
                        id="capacity"
                        value={batteryForm.capacity}
                        onChange={(e) => handleFormChange('capacity', e.target.value)}
                        className="w-full"
                        placeholder="VD: 100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="voltage" className="text-sm font-medium text-gray-700">
                        Voltage (V)
                      </Label>
                      <Input
                        id="voltage"
                        value={batteryForm.voltage}
                        onChange={(e) => handleFormChange('voltage', e.target.value)}
                        className="w-full"
                        placeholder="VD: 400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer" className="text-sm font-medium text-gray-700">
                        Manufacturer
                      </Label>
                      <Input
                        id="manufacturer"
                        value={batteryForm.manufacturer}
                        onChange={(e) => handleFormChange('manufacturer', e.target.value)}
                        className="w-full"
                        placeholder="VD: Tesla Inc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                        Khách Hàng
                      </Label>
                      <Input
                        id="customerName"
                        value={batteryForm.customerName}
                        onChange={(e) => handleFormChange('customerName', e.target.value)}
                        className="w-full"
                        placeholder="VD: Alex Chen"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Inspection Checklist Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                    ✅ Danh Sách Kiểm Tra
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100">
                      <input
                        type="checkbox"
                        id="physicalDamage"
                        checked={batteryForm.inspectionChecklist.physicalDamage}
                        onChange={(e) => handleFormChange('inspectionChecklist.physicalDamage', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <Label htmlFor="physicalDamage" className="text-sm font-medium text-gray-700 cursor-pointer">
                        🔍 Kiểm tra hư hỏng vật lý
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100">
                      <input
                        type="checkbox"
                        id="connection"
                        checked={batteryForm.inspectionChecklist.connection}
                        onChange={(e) => handleFormChange('inspectionChecklist.connection', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <Label htmlFor="connection" className="text-sm font-medium text-gray-700 cursor-pointer">
                        🔌 Kiểm tra kết nối
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100">
                      <input
                        type="checkbox"
                        id="temperature"
                        checked={batteryForm.inspectionChecklist.temperature}
                        onChange={(e) => handleFormChange('inspectionChecklist.temperature', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <Label htmlFor="temperature" className="text-sm font-medium text-gray-700 cursor-pointer">
                        🌡️ Đọc nhiệt độ
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100">
                      <input
                        type="checkbox"
                        id="voltageCheck"
                        checked={batteryForm.inspectionChecklist.voltage}
                        onChange={(e) => handleFormChange('inspectionChecklist.voltage', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <Label htmlFor="voltageCheck" className="text-sm font-medium text-gray-700 cursor-pointer">
                        ⚡ Kiểm tra điện áp
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-100">
                      <input
                        type="checkbox"
                        id="capacityCheck"
                        checked={batteryForm.inspectionChecklist.capacity}
                        onChange={(e) => handleFormChange('inspectionChecklist.capacity', e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <Label htmlFor="capacityCheck" className="text-sm font-medium text-gray-700 cursor-pointer">
                        🔋 Xác minh dung lượng
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Notes Section */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center">
                    📝 Ghi Chú Kiểm Tra
                  </h3>
                  <textarea
                    id="inspectionNotes"
                    value={batteryForm.inspectionNotes}
                    onChange={(e) => handleFormChange('inspectionNotes', e.target.value)}
                    className="w-full p-4 border border-yellow-200 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    rows={4}
                    placeholder="Bất kỳ vấn đề hoặc quan sát nào... (VD: Pin có vết trầy nhẹ ở góc, nhiệt độ bình thường)"
                  />
                </div>
                
                {/* Image Upload Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center">
                    📸 Tài Liệu Ảnh
                  </h3>
                  <div className="flex space-x-4">
                    <Button type="button" variant="outline" size="lg" className="flex-1 h-12 border-purple-300 hover:bg-purple-50">
                      📷 Chụp Ảnh
                    </Button>
                    <Button type="button" variant="outline" size="lg" className="flex-1 h-12 border-purple-300 hover:bg-purple-50">
                      📄 Tải Tệp
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  onClick={handleDialogClose}
                  size="lg"
                  className="px-8"
                >
                  ❌ Hủy
          </Button>
                <Button 
                  onClick={handleAddBatteryToStation}
                  disabled={isAddingBattery}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 shadow-lg"
                >
                  {isAddingBattery ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      ✅ Hoàn Thành Kiểm Tra & Thêm Pin
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg border-none" 
            onClick={() => {
              if (selectedBattery) {
                handleTakeBatteryClick(selectedBattery);
              } else {
                alert("Vui lòng chọn pin để lấy");
              }
            }}
            disabled={!selectedBattery}
          >
            <Download className="w-4 h-4 mr-2 text-white" /> {t("staff.takeBattery")}
          </Button>
        </div>
      </div>

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Thống kê theo dung lượng */}
        <Card className="border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Battery className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-800">Phân loại theo dung lượng</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Cao (≥90%):</span>
                <span className="font-medium">{stats.capacity.highCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Trung bình (70-89%):</span>
                <span className="font-medium">{stats.capacity.mediumCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Thấp (50-69%):</span>
                <span className="font-medium">{stats.capacity.lowCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Nguy hiểm (&lt;50%):</span>
                <span className="font-medium">{stats.capacity.criticalCapacity}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê theo model */}
        <Card className="border border-green-200 rounded-lg bg-green-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Layers className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-green-800">Phân loại theo model</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Tesla:</span>
                <span className="font-medium">{stats.models.teslaCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">BYD:</span>
                <span className="font-medium">{stats.models.bydCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">VinFast:</span>
                <span className="font-medium">{stats.models.vinfastCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Khác:</span>
                <span className="font-medium">{stats.models.otherCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thống kê theo tình trạng */}
        <Card className="border border-red-200 rounded-lg bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="font-semibold text-red-800">Phân loại theo tình trạng</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-600">Tốt:</span>
                <span className="font-medium">{stats.conditions.goodCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">Cũ (&gt;1000 chu kỳ):</span>
                <span className="font-medium">{stats.conditions.agedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Quá nóng (&gt;45°C):</span>
                <span className="font-medium">{stats.conditions.overheatedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Nguy hiểm:</span>
                <span className="font-medium">{stats.conditions.criticalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bảo trì:</span>
                <span className="font-medium">{stats.conditions.maintenanceCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bộ lọc và sắp xếp */}
      <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Lọc theo:</span>
            </div>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chọn tiêu chí lọc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ({stats.total})</SelectItem>
                <SelectItem value="capacity-high">Dung lượng cao ({stats.capacity.highCapacity})</SelectItem>
                <SelectItem value="capacity-medium">Dung lượng trung bình ({stats.capacity.mediumCapacity})</SelectItem>
                <SelectItem value="capacity-low">Dung lượng thấp ({stats.capacity.lowCapacity})</SelectItem>
                <SelectItem value="capacity-critical">Dung lượng nguy hiểm ({stats.capacity.criticalCapacity})</SelectItem>
                <SelectItem value="model-tesla">Model Tesla ({stats.models.teslaCount})</SelectItem>
                <SelectItem value="model-byd">Model BYD ({stats.models.bydCount})</SelectItem>
                <SelectItem value="model-vinfast">Model VinFast ({stats.models.vinfastCount})</SelectItem>
                <SelectItem value="model-other">Model khác ({stats.models.otherCount})</SelectItem>
                <SelectItem value="condition-good">Tình trạng tốt ({stats.conditions.goodCount})</SelectItem>
                <SelectItem value="condition-aged">Pin cũ ({stats.conditions.agedCount})</SelectItem>
                <SelectItem value="condition-overheated">Quá nóng ({stats.conditions.overheatedCount})</SelectItem>
                <SelectItem value="condition-critical">Nguy hiểm ({stats.conditions.criticalCount})</SelectItem>
                <SelectItem value="condition-maintenance">Bảo trì ({stats.conditions.maintenanceCount})</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slot">Slot</SelectItem>
                <SelectItem value="health">Dung lượng</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="status">Trạng thái</SelectItem>
                <SelectItem value="cycles">Chu kỳ</SelectItem>
                <SelectItem value="temperature">Nhiệt độ</SelectItem>
                <SelectItem value="voltage">Điện áp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách pin đã lọc */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedBatteries.map((battery) => {
          const capacityCategory = getCapacityCategory(battery.health);
          const modelCategory = getModelCategory(battery.model);
          const conditionCategory = getConditionCategory(battery);
          
          return (
            <Card
              key={battery.id}
              className={`border border-orange-200 rounded-lg bg-white shadow-sm cursor-pointer transition-colors ${
                selectedBattery === battery.id ? "border-blue-500 bg-blue-50" : ""
              } ${
                conditionCategory === "critical" ? "border-red-300 bg-red-50" :
                conditionCategory === "overheated" ? "border-orange-300 bg-orange-50" :
                conditionCategory === "aged" ? "border-yellow-300 bg-yellow-50" :
                conditionCategory === "maintenance" ? "border-gray-300 bg-gray-50" :
                ""
              }`}
              onClick={() => onBatterySelect(battery.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">
                      {t("staff.slot")} {battery.slot}
                    </h3>
                    <p className="text-sm text-gray-500">{battery.model}</p>
                    <div className="flex space-x-1 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          capacityCategory === "high" ? "bg-green-100 text-green-700" :
                          capacityCategory === "medium" ? "bg-yellow-100 text-yellow-700" :
                          capacityCategory === "low" ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}
                      >
                        {capacityCategory === "high" ? "Cao" :
                         capacityCategory === "medium" ? "TB" :
                         capacityCategory === "low" ? "Thấp" : "Nguy hiểm"}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          modelCategory === "tesla" ? "bg-blue-100 text-blue-700" :
                          modelCategory === "byd" ? "bg-green-100 text-green-700" :
                          modelCategory === "vinfast" ? "bg-purple-100 text-purple-700" :
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {modelCategory === "tesla" ? "Tesla" :
                         modelCategory === "byd" ? "BYD" :
                         modelCategory === "vinfast" ? "VinFast" : "Khác"}
                      </Badge>
                      {conditionCategory !== "good" && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            conditionCategory === "aged" ? "bg-yellow-100 text-yellow-700" :
                            conditionCategory === "overheated" ? "bg-orange-100 text-orange-700" :
                            conditionCategory === "critical" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {conditionCategory === "aged" ? "Cũ" :
                           conditionCategory === "overheated" ? "Nóng" :
                           conditionCategory === "critical" ? "Nguy hiểm" :
                           "Bảo trì"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        battery.status
                      )}`}
                    ></div>
                    <Badge variant="secondary">
                      {battery.status === 0 ? t("staff.empty") :
                       battery.status === 1 ? t("staff.charging") :
                       battery.status === 2 ? t("staff.full") :
                       battery.status === 3 ? t("staff.maintenance") :
                       t("staff.unknown")}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("staff.health")}:</span>
                    <span className={getHealthColor(battery.health || 0)}>
                      {battery.health || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.voltage")}:</span>
                    <span>{battery.voltage || 0}V</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.cycles")}:</span>
                    <span>{(battery.cycles || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.temperature")}:</span>
                    <span className={(battery.temperature || 0) > 45 ? "text-red-600 font-medium" : ""}>
                      {battery.temperature || 0}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("staff.lastSwap")}:</span>
                    <span>{battery.lastSwap}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t">
                  <Progress 
                    value={battery.health || 0} 
                    className={`h-2 mb-2 ${
                      capacityCategory === "high" ? "bg-green-100 [&>div]:bg-green-500" :
                      capacityCategory === "medium" ? "bg-yellow-100 [&>div]:bg-yellow-500" :
                      capacityCategory === "low" ? "bg-orange-100 [&>div]:bg-orange-500" :
                      "bg-red-100 [&>div]:bg-red-500"
                    }`} 
                  />
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline" className="flex-1">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Wrench className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Take Battery Confirmation Dialog */}
      <Dialog open={isTakeBatteryDialogOpen} onOpenChange={setIsTakeBatteryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-red-600 mb-2">
              ⚠️ Xác Nhận Lấy Pin
            </DialogTitle>
            <p className="text-gray-600">Bạn có chắc chắn muốn lấy pin này khỏi trạm không?</p>
          </DialogHeader>
          
          {selectedBatteryForTaking && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200 mb-6">
              <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                🔋 Thông Tin Pin
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Slot:</span>
                  <p className="font-mono text-lg">{selectedBatteryForTaking.slot}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Model:</span>
                  <p className="font-medium">{selectedBatteryForTaking.model}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Sức Khỏe:</span>
                  <p className={`font-medium ${getHealthColor(selectedBatteryForTaking.health || 0)}`}>
                    {selectedBatteryForTaking.health || 0}%
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Điện Áp:</span>
                  <p className="font-medium">{selectedBatteryForTaking.voltage || 0}V</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nhiệt Độ:</span>
                  <p className={`font-medium ${(selectedBatteryForTaking.temperature || 0) > 45 ? "text-red-600" : ""}`}>
                    {selectedBatteryForTaking.temperature || 0}°C
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Chu Kỳ:</span>
                  <p className="font-medium">{(selectedBatteryForTaking.cycles || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 mb-6">
            <div className="flex items-center space-x-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Cảnh Báo:</span>
            </div>
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              <li>• Pin sẽ được xóa khỏi trạm</li>
              <li>• Hành động này không thể hoàn tác</li>
              <li>• Đảm bảo pin đã được kiểm tra kỹ lưỡng</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={handleCancelTakeBattery}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={handleConfirmTakeBattery}
              size="lg"
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              ✅ Xác Nhận Lấy Pin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
