import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2, RefreshCw, AlertCircle, CreditCard, Landmark, CalendarDays, Tag, ChevronLeft, ChevronRight, X, Filter, DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

// Interface khớp với PaymentListResponse DTO backend
interface MyPaymentItem {
    id: string;
    method: string;
    type: string;
    amount: number;
    status: string;
    description?: string | null;
    subscriptionPlanName?: string | null;
    createdAt: string;
    paymentUrl?: string | null; // API có thể không trả về cái này, nhưng để dự phòng
}

// Interface khớp với SelectCashMethodResponse DTO backend
interface SelectCashResponse {
    success: boolean;
    message?: string | null;
    paymentId: string;
    amount: number;
    instructions?: string | null;
}

// Interface cho response của API /my-payments
interface MyPaymentsApiResponse {
    payments: MyPaymentItem[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}

export function MyPaymentsPage() {
    const [allPayments, setAllPayments] = useState<MyPaymentItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [switchingId, setSwitchingId] = useState<string | null>(null);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null); // ⭐ NEW: Track regenerating VNPay URL

    // Filter states
    const [filterType, setFilterType] = useState<string>('all'); // 'all', 'Subscription', 'PayPerSwap'
    const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'Pending', 'Paid', 'Completed'
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [filterDate, setFilterDate] = useState<string>(''); // Date filter

    // Pagination states
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 6;

