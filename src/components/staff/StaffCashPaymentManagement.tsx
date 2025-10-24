import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, User, Tag, CalendarDays, Badge } from 'lucide-react'; // Thêm icons khác
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale'; // Import locale tiếng Việt

// Interface PaymentListItem (Giữ nguyên)
interface PaymentListItem {
    id: string;
    userId: string;
    userName?: string | null;
    userEmail?: string | null;
    userPhone?: string | null;
    userSubscriptionId?: string | null;
    subscriptionPlanName?: string | null;
    reservationId?: string | null;
    method: string;
    type: string;
    amount: number;
    status: string;
    description?: string | null;
    createdAt: string;
    completedAt?: string | null;
    processedByStaffId?: string | null;
    processedByStaffName?: string | null;
}

// Interface ConfirmResponse (Giữ nguyên)
interface ConfirmResponse {
    success: boolean;
    paymentId: string;
    status?: string | null;
    message?: string | null;
}

export function StaffCashPaymentManagement() {
    const [payments, setPayments] = useState<PaymentListItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // Hàm fetchPendingCashPayments (Giữ nguyên)
    const fetchPendingCashPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<{ payments: PaymentListItem[] }>(
                'http://localhost:5194/api/v1/payments', // Kiểm tra URL
                {
                    params: { status: 0, method: 1, pageSize: 100 },
                    withCredentials: true,
                }
            );
            setPayments(response.data.payments || []);
        } catch (err: any) {
            console.error("Error fetching payments:", err);
            setError("Không thể tải danh sách thanh toán.");
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    // useEffect gọi fetch (Giữ nguyên)
    useEffect(() => {
        fetchPendingCashPayments();
    }, []);

    // Hàm handleConfirmCash (Giữ nguyên)
    const handleConfirmCash = async (paymentId: string) => {
        if (confirmingId) return;
        setConfirmingId(paymentId);
        try {
            const response = await axios.post<ConfirmResponse>(
                `http://localhost:5194/api/v1/payments/${paymentId}/complete-cash`, // Kiểm tra URL
                {},
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success(response.data.message || 'Xác nhận thành công!');
                setPayments(prev => prev.filter(p => p.id !== paymentId));
            } else {
                toast.error(response.data.message || 'Xác nhận thất bại.');
            }
        } catch (err: any) {
            console.error("Error confirming payment:", err);
            toast.error(err.response?.data?.message || 'Lỗi khi xác nhận.');
        } finally {
            setConfirmingId(null);
        }
    };

    // --- Render UI ---

    // Loading state (Giữ nguyên)
    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" /> <p className="ml-2">Đang tải...</p>
            </div>
        );
    }

    // Error state (Giữ nguyên)
    if (error) {
        return (
            <div className="text-center py-10 text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" /> <p>{error}</p>
                <Button onClick={fetchPendingCashPayments} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
                </Button>
            </div>
        );
    }

    // ✅ Render danh sách Card thay vì Table
    return (
        <div className="space-y-4"> {/* Container chính với space giữa các Card */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold tracking-tight">Xác nhận thanh toán tiền mặt</h2>
                <Button onClick={fetchPendingCashPayments} variant="outline" size="sm" disabled={loading || !!confirmingId}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                </Button>
            </div>

            {payments.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Không có thanh toán tiền mặt nào đang chờ.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> {/* Layout grid cho Cards */}
                    {payments.map((payment) => (
                        <Card key={payment.id} className="flex flex-col"> {/* Thêm flex flex-col */}
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="text-lg font-semibold text-orange-600">
                                        {payment.amount.toLocaleString('vi-VN')} VND
                                    </span>
                                    <Badge > {/* variant đặt trên Badge */}
                                        <Tag className="w-4 h-4 mr-1" /> {/* Icon chỉ có className */}
                                        {payment.type === 'Subscription' ? 'Mua gói' : 'Đặt lẻ'} {/* Text nằm cạnh icon, không phải con của icon */}
                                    </Badge>
                                </CardTitle>
                                <CardDescription className="flex items-center pt-1">
                                    <CalendarDays className="w-4 h-4 mr-1.5 text-gray-500" />
                                    {format(new Date(payment.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2 text-sm"> {/* Thêm flex-grow */}
                                <div className="flex items-start">
                                    <User className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                                    <div>
                                        <span className="font-medium">{payment.userName || 'Khách lẻ'}</span>
                                        {payment.userEmail && <span className="block text-xs text-gray-500">{payment.userEmail}</span>}
                                        {payment.userPhone && <span className="block text-xs text-gray-500">{payment.userPhone}</span>}
                                    </div>
                                </div>
                                {(payment.subscriptionPlanName || payment.description) && (
                                    <div className="flex items-start">
                                        <Tag className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                                        <span className="text-gray-700">{payment.subscriptionPlanName || payment.description}</span>
                                    </div>
                                )}
                                {/* Bạn có thể thêm các thông tin khác nếu cần */}
                            </CardContent>
                            {/* Di chuyển Button vào CardFooter hoặc để ở cuối CardContent */}
                            <div className="p-4 pt-0"> {/* Padding top 0 nếu để cuối Content */}
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                    onClick={() => handleConfirmCash(payment.id)}
                                    disabled={confirmingId === payment.id || !!confirmingId}
                                >
                                    {confirmingId === payment.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Xác nhận đã thu tiền
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}