import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
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
  Clock,
  CheckCircle,
  XCircle,
  Users,
  QrCode,
  Search,
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  Battery,
  User as UserIcon,
  Car,
  DollarSign,
  Star,
  Receipt,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getSlotReservations,
  getReservationById,
  checkInReservation,
  cancelReservation,
  getCurrentSwap,
  getSwapHistory,
  type SlotReservation,
  type SwapTransaction,
  type CheckInRequest,
  type CancelReservationRequest,
} from '../../services/staff/queueApi';
import { format } from 'date-fns';

interface QueueManagementProps {
  stationId?: number | string;
  userId?: string;
}

export function QueueManagement({ stationId, userId }: QueueManagementProps) {
  // ✅ Xử lý userId an toàn
  const resolvedUserId =
    userId && userId !== 'temp-id' && userId !== 'undefined'
      ? userId
      : localStorage.getItem('userId') || '';

  if (!resolvedUserId) {
    console.warn('⚠️ userId is missing! API calls will be skipped.');
  }

  console.log('🔍 QueueManagement using:', {
    stationId,
    userId,
    resolvedUserId,
  });

  const [activeTab, setActiveTab] = useState('queue');
  const [reservations, setReservations] = useState<SlotReservation[]>([]);
  const [currentSwap, setCurrentSwap] = useState<SwapTransaction | null>(null);
  const [swapHistory, setSwapHistory] = useState<SwapTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReservation, setSelectedReservation] =
    useState<SlotReservation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [cancelReason, setCancelReason] = useState<0 | 1 | 2 | 3>(1);
  const [cancelNote, setCancelNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!resolvedUserId) return; // ❌ tránh gọi API khi userId rỗng
    fetchReservations();
    fetchCurrentSwap();
    fetchSwapHistory();
  }, [stationId, filterStatus]);

  const fetchReservations = async () => {
    if (!resolvedUserId) {
      console.warn('❌ Skipped fetchReservations: Missing valid userId');
      return;
    }

    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');

      let statusFilter: string | undefined;
      if (filterStatus !== 'all') {
        const statusMap: Record<string, string> = {
          Pending: '0',
          CheckedIn: '1',
          Completed: '2',
          Cancelled: '3',
          Expired: '4',
        };
        statusFilter = statusMap[filterStatus];
      }

      console.log('📦 Fetching reservations:', {
        date: today,
        stationId: stationId?.toString(),
        status: statusFilter,
        userId: resolvedUserId,
      });

      const data = await getSlotReservations(
        today,
        stationId?.toString(),
        statusFilter,
        resolvedUserId
      );
      setReservations(data);
    } catch (error: any) {
      toast.error(
        'Không thể tải danh sách hàng chờ: ' +
          (error.response?.data?.message || error.message)
      );
      console.error('Fetch reservations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSwap = async () => {
    try {
      const data = await getCurrentSwap();
      setCurrentSwap(data);
    } catch (error: any) {
      console.error('Error fetching current swap:', error);
    }
  };

  const fetchSwapHistory = async (page: number = 1) => {
    try {
      const data = await getSwapHistory(page, 10);
      setSwapHistory(data.transactions);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error: any) {
      toast.error(
        'Không thể tải lịch sử: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleViewDetail = (reservation: SlotReservation) => {
    setSelectedReservation(reservation);
    setShowDetailDialog(true);
  };

  const handleCheckIn = (reservation: SlotReservation) => {
    setSelectedReservation(reservation);
    setShowCheckInDialog(true);
  };

  const handleCancelReservation = (reservation: SlotReservation) => {
    setSelectedReservation(reservation);
    setShowCancelDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Pending': { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      'CheckedIn': { label: 'Đã check-in', color: 'bg-blue-100 text-blue-800' },
      'Completed': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      'Cancelled': { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
      'Expired': { label: 'Hết hạn', color: 'bg-gray-100 text-gray-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['Pending'];
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getSwapStatusBadge = (status: string) => {
    const statusMap = {
      'CheckedIn': { label: 'Đã check-in', color: 'bg-blue-100 text-blue-800' },
      'BatteryIssued': { label: 'Đã cấp pin', color: 'bg-yellow-100 text-yellow-800' },
      'BatteryReturned': { label: 'Đã trả pin', color: 'bg-purple-100 text-purple-800' },
      'Completed': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      'Cancelled': { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['CheckedIn'];
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">Quản lý hàng chờ</h2>
        <Button
          onClick={fetchReservations}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">Hàng chờ</TabsTrigger>
          <TabsTrigger value="current">Giao dịch hiện tại</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          <Card className="border border-orange-200 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-600">Danh sách đặt lịch</CardTitle>
              <CardDescription>
                Quản lý các đặt lịch thay pin tại trạm
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
                  <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Không có đặt lịch nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <Card key={reservation.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{reservation.reservationId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{reservation.batteryModelName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {format(new Date(reservation.slotDate + 'T' + reservation.slotStartTime), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(reservation.status)}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetail(reservation)}
                              >
                                Xem chi tiết
                              </Button>
                              {reservation.status === 'Pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCheckIn(reservation)}
                                >
                                  Check-in
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          <Card className="border border-orange-200 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-600">Giao dịch hiện tại</CardTitle>
              <CardDescription>
                Theo dõi giao dịch thay pin đang diễn ra
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentSwap ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{currentSwap.userEmail}</h3>
                      <p className="text-sm text-gray-600">{currentSwap.vehicleModel}</p>
                    </div>
                    {getSwapStatusBadge(currentSwap.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Trạm</Label>
                      <p className="font-medium">{currentSwap.stationName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Biển số xe</Label>
                      <p className="font-medium">{currentSwap.vehicleLicensePlate}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Không có giao dịch nào đang diễn ra</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border border-orange-200 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-600">Lịch sử giao dịch</CardTitle>
              <CardDescription>
                Xem lịch sử các giao dịch thay pin đã hoàn thành
              </CardDescription>
            </CardHeader>
            <CardContent>
              {swapHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Chưa có lịch sử giao dịch</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {swapHistory.map((transaction) => (
                    <Card key={transaction.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{transaction.userEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{transaction.vehicleModel}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {transaction.issuedBatterySerial || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getSwapStatusBadge(transaction.status)}
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Trạm</p>
                              <p className="font-medium">{transaction.stationName}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