    // Hàm gọi API lấy tất cả payment của user (không giới hạn status)
    const fetchMyPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            // Gọi API không truyền status để lấy tất cả
            const response = await axios.get<MyPaymentsApiResponse>(
                'http://localhost:5194/api/v1/payments/my-payments',
                {
                    params: {
                        pageSize: 100, // Lấy nhiều hơn để có đủ dữ liệu
                    },
                    withCredentials: true,
                }
            );
            setAllPayments(response.data.payments || []);
        } catch (err: any) {
            console.error("Lỗi khi tải hóa đơn:", err);
            setError("Không thể tải hóa đơn. Vui lòng thử lại.");
            setAllPayments([]);
        } finally {
            setLoading(false);
        }
    };

    // Gọi API khi component được mount
    useEffect(() => {
        fetchMyPayments();
    }, []);

    // Filter & Sort Logic
    const filteredAndSortedPayments = allPayments
        .filter((payment) => {
            // Type filter
            const matchesType = filterType === 'all' || payment.type === filterType;

            // Status filter
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'Pending' && payment.status.toLowerCase() === 'pending') ||
                (filterStatus === 'Paid' && payment.status.toLowerCase() === 'paid') ||
                (filterStatus === 'Completed' && payment.status.toLowerCase() === 'completed');

            // Price filter
            let matchesPrice = true;
            if (minPrice) {
                const min = Number(minPrice);
                if (!isNaN(min)) matchesPrice = matchesPrice && payment.amount >= min;
            }
            if (maxPrice) {
                const max = Number(maxPrice);
                if (!isNaN(max)) matchesPrice = matchesPrice && payment.amount <= max;
            }

            // Date filter
            const matchesDate = !filterDate ||
                format(new Date(payment.createdAt), 'yyyy-MM-dd') === filterDate;

            return matchesType && matchesStatus && matchesPrice && matchesDate;
        })
        .sort((a, b) => {
            // Sắp xếp: Pending/Cash trước, Paid/Completed sau
            const aIsPending = a.status.toLowerCase() === 'pending';
            const bIsPending = b.status.toLowerCase() === 'pending';

            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;

            // Cùng loại thì sắp xếp theo ngày mới nhất
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayments = filteredAndSortedPayments.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterStatus, minPrice, maxPrice, filterDate]);

    // Hàm xử lý khi User bấm "Đổi sang Tiền mặt"
    const handleSwitchToCash = async (paymentId: string) => {
        if (switchingId) return; // Không cho bấm nếu đang xử lý

        setSwitchingId(paymentId);

        try {
            const response = await axios.post<SelectCashResponse>(
                `http://localhost:5194/api/v1/payments/${paymentId}/select-cash`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Đã đổi sang thanh toán tiền mặt!');
                // Cập nhật lại danh sách: tìm payment vừa đổi và cập nhật method
                setAllPayments(prevPayments =>
                    prevPayments.map(p =>
                        p.id === paymentId ? { ...p, method: 'Cash' } : p
                    )
                );
            } else {
                toast.error(response.data.message || 'Đổi thất bại.');
            }
        } catch (err: any) {
            console.error("Lỗi khi đổi sang tiền mặt:", err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setSwitchingId(null); // Hoàn tất xử lý
        }
    };

    // ⭐ NEW: Hàm xử lý khi User bấm "Thanh toán lại VNPay"
    const handleRegenerateVnPayUrl = async (paymentId: string) => {
        if (regeneratingId) return;

        setRegeneratingId(paymentId);

        try {
            const response = await axios.post<{
                success: boolean;
                message?: string;
                paymentId: string;
                paymentUrl?: string;
                amount: number;
            }>(
                `http://localhost:5194/api/v1/payments/${paymentId}/regenerate-vnpay-url`,
                {},
                { withCredentials: true }
            );

            if (response.data.success && response.data.paymentUrl) {
                toast.success('Đang chuyển hướng đến VNPay...');
                // Redirect to VNPay
                setTimeout(() => {
                    window.location.href = response.data.paymentUrl!;
                }, 500);
            } else {
                toast.error(response.data.message || 'Không thể tạo link thanh toán VNPay.');
            }
        } catch (err: any) {
            console.error("Lỗi khi tạo link VNPay:", err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
        } finally {
            setRegeneratingId(null);
        }
    };

    // --- Render UI ---

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="ml-2">Đang tải hóa đơn chờ...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <Button onClick={fetchMyPayments} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Hóa đơn của tôi
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Quản lý tất cả hóa đơn của bạn
                    </p>
                </div>
                <Button onClick={fetchMyPayments} variant="outline" size="sm" disabled={loading || !!switchingId} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-2">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Filter by Type */}
                        <div>
                            <Label className="mb-2 block text-xs text-gray-600">Loại hóa đơn</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-full">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Loại hóa đơn" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả loại</SelectItem>
                                    <SelectItem value="Subscription">Mua gói</SelectItem>
                                    <SelectItem value="PayPerSwap">Đặt lẻ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Filter by Status */}
                        <div>
                            <Label className="mb-2 block text-xs text-gray-600">Trạng thái</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả</SelectItem>
                                    <SelectItem value="Pending">Chờ thanh toán</SelectItem>
                                    <SelectItem value="Paid">Đã thanh toán</SelectItem>
                                    <SelectItem value="Completed">Hoàn tất</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Min Price */}
                        <div>
                            <Label className="mb-2 block text-xs text-gray-600">Giá tối thiểu</Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="VD: 100.000"
                                    value={minPrice ? Number(minPrice).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setMinPrice(value);
                                    }}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                            </div>
                        </div>

                        {/* Max Price */}
                        <div>
                            <Label className="mb-2 block text-xs text-gray-600">Giá tối đa</Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="VD: 1.000.000"
                                    value={maxPrice ? Number(maxPrice).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setMaxPrice(value);
                                    }}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div>
                            <Label className="mb-2 block text-xs text-gray-600">Ngày tạo</Label>
                            <input
                                type="date"
                                className="h-10 w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Clear filters button */}
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-semibold text-orange-600">{currentPayments.length}</span> / {filteredAndSortedPayments.length} hóa đơn
                            {filteredAndSortedPayments.length !== allPayments.length && (
                                <span className="text-gray-400"> (đã lọc từ {allPayments.length})</span>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setFilterType('all');
                                setFilterStatus('all');
                                setMinPrice('');
                                setMaxPrice('');
                                setFilterDate('');
                            }}
                            disabled={filterType === 'all' && filterStatus === 'all' && !minPrice && !maxPrice && !filterDate}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {filteredAndSortedPayments.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-gray-500">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-lg font-medium">Không tìm thấy hóa đơn nào</p>
                            <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc chọn ngày khác</p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Payment Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentPayments.map((payment) => {
                            const isVnPay = payment.method.toLowerCase() === 'vnpay';
                            const isCash = payment.method.toLowerCase() === 'cash';
                            const isPending = payment.status.toLowerCase() === 'pending';
                            const isPaid = payment.status.toLowerCase() === 'paid' || payment.status.toLowerCase() === 'completed';
                            const isLoadingThis = switchingId === payment.id;

                            return (
                                <Card key={payment.id} className={`flex flex-col ${isCash ? 'border-green-200 bg-green-50/30' :
                                    isPaid ? 'border-gray-200 bg-gray-50/30' : ''
                                    }`}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span className="text-lg font-semibold text-orange-600">
                                                {payment.amount.toLocaleString('vi-VN')} VND
                                            </span>
                                            <div className="flex gap-2">
                                                <Badge variant={payment.type === 'Subscription' ? 'default' : 'secondary'}>
                                                    {payment.type === 'Subscription' ? 'Mua gói' : 'Đặt lẻ'}
                                                </Badge>
                                                {isPaid && (
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Đã xong
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardTitle>
                                        <CardDescription className="flex items-center pt-1">
                                            <CalendarDays className="w-4 h-4 mr-1.5 text-gray-500" />
                                            {format(new Date(payment.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-2 text-sm">
                                        {(payment.subscriptionPlanName || payment.description) && (
                                            <div className="flex items-start">
                                                <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                                                <span className="text-gray-700">{payment.subscriptionPlanName || payment.description}</span>
                                            </div>
                                        )}
                                        {isPending && isVnPay && (
                                            <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <CreditCard className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                                                <span className="text-blue-700">Đang chờ thanh toán qua VNPay.</span>
                                            </div>
                                        )}
                                        {isPending && isCash && (
                                            <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-md">
                                                <Landmark className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                                                <span className="text-green-700">Đang chờ thanh toán tiền mặt tại trạm.</span>
                                            </div>
                                        )}
                                        {isPaid && (
                                            <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-md">
                                                <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                                                <span className="text-gray-700">Đã hoàn tất thanh toán.</span>
                                            </div>
                                        )}
                                    </CardContent>
                                    <div className="p-4 pt-0 space-y-2">
                                        {/* Chỉ hiển thị các nút nếu đang Pending và VNPay */}
                                        {isPending && isVnPay && (
                                            <>
                                                {/* Nút Thanh toán lại VNPay */}
                                                <Button
                                                    variant="default"
                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                    size="sm"
                                                    onClick={() => handleRegenerateVnPayUrl(payment.id)}
                                                    disabled={!!regeneratingId || !!switchingId}
                                                >
                                                    {regeneratingId === payment.id ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Đang tạo link...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="mr-2 h-4 w-4" />
                                                            Thanh toán VNPay
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Nút Đổi sang Tiền mặt */}
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-green-500 text-green-600 hover:bg-green-50"
                                                    size="sm"
                                                    onClick={() => handleSwitchToCash(payment.id)}
                                                    disabled={!!switchingId || !!regeneratingId}
                                                >
                                                    {switchingId === payment.id ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Landmark className="mr-2 h-4 w-4" />
                                                    )}
                                                    Đổi sang Tiền mặt
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Trang {currentPage} / {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Trước
                                        </Button>

                                        {/* Page numbers */}
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }

                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={currentPage === pageNum ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={currentPage === pageNum ? "bg-orange-500 hover:bg-orange-600" : ""}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Sau
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}