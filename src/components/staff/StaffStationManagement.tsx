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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  Users, 
  MapPin, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Shield, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'staff' | 'manager';
  assignedStationId?: string;
  assignedStationName?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'maintenance' | 'inactive';
  assignedStaffId?: string;
  assignedStaffName?: string;
  capacity: number;
  currentBatteries: number;
  location: {
    lat: number;
    lng: number;
  };
}

interface StaffStationManagementProps {
  onRefresh?: () => void;
}

export function StaffStationManagement({ onRefresh }: StaffStationManagementProps) {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form states for adding staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff' | 'manager',
    assignedStationId: ''
  });

  // Mock data initialization
  useEffect(() => {
    // Simulate staff data
    const mockStaff: Staff[] = [
      {
        id: 'staff-1',
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@evbss.local',
        phone: '0901234567',
        role: 'staff',
        assignedStationId: 'station-1',
        assignedStationName: 'Trạm Trung Tâm',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-01-15T08:30:00Z'
      },
      {
        id: 'staff-2',
        name: 'Trần Thị B',
        email: 'tranthib@evbss.local',
        phone: '0901234568',
        role: 'staff',
        assignedStationId: 'station-2',
        assignedStationName: 'Trạm Mall',
        status: 'active',
        createdAt: '2024-01-02T00:00:00Z',
        lastLogin: '2024-01-15T09:15:00Z'
      },
      {
        id: 'staff-3',
        name: 'Lê Văn C',
        email: 'levanc@evbss.local',
        phone: '0901234569',
        role: 'manager',
        assignedStationId: undefined,
        assignedStationName: undefined,
        status: 'active',
        createdAt: '2024-01-03T00:00:00Z',
        lastLogin: '2024-01-15T10:00:00Z'
      },
      {
        id: 'staff-4',
        name: 'Phạm Thị D',
        email: 'phamthid@evbss.local',
        phone: '0901234570',
        role: 'staff',
        assignedStationId: undefined,
        assignedStationName: undefined,
        status: 'inactive',
        createdAt: '2024-01-04T00:00:00Z',
        lastLogin: '2024-01-10T14:20:00Z'
      }
    ];

    setStaff(mockStaff);

    // Simulate station data
    const mockStations: Station[] = [
      {
        id: 'station-1',
        name: 'Trạm Trung Tâm',
        address: '123 Đường ABC, Quận 1, TP.HCM',
        status: 'active',
        assignedStaffId: 'staff-1',
        assignedStaffName: 'Nguyễn Văn A',
        capacity: 20,
        currentBatteries: 17,
        location: { lat: 10.7769, lng: 106.7009 }
      },
      {
        id: 'station-2',
        name: 'Trạm Mall',
        address: '456 Đường XYZ, Quận 2, TP.HCM',
        status: 'active',
        assignedStaffId: 'staff-2',
        assignedStaffName: 'Trần Thị B',
        capacity: 15,
        currentBatteries: 12,
        location: { lat: 10.7870, lng: 106.7051 }
      },
      {
        id: 'station-3',
        name: 'Trạm Airport',
        address: '789 Đường DEF, Quận Tân Bình, TP.HCM',
        status: 'active',
        assignedStaffId: undefined,
        assignedStaffName: undefined,
        capacity: 25,
        currentBatteries: 20,
        location: { lat: 10.8181, lng: 106.6519 }
      },
      {
        id: 'station-4',
        name: 'Trạm University',
        address: '321 Đường GHI, Quận Thủ Đức, TP.HCM',
        status: 'maintenance',
        assignedStaffId: undefined,
        assignedStaffName: undefined,
        capacity: 12,
        currentBatteries: 8,
        location: { lat: 10.8412, lng: 106.8099 }
      }
    ];

    setStations(mockStations);
  }, []);

  // Filter staff based on role and status
  const filteredStaff = staff.filter(s => {
    const roleMatch = filterRole === 'all' || s.role === filterRole;
    const statusMatch = filterStatus === 'all' || s.status === filterStatus;
    return roleMatch && statusMatch;
  });

  // Get unassigned staff
  const unassignedStaff = staff.filter(s => !s.assignedStationId && s.status === 'active');

  // Get unassigned stations
  const unassignedStations = stations.filter(s => !s.assignedStaffId && s.status === 'active');

  const handleAssignStaff = (staffId: string, stationId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    const station = stations.find(s => s.id === stationId);

    if (staffMember && station) {
      // Update staff assignment
      setStaff(prev => 
        prev.map(s => 
          s.id === staffId 
            ? { ...s, assignedStationId: stationId, assignedStationName: station.name }
            : s
        )
      );

      // Update station assignment
      setStations(prev => 
        prev.map(s => 
          s.id === stationId 
            ? { ...s, assignedStaffId: staffId, assignedStaffName: staffMember.name }
            : s
        )
      );

      setIsAssignDialogOpen(false);
      onRefresh?.();
    }
  };

  const handleUnassignStaff = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    
    if (staffMember && staffMember.assignedStationId) {
      // Update staff assignment
      setStaff(prev => 
        prev.map(s => 
          s.id === staffId 
            ? { ...s, assignedStationId: undefined, assignedStationName: undefined }
            : s
        )
      );

      // Update station assignment
      setStations(prev => 
        prev.map(s => 
          s.id === staffMember.assignedStationId 
            ? { ...s, assignedStaffId: undefined, assignedStaffName: undefined }
            : s
        )
      );

      setIsUnassignDialogOpen(false);
      onRefresh?.();
    }
  };

  const handleAddStaff = () => {
    const newStaff: Staff = {
      id: `staff-${Date.now()}`,
      name: staffForm.name,
      email: staffForm.email,
      phone: staffForm.phone,
      role: staffForm.role,
      assignedStationId: staffForm.assignedStationId || undefined,
      assignedStationName: staffForm.assignedStationId ? 
        stations.find(s => s.id === staffForm.assignedStationId)?.name : undefined,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    setStaff(prev => [...prev, newStaff]);

    // If station is assigned, update station as well
    if (staffForm.assignedStationId) {
      setStations(prev => 
        prev.map(s => 
          s.id === staffForm.assignedStationId 
            ? { ...s, assignedStaffId: newStaff.id, assignedStaffName: newStaff.name }
            : s
        )
      );
    }

    setIsAddStaffDialogOpen(false);
    
    // Reset form
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      role: 'staff',
      assignedStationId: ''
    });
  };

  const handleSuspendStaff = (staffId: string) => {
    setStaff(prev => 
      prev.map(s => 
        s.id === staffId 
          ? { ...s, status: 'suspended' as const, assignedStationId: undefined, assignedStationName: undefined }
          : s
      )
    );

    // Unassign from station if assigned
    const staffMember = staff.find(s => s.id === staffId);
    if (staffMember?.assignedStationId) {
      setStations(prev => 
        prev.map(s => 
          s.id === staffMember.assignedStationId 
            ? { ...s, assignedStaffId: undefined, assignedStaffName: undefined }
            : s
        )
      );
    }
  };

  const handleActivateStaff = (staffId: string) => {
    setStaff(prev => 
      prev.map(s => 
        s.id === staffId 
          ? { ...s, status: 'active' as const }
          : s
      )
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white';
      case 'manager': return 'bg-purple-500 text-white';
      case 'staff': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStationStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStationStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'maintenance': return 'Bảo trì';
      case 'inactive': return 'Ngừng hoạt động';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-orange-600">
            Phân Quyền Staff & Trạm
          </h2>
          <p className="text-gray-600">Quản lý phân công staff cho các trạm thay pin</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setIsAddStaffDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm Staff
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-blue-200 rounded-lg bg-blue-50">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{staff.length}</p>
            <p className="text-sm text-blue-700">Tổng Staff</p>
          </CardContent>
        </Card>

        <Card className="border border-green-200 rounded-lg bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{staff.filter(s => s.status === 'active').length}</p>
            <p className="text-sm text-green-700">Đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="border border-purple-200 rounded-lg bg-purple-50">
          <CardContent className="p-4 text-center">
            <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stations.length}</p>
            <p className="text-sm text-purple-700">Tổng Trạm</p>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 rounded-lg bg-orange-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{unassignedStations.length}</p>
            <p className="text-sm text-orange-700">Chưa phân công</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 rounded-lg">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Lọc theo vai trò:</span>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="suspended">Tạm khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Danh Sách Staff
          </CardTitle>
          <CardDescription>
            Quản lý thông tin và phân công staff cho các trạm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStaff.map((staffMember) => (
              <div key={staffMember.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{staffMember.name}</h3>
                      <p className="text-sm text-gray-500">{staffMember.email}</p>
                      <p className="text-xs text-gray-400">{staffMember.phone}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getRoleColor(staffMember.role)}>
                        {staffMember.role === 'admin' ? 'Admin' :
                         staffMember.role === 'manager' ? 'Manager' : 'Staff'}
                      </Badge>
                      <Badge className={getStatusColor(staffMember.status)}>
                        {staffMember.status === 'active' ? 'Hoạt động' :
                         staffMember.status === 'inactive' ? 'Không hoạt động' : 'Tạm khóa'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    {staffMember.assignedStationName ? (
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Trạm:</span> {staffMember.assignedStationName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Đăng nhập cuối: {staffMember.lastLogin ? 
                            new Date(staffMember.lastLogin).toLocaleString('vi-VN') : 'Chưa có'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-orange-600 font-medium">Chưa phân công trạm</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!staffMember.assignedStationId && staffMember.status === 'active' && (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => {
                          setSelectedStaff(staffMember);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Phân công
                      </Button>
                    )}
                    {staffMember.assignedStationId && staffMember.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        onClick={() => {
                          setSelectedStaff(staffMember);
                          setIsUnassignDialogOpen(true);
                        }}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Hủy phân công
                      </Button>
                    )}
                    {staffMember.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleSuspendStaff(staffMember.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Tạm khóa
                      </Button>
                    )}
                    {staffMember.status === 'suspended' && (
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleActivateStaff(staffMember.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Kích hoạt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Station List */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Danh Sách Trạm
          </CardTitle>
          <CardDescription>
            Quản lý thông tin và phân công staff cho các trạm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stations.map((station) => (
              <div key={station.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{station.name}</h3>
                      <p className="text-sm text-gray-500">{station.address}</p>
                      <p className="text-xs text-gray-400">
                        Sức chứa: {station.currentBatteries}/{station.capacity} pin
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getStationStatusColor(station.status)}`}></div>
                        <Badge variant="secondary">
                          {getStationStatusText(station.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {station.assignedStaffName ? (
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Staff:</span> {station.assignedStaffName}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {station.assignedStaffId}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-orange-600 font-medium">Chưa có staff</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!station.assignedStaffId && station.status === 'active' && (
                      <Button 
                        size="sm" 
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => {
                          setSelectedStation(station);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Phân công Staff
                      </Button>
                    )}
                    {station.assignedStaffId && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                        onClick={() => {
                          const assignedStaff = staff.find(s => s.id === station.assignedStaffId);
                          if (assignedStaff) {
                            setSelectedStaff(assignedStaff);
                            setIsUnassignDialogOpen(true);
                          }
                        }}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Hủy phân công
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assign Staff Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-green-600 mb-2">
              👤 Phân Công Staff
            </DialogTitle>
            <p className="text-gray-600">Chọn staff để phân công cho trạm</p>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedStaff && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">Staff được chọn</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tên:</span>
                    <p className="font-medium">{selectedStaff.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="font-medium">{selectedStaff.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Vai trò:</span>
                    <p className="font-medium">{selectedStaff.role}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Trạng thái:</span>
                    <p className="font-medium">{selectedStaff.status}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="stationSelect" className="text-sm font-medium text-gray-700">
                Chọn trạm để phân công *
              </Label>
              <Select onValueChange={(value) => setSelectedStation(stations.find(s => s.id === value) || null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạm..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedStations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name} - {station.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStation && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-green-700 mb-2">Trạm được chọn</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tên trạm:</span>
                    <p className="font-medium">{selectedStation.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Địa chỉ:</span>
                    <p className="font-medium">{selectedStation.address}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sức chứa:</span>
                    <p className="font-medium">{selectedStation.currentBatteries}/{selectedStation.capacity}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Trạng thái:</span>
                    <p className="font-medium">{getStationStatusText(selectedStation.status)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsAssignDialogOpen(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={() => {
                if (selectedStaff && selectedStation) {
                  handleAssignStaff(selectedStaff.id, selectedStation.id);
                }
              }}
              disabled={!selectedStaff || !selectedStation}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 shadow-lg disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              ✅ Phân Công
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unassign Staff Dialog */}
      <Dialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-orange-600 mb-2">
              ⚠️ Hủy Phân Công Staff
            </DialogTitle>
            <p className="text-gray-600">Xác nhận hủy phân công staff khỏi trạm</p>
          </DialogHeader>
          
          {selectedStaff && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200 mb-6">
              <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center">
                👤 Thông Tin Staff
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Tên:</span>
                  <p className="font-bold text-lg text-orange-600">{selectedStaff.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="font-bold text-lg text-orange-600">{selectedStaff.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Trạm hiện tại:</span>
                  <p className="font-bold text-lg text-orange-600">{selectedStaff.assignedStationName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Vai trò:</span>
                  <p className="font-bold text-lg text-orange-600">{selectedStaff.role}</p>
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
              <li>• Staff sẽ không thể quản lý trạm này nữa</li>
              <li>• Trạm sẽ trở thành chưa có staff quản lý</li>
              <li>• Có thể phân công lại staff khác sau này</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsUnassignDialogOpen(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={() => {
                if (selectedStaff) {
                  handleUnassignStaff(selectedStaff.id);
                }
              }}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 shadow-lg"
            >
              <UserMinus className="w-5 h-5 mr-2" />
              ✅ Xác Nhận Hủy Phân Công
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-2xl font-bold text-blue-600 mb-2">
              👤 Thêm Staff Mới
            </DialogTitle>
            <p className="text-gray-600">Thêm staff mới vào hệ thống</p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Tên *
                </Label>
                <Input
                  id="name"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                  placeholder="VD: nguyenvana@evbss.local"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Số điện thoại *
                </Label>
                <Input
                  id="phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full"
                  placeholder="VD: 0901234567"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Vai trò *
                </Label>
                <Select value={staffForm.role} onValueChange={(value: any) => setStaffForm(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="assignedStation" className="text-sm font-medium text-gray-700">
                Phân công trạm (tùy chọn)
              </Label>
              <Select value={staffForm.assignedStationId} onValueChange={(value) => setStaffForm(prev => ({ ...prev, assignedStationId: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn trạm (có thể để trống)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Không phân công</SelectItem>
                  {unassignedStations.map((station) => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name} - {station.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsAddStaffDialogOpen(false)}
              size="lg"
              className="px-8"
            >
              ❌ Hủy
            </Button>
            <Button 
              onClick={handleAddStaff}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 shadow-lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              ✅ Thêm Staff
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
