import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Battery,
    Plus,
    Minus,
    RefreshCw,
    ArrowRightLeft,
    Package,
    Zap,
    Wrench,
    CheckCircle,
    TrendingUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    getInventorySummary,
    addStock,
    removeStock,
    changeStatus,
    getStations,
    getBatteryModels,
    BatteryStatus,
    type InventorySummaryResponse,
    type AddStockRequest,
    type RemoveStockRequest,
    type ChangeStatusRequest,
    type Station,
    type BatteryModel,
} from '../../services/staff/inventoryApi.js';

interface InventoryManagementProps {
    stationId?: string; // optional: allow selecting from dropdown
}

export function InventoryManagement({ stationId: initialStationId }: InventoryManagementProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [inventory, setInventory] = useState<InventorySummaryResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Station & models dropdown
    const [stations, setStations] = useState<Station[]>([]);
    const [batteryModels, setBatteryModels] = useState<BatteryModel[]>([]);
    const [selectedStationId, setSelectedStationId] = useState<string>(initialStationId || '');
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);

    // Dialogs
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showRemoveDialog, setShowRemoveDialog] = useState(false);
    const [showChangeStatusDialog, setShowChangeStatusDialog] = useState(false);

    // Forms
    const [addForm, setAddForm] = useState<AddStockRequest>({
        batteryModelId: '',
        stationId: selectedStationId,
        status: BatteryStatus.Full,
        quantity: 1,
        serialPrefix: '',
    });

    const [removeForm, setRemoveForm] = useState<RemoveStockRequest>({
        batteryModelId: '',
        stationId: selectedStationId,
        status: BatteryStatus.Maintenance,
        quantity: 1,
        reason: '',
    });

    const [changeForm, setChangeForm] = useState<ChangeStatusRequest>({
        batteryModelId: '',
        stationId: selectedStationId,
        fromStatus: BatteryStatus.Charging,
        toStatus: BatteryStatus.Full,
        quantity: 1,
    });

    // Load dropdowns on mount
    useEffect(() => {
        const loadDropdownData = async () => {
            try {
                setLoadingDropdowns(true);
                const [stationsData, modelsData] = await Promise.all([
                    getStations(1, 100),
                    getBatteryModels()
                ]);

                // Normalize stations response
                let stationsList: Station[] = [];
                if (stationsData && Array.isArray((stationsData as any).items)) {
                    stationsList = (stationsData as any).items;
                } else if (Array.isArray(stationsData)) {
                    stationsList = stationsData;
                } else {
                    stationsList = [];
                }
                setStations(stationsList);

                // Normalize battery models
                let modelsList: BatteryModel[] = [];
                if (Array.isArray(modelsData)) {
                    modelsList = modelsData;
                } else {
                    modelsList = [];
                }
                setBatteryModels(modelsList);
            } catch (error: any) {
                console.error('Error loading dropdown data:', error);
                toast.error('Không thể tải danh sách trạm và loại pin: ' + (error.message || ''));
                setStations([]);
                setBatteryModels([]);
            } finally {
                setLoadingDropdowns(false);
            }
        };

        loadDropdownData();
    }, []);

    // Fetch inventory when station changes
    useEffect(() => {
        if (selectedStationId) {
            fetchInventory();
        } else {
            setInventory(null);
        }
    }, [selectedStationId]);

    const fetchInventory = async () => {
        if (!selectedStationId) {
            return;
        }
        try {
            setLoading(true);
            const data = await getInventorySummary(selectedStationId);
            setInventory(data);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message;
            toast.error('Không thể tải kho pin: ' + errorMsg);
            console.error('Fetch inventory error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStock = async () => {
        if (!addForm.batteryModelId || addForm.quantity < 1) {
            toast.warning('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            const result = await addStock(addForm);
            toast.success(`Đã thêm ${result.quantityAdded} pin vào kho`);
            setShowAddDialog(false);
            resetAddForm();
            fetchInventory();
        } catch (error: any) {
            toast.error('Thêm pin thất bại: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleRemoveStock = async () => {
        if (!removeForm.batteryModelId || removeForm.quantity < 1) {
            toast.warning('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            const result = await removeStock(removeForm);
            toast.success(`Đã xuất ${result.quantityRemoved} pin khỏi kho`);
            setShowRemoveDialog(false);
            resetRemoveForm();
            fetchInventory();
        } catch (error: any) {
            toast.error('Xuất pin thất bại: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleChangeStatus = async () => {
        if (!changeForm.batteryModelId || changeForm.quantity < 1) {
            toast.warning('Vui lòng điền đầy đủ thông tin');
            return;
        }
        try {
            const result = await changeStatus(changeForm);
            toast.success(`Đã cập nhật trạng thái ${result.quantityChanged} pin`);
            setShowChangeStatusDialog(false);
            resetChangeForm();
            fetchInventory();
        } catch (error: any) {
            toast.error('Cập nhật thất bại: ' + (error.response?.data?.message || error.message));
        }
    };

    const resetAddForm = () => {
        setAddForm({
            batteryModelId: '',
            stationId: selectedStationId,
            status: BatteryStatus.Full,
            quantity: 1,
            serialPrefix: '',
        });
    };

    const resetRemoveForm = () => {
        setRemoveForm({
            batteryModelId: '',
            stationId: selectedStationId,
            status: BatteryStatus.Maintenance,
            quantity: 1,
            reason: '',
        });
    };

    const resetChangeForm = () => {
        setChangeForm({
            batteryModelId: '',
            stationId: selectedStationId,
            fromStatus: BatteryStatus.Charging,
            toStatus: BatteryStatus.Full,
            quantity: 1,
        });
    };

    const getStatusIcon = (status: BatteryStatus) => {
        switch (status) {
            case BatteryStatus.Full:
                return <CheckCircle className="w-6 h-6 text-amber-600" />;
            case BatteryStatus.Charging:
                return <Zap className="w-6 h-6 text-amber-400" />;
            case BatteryStatus.Maintenance:
                return <Wrench className="w-6 h-6 text-amber-500" />;
            case BatteryStatus.Issued:
                return <TrendingUp className="w-6 h-6 text-amber-600" />;
            default:
                return <Battery className="w-6 h-6 text-gray-400" />;
        }
    };

    const calculateTotals = () => {
        if (!inventory) return { total: 0, full: 0, charging: 0, maintenance: 0, issued: 0 };

        return inventory.inventoryByModel.reduce(
            (acc: any, item: any) => ({
                total: acc.total + item.totalQuantity,
                full: acc.full + item.fullQuantity,
                charging: acc.charging + item.chargingQuantity,
                maintenance: acc.maintenance + item.maintenanceQuantity,
                issued: acc.issued + item.issuedQuantity,
            }),
            { total: 0, full: 0, charging: 0, maintenance: 0, issued: 0 }
        );
    };

    const totals = calculateTotals();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-orange-600">Kho pin</h2>
                    <p className="text-gray-600 mt-1">Quản lý tồn kho và trạng thái pin tại trạm</p>
                </div>
                <div className="flex space-x-2">
                    {!initialStationId && (
                        <div className="w-64">
                            <Label className="text-sm text-gray-600">Chọn trạm</Label>
                            <Select
                                value={selectedStationId}
                                onValueChange={(value) => {
                                    setSelectedStationId(value);
                                    setAddForm((prev: any) => ({ ...prev, stationId: value }));
                                    setRemoveForm((prev: any) => ({ ...prev, stationId: value }));
                                    setChangeForm((prev: any) => ({ ...prev, stationId: value }));
                                }}
                                disabled={loadingDropdowns}
                            >
                                <SelectTrigger className="mt-1 bg-white border border-orange-200 rounded-lg">
                                    <SelectValue placeholder={loadingDropdowns ? "Đang tải..." : "Chọn trạm"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {stations.map((station) => (
                                        <SelectItem key={station.id} value={station.id}>
                                            {station.name} — {station.city}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button
                        onClick={fetchInventory}
                        variant="outline"
                        size="sm"
                        disabled={loading || !selectedStationId}
                        className="gap-2"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                </div>
            </div>

            {/* No Station Selected Warning */}
            {!selectedStationId && (
                <Card className="border border-orange-200 rounded-lg">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-orange-100">
                                <Package className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Chưa chọn trạm</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Vui lòng chọn trạm từ dropdown bên trên để xem kho pin
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loading */}
            {loading && !inventory && (
                <Card className="border border-orange-200 rounded-lg">
                    <CardContent className="p-12 text-center">
                        <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-300 animate-spin" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Đang tải dữ liệu...</h3>
                        <p className="text-gray-500">Vui lòng đợi trong giây lát</p>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="border border-orange-200 rounded-lg">
                    <CardContent className="p-4 text-center">
                        <Package className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{totals.total}</p>
                        <p className="text-sm text-gray-500">Tổng số pin</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                                <CheckCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <p className="text-sm text-orange-600 font-medium">Pin đầy</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{totals.full}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-cyan-50 flex items-center justify-center mb-3">
                                <Zap className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-sm text-amber-600 font-medium">Đang sạc</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{totals.charging}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center mb-3">
                                <Wrench className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-sm text-amber-600 font-medium">Bảo trì</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{totals.maintenance}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl border border-orange-100 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                                <TrendingUp className="w-6 h-6 text-amber-600" />
                            </div>
                            <p className="text-sm text-amber-600 font-medium">Đang dùng</p>
                            <p className="text-3xl font-extrabold text-gray-900 mt-2">{totals.issued}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    onClick={() => setShowAddDialog(true)}
                    className="bg-gradient-to-r from-orange-300 to-orange-500 text-white shadow-md rounded-2xl px-4 py-2 flex items-center gap-2"
                    disabled={!selectedStationId || loadingDropdowns}
                >
                    <Plus className="w-4 h-4" />
                    Nhập pin
                </Button>

                <Button
                    onClick={() => setShowRemoveDialog(true)}
                    variant="outline"
                    className="border border-orange-200 text-orange-600 rounded-2xl px-4 py-2 hover:bg-orange-50"
                    disabled={!selectedStationId || loadingDropdowns}
                >
                    <Minus className="w-4 h-4 mr-2" />
                    Xuất pin
                </Button>

                <Button
                    onClick={() => setShowChangeStatusDialog(true)}
                    variant="outline"
                    className="border border-orange-200 text-orange-600 rounded-2xl px-4 py-2 hover:bg-orange-50"
                    disabled={!selectedStationId || loadingDropdowns}
                >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Đổi trạng thái
                </Button>
            </div>

            {/* Inventory list */}
            <div className="grid gap-4">
                {!loading && (!inventory || inventory.inventoryByModel.length === 0) ? (
                    <Card className="rounded-2xl border border-orange-100">
                        <CardContent className="p-12 text-center">
                            <Battery className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có pin trong kho</h3>
                            <p className="text-gray-500 mb-4">
                                {!inventory
                                    ? 'Không thể tải dữ liệu kho pin. Vui lòng kiểm tra kết nối backend.'
                                    : 'Nhấn "Nhập pin" để thêm pin mới vào kho'
                                }
                            </p>
                            <div className="text-xs text-gray-400 mt-4 space-y-1">
                                <p className="font-semibold">Debug Info:</p>
                                <p>Selected StationId: {selectedStationId || 'Not selected'}</p>
                                <p>Inventory loaded: {inventory ? 'Yes' : 'No'}</p>
                                <p>Models count: {inventory?.inventoryByModel.length || 0}</p>
                                <p>Available battery models: {batteryModels.length}</p>
                                <p>Available stations: {stations.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : inventory?.inventoryByModel && (
                    inventory.inventoryByModel.map((item: any) => (
                        <Card key={item.batteryModelId} className="rounded-2xl border border-orange-100 hover:shadow-md transition-shadow">
                            <CardHeader className="px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                                            <Battery className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold">{item.modelName}</CardTitle>
                                            <CardDescription className="text-sm text-gray-500">Tổng: {item.totalQuantity} pin</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="bg-white border-orange-200 text-orange-600 px-3 py-1 rounded-lg">
                                        {item.totalQuantity} pin
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50">
                                        {getStatusIcon(BatteryStatus.Full)}
                                        <div>
                                            <p className="text-sm text-gray-600">Đầy</p>
                                            <p className="text-xl font-bold text-emerald-900">{item.fullQuantity}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-cyan-50">
                                        {getStatusIcon(BatteryStatus.Charging)}
                                        <div>
                                            <p className="text-sm text-gray-600">Đang sạc</p>
                                            <p className="text-xl font-bold text-cyan-900">{item.chargingQuantity}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50">
                                        {getStatusIcon(BatteryStatus.Maintenance)}
                                        <div>
                                            <p className="text-sm text-gray-600">Bảo trì</p>
                                            <p className="text-xl font-bold text-yellow-900">{item.maintenanceQuantity}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50">
                                        {getStatusIcon(BatteryStatus.Issued)}
                                        <div>
                                            <p className="text-sm text-gray-600">Đang dùng</p>
                                            <p className="text-xl font-bold text-purple-900">{item.issuedQuantity}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Stock Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md rounded-2xl border border-orange-100">
                    <DialogHeader>
                        <DialogTitle className="text-orange-600">Nhập pin vào kho</DialogTitle>
                        <DialogDescription>Thêm pin mới vào kho trạm</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 p-4">
                        <div>
                            <Label>Loại pin</Label>
                            <Select
                                value={addForm.batteryModelId}
                                onValueChange={(value) => setAddForm({ ...addForm, batteryModelId: value })}
                            >
                                <SelectTrigger className="mt-1 bg-white rounded-lg border border-orange-50">
                                    <SelectValue placeholder="Chọn loại pin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batteryModels.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.name} - {model.capacity}kWh ({model.voltage}V)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Trạng thái</Label>
                            <Select
                                value={String(addForm.status)}
                                onValueChange={(value) => setAddForm({ ...addForm, status: Number(value) as BatteryStatus })}
                            >
                                <SelectTrigger className="mt-1 bg-white rounded-lg border border-orange-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Đầy</SelectItem>
                                    <SelectItem value="1">Đang sạc</SelectItem>
                                    <SelectItem value="2">Bảo trì</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Số lượng</Label>
                            <Input
                                type="number"
                                min="1"
                                max="1000"
                                value={addForm.quantity}
                                onChange={(e) => setAddForm({ ...addForm, quantity: parseInt(e.target.value) || 1 })}
                                className="mt-1 bg-white rounded-lg border border-orange-50"
                            />
                        </div>

                        <div>
                            <Label>Serial Prefix (tùy chọn)</Label>
                            <Input
                                placeholder="VD: BAT-HN-2025"
                                value={addForm.serialPrefix}
                                onChange={(e) => setAddForm({ ...addForm, serialPrefix: e.target.value })}
                                className="mt-1 bg-white rounded-lg border border-orange-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Hệ thống sẽ tự động tạo serial: PREFIX-001, PREFIX-002, ...
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-end gap-2 p-4">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-lg">
                            Hủy
                        </Button>
                        <Button onClick={handleAddStock} className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg">
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm vào kho
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Remove Stock Dialog */}
            <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <DialogContent className="max-w-md rounded-2xl border border-orange-100">
                    <DialogHeader>
                        <DialogTitle className="text-orange-600">Xuất pin khỏi kho</DialogTitle>
                        <DialogDescription>Loại bỏ pin khỏi kho (bảo trì, hỏng, chuyển trạm)</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 p-4">
                        <div>
                            <Label>Loại pin</Label>
                            <Select
                                value={removeForm.batteryModelId}
                                onValueChange={(value) => setRemoveForm({ ...removeForm, batteryModelId: value })}
                            >
                                <SelectTrigger className="mt-1 bg-white rounded-lg border border-orange-50">
                                    <SelectValue placeholder="Chọn loại pin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batteryModels.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.name} - {model.capacity}kWh ({model.voltage}V)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Trạng thái pin cần xuất</Label>
                            <Select
                                value={String(removeForm.status)}
                                onValueChange={(value) => setRemoveForm({ ...removeForm, status: Number(value) as BatteryStatus })}
                            >
                                <SelectTrigger className="mt-1 bg-white rounded-lg border border-orange-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Đầy</SelectItem>
                                    <SelectItem value="1">Đang sạc</SelectItem>
                                    <SelectItem value="2">Bảo trì</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Số lượng</Label>
                            <Input
                                type="number"
                                min="1"
                                max="1000"
                                value={removeForm.quantity}
                                onChange={(e) => setRemoveForm({ ...removeForm, quantity: parseInt(e.target.value) || 1 })}
                                className="mt-1 bg-white rounded-lg border border-orange-50"
                            />
                        </div>

                        <div>
                            <Label>Lý do (tùy chọn)</Label>
                            <Textarea
                                placeholder="VD: Pin hỏng, cần bảo trì..."
                                value={removeForm.reason}
                                onChange={(e) => setRemoveForm({ ...removeForm, reason: e.target.value })}
                                rows={3}
                                className="mt-1 bg-white rounded-lg border border-orange-50"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex justify-end gap-2 p-4">
                        <Button variant="outline" onClick={() => setShowRemoveDialog(false)} className="rounded-lg">
                            Hủy
                        </Button>
                        <Button onClick={handleRemoveStock} variant="destructive" className="rounded-lg">
                            <Minus className="w-4 h-4 mr-2" />
                            Xuất khỏi kho
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Status Dialog */}
            <Dialog open={showChangeStatusDialog} onOpenChange={setShowChangeStatusDialog}>
                <DialogContent className="max-w-md rounded-2xl border border-orange-100">
                    <DialogHeader>
                        <DialogTitle className="text-orange-600">Đổi trạng thái pin</DialogTitle>
                        <DialogDescription>Cập nhật trạng thái hàng loạt (VD: Sạc xong → Đầy)</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 p-4">
                        <div>
                            <Label>Loại pin</Label>
                            <Select
                                value={changeForm.batteryModelId}
                                onValueChange={(value) => setChangeForm({ ...changeForm, batteryModelId: value })}
                            >
                                <SelectTrigger className="mt-1 bg-white rounded-lg border border-orange-50">
                                    <SelectValue placeholder="Chọn loại pin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batteryModels.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            {model.name} - {model.capacity}kWh ({model.voltage}V)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Từ trạng thái</Label>
                            <Select
                                value={String(changeForm.fromStatus)}
                                onValueChange={(value) => setChangeForm({ ...changeForm, fromStatus: Number(value) as BatteryStatus })}
                            >
                                <SelectTrigger className="mt-1 bg-white rounded-lg border border-orange-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Đầy</SelectItem>
                                    <SelectItem value="1">Đang sạc</SelectItem>
                                    <SelectItem value="2">Bảo trì</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-center py-2">
                            <ArrowRightLeft className="w-6 h-6 text-orange-300" />
                        </div>

                        <div>
                            <Label>Sang trạng thái</Label>
                            <Select
                                value={String(changeForm.toStatus)}
                                onValueChange={(value) => setChangeForm({ ...changeForm, toStatus: Number(value) as BatteryStatus })}
                            >
                                <SelectTrigger className="mt-1 bg-white rounded-lg border border-orange-50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Đầy</SelectItem>
                                    <SelectItem value="1">Đang sạc</SelectItem>
                                    <SelectItem value="2">Bảo trì</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Số lượng</Label>
                            <Input
                                type="number"
                                min="1"
                                max="1000"
                                value={changeForm.quantity}
                                onChange={(e) => setChangeForm({ ...changeForm, quantity: parseInt(e.target.value) || 1 })}
                                className="mt-1 bg-white rounded-lg border border-orange-50"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex justify-end gap-2 p-4">
                        <Button variant="outline" onClick={() => setShowChangeStatusDialog(false)} className="rounded-lg">
                            Hủy
                        </Button>
                        <Button onClick={handleChangeStatus} className="bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg">
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Cập nhật trạng thái
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
