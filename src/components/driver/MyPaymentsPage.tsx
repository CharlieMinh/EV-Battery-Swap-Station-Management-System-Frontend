import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2, RefreshCw, AlertCircle, CreditCard, Landmark, CalendarDays, Tag } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '../ui/badge'; // Import Badge

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
    const [pendingPayments, setPendingPayments] = useState<MyPaymentItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [switchingId, setSwitchingId] = useState<string | null>(null); // Lưu ID của payment đang đổi sang tiền mặt

    // Hàm gọi API lấy danh sách payment đang chờ (Pending) của user
    const fetchMyPendingPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<MyPaymentsApiResponse>(
                'http://localhost:5194/api/v1/payments/my-payments', // URL API của bạn
                {
                    params: {
                        status: 0,
                        pageSize: 50,
                    },
                    withCredentials: true,
                }
            );
            setPendingPayments(response.data.payments || []);
        } catch (err: any) {
            console.error("Lỗi khi tải hóa đơn:", err);
            setError("Không thể tải hóa đơn. Vui lòng thử lại.");
            setPendingPayments([]);
        } finally {
            setLoading(false);
        }
    };

    // Gọi API khi component được mount
    useEffect(() => {
        fetchMyPendingPayments();
    }, []);

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
                setPendingPayments(prevPayments =>
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
                <Button onClick={fetchMyPendingPayments} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold tracking-tight">Hóa đơn chờ thanh toán</h2>
                <Button onClick={fetchMyPendingPayments} variant="outline" size="sm" disabled={loading || !!switchingId}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                </Button>
            </div>

            {pendingPayments.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Bạn không có hóa đơn nào đang chờ thanh toán.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingPayments.map((payment) => {
                        const isVnPay = payment.method.toLowerCase() === 'vnpay';
                        const isCash = payment.method.toLowerCase() === 'cash';
                        const isLoadingThis = switchingId === payment.id;

                        return (
                            <Card key={payment.id} className={`flex flex-col ${isCash ? 'border-green-200 bg-green-50/30' : ''}`}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-orange-600">
                                            {payment.amount.toLocaleString('vi-VN')} VND
                                        </span>
                                        <Badge variant={payment.type === 'Subscription' ? 'default' : 'secondary'}>
                                            {payment.type === 'Subscription' ? 'Mua gói' : 'Đặt lẻ'}
                                        </Badge>
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
                                    {isVnPay && (
                                        <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <CreditCard className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                                            <span className="text-blue-700">Đang chờ thanh toán qua VNPay.</span>
                                        </div>
                                    )}
                                    {isCash && (
                                        <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-md">
                                            <Landmark className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                                            <span className="text-green-700">Đang chờ thanh toán tiền mặt tại trạm.</span>
                                        </div>
                                    )}
                                </CardContent>
                                <div className="p-4 pt-0">
                                    {/* Chỉ hiển thị nút Đổi sang Tiền mặt nếu đang là VNPay */}
                                    {isVnPay && (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            size="sm"
                                            onClick={() => handleSwitchToCash(payment.id)}
                                            disabled={isLoadingThis || !!switchingId} // Disable nếu đang xử lý
                                        >
                                            {isLoadingThis ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Landmark className="mr-2 h-4 w-4" />
                                            )}
                                            Đổi sang thanh toán Tiền mặt
                                        </Button>
                                    )}
                                    {/* Hiển thị nút Thanh toán (bị vô hiệu hóa) vì chúng ta không thể lấy lại link */}
                                    {isVnPay && (
                                        <Button
                                            variant="default"
                                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                                            size="sm"
                                            disabled={true} // Bị vô hiệu hóa
                                        >
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Thanh toán VNPay (Đã hết hạn link)
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}