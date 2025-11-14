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
import { useLanguage } from '../LanguageContext';

interface MyPaymentItem {
    id: string;
    method: string;
    type: string;
    amount: number;
    status: string;
    description?: string | null;
    subscriptionPlanName?: string | null;
    createdAt: string;
    paymentUrl?: string | null;
}

interface SelectCashResponse {
    success: boolean;
    message?: string | null;
    paymentId: string;
    amount: number;
    instructions?: string | null;
}

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
    const { t } = useLanguage();
    const [allPayments, setAllPayments] = useState<MyPaymentItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [switchingId, setSwitchingId] = useState<string | null>(null);
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [filterDate, setFilterDate] = useState<string>('');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 6;

    const fetchMyPayments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<MyPaymentsApiResponse>(
                'http://localhost:5194/api/v1/payments/my-payments',
                {
                    params: {
                        pageSize: 100,
                    },
                    withCredentials: true,
                }
            );
            setAllPayments(response.data.payments || []);
        } catch (err: any) {
            console.error("Lỗi khi tải hóa đơn:", err);
            setError(t("driver.payments.errorLoadFailed"));
            setAllPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyPayments();
    }, []);

    const filteredAndSortedPayments = allPayments
        .filter((payment) => {
            const matchesType = filterType === 'all' || payment.type === filterType;

            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'Pending' && payment.status.toLowerCase() === 'pending') ||
                (filterStatus === 'Paid' && payment.status.toLowerCase() === 'paid') ||
                (filterStatus === 'Completed' && payment.status.toLowerCase() === 'completed');

            let matchesPrice = true;
            if (minPrice) {
                const min = Number(minPrice);
                if (!isNaN(min)) matchesPrice = matchesPrice && payment.amount >= min;
            }
            if (maxPrice) {
                const max = Number(maxPrice);
                if (!isNaN(max)) matchesPrice = matchesPrice && payment.amount <= max;
            }

            const matchesDate = !filterDate ||
                format(new Date(payment.createdAt), 'yyyy-MM-dd') === filterDate;

            return matchesType && matchesStatus && matchesPrice && matchesDate;
        })
        .sort((a, b) => {
            const aIsPending = a.status.toLowerCase() === 'pending';
            const bIsPending = b.status.toLowerCase() === 'pending';

            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    const totalPages = Math.ceil(filteredAndSortedPayments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPayments = filteredAndSortedPayments.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterStatus, minPrice, maxPrice, filterDate]);

    const handleSwitchToCash = async (paymentId: string) => {
        if (switchingId) return;

        setSwitchingId(paymentId);

        try {
            const response = await axios.post<SelectCashResponse>(
                `http://localhost:5194/api/v1/payments/${paymentId}/select-cash`,
                {},
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success(response.data.message || t("driver.payments.successSwitchToCash"));
                setAllPayments(prevPayments =>
                    prevPayments.map(p =>
                        p.id === paymentId ? { ...p, method: 'Cash' } : p
                    )
                );
            } else {
                toast.error(response.data.message || t("driver.payments.errorSwitchFailed"));
            }
        } catch (err: any) {
            console.error("Lỗi khi đổi sang tiền mặt:", err);
            toast.error(err.response?.data?.message || t("driver.payments.errorGeneric"));
        } finally {
            setSwitchingId(null);
        }
    };

    const handleRetryVNPay = async (paymentId: string) => {
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
                toast.success(t("driver.payments.redirectingToVNPay"));
                setTimeout(() => {
                    window.location.href = response.data.paymentUrl!;
                }, 500);
            } else {
                toast.error(response.data.message || t("driver.payments.errorCreateVNPayLink"));
            }
        } catch (err: any) {
            console.error("Lỗi khi tạo link VNPay:", err);
            toast.error(err.response?.data?.message || t("driver.payments.errorGeneric"));
        } finally {
            setRegeneratingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p className="ml-2">{t("driver.payments.loadingPayments")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-600">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <Button onClick={fetchMyPayments} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" /> {t("driver.history.retryButton")}
                </Button>
            </div>
        );
    }

    return (
        <div className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                        {t("driver.payments.title")}
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        {t("driver.payments.description")}
                    </p>
                </div>

                <div className="space-y-6">
                    <Card className="border-2">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <Label className="mb-2 block text-xs text-gray-600">{t("driver.payments.filterType")}</Label>
                                    <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger className="w-full">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder={t("driver.payments.filterType")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("driver.history.filterAll")}</SelectItem>
                                            <SelectItem value="Subscription">{t("driver.payments.typeSubscription")}</SelectItem>
                                            <SelectItem value="PayPerSwap">{t("driver.payments.typePerSwap")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="mb-2 block text-xs text-gray-600">{t("driver.payments.filterStatus")}</Label>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-full">
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder={t("driver.payments.filterStatus")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("driver.history.filterAll")}</SelectItem>
                                            <SelectItem value="Pending">{t("driver.payments.statusPending")}</SelectItem>
                                            <SelectItem value="Paid">{t("driver.payments.statusPaid")}</SelectItem>
                                            <SelectItem value="Completed">{t("driver.payments.statusCompleted")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="mb-2 block text-xs text-gray-600">{t("driver.payments.minPriceLabel")}</Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder={t("driver.payments.minPricePlaceholder")}
                                            value={minPrice ? Number(minPrice).toLocaleString('vi-VN') : ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setMinPrice(value);
                                            }}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-2 block text-xs text-gray-600">{t("driver.payments.maxPriceLabel")}</Label>
                                    <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder={t("driver.payments.maxPricePlaceholder")}
                                            value={maxPrice ? Number(maxPrice).toLocaleString('vi-VN') : ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                setMaxPrice(value);
                                            }}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                                    </div>
                                </div>

                                <div>
                                    <Label className="mb-2 block text-xs text-gray-600">{t("driver.payments.dateLabel")}</Label>
                                    <input
                                        type="date"
                                        className="h-10 w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {t("driver.payments.displayingCount")} <span className="font-semibold text-orange-600">{currentPayments.length}</span>{t("driver.payments.ofTotal")}{filteredAndSortedPayments.length} {t("driver.payments.totalPayments")}
                                    {filteredAndSortedPayments.length !== allPayments.length && (
                                        <span className="text-gray-400"> {t("driver.payments.filteredFrom")} {allPayments.length}{t("driver.payments.filteredFromEnd")}</span>
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
                                    {t("driver.payments.clearFilters")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {filteredAndSortedPayments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12">
                                <div className="text-center text-gray-500">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-lg font-medium">{t("driver.payments.noPayments")}</p>
                                    <p className="text-sm mt-1">{t("driver.payments.noPaymentsDesc")}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
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
                                                            {payment.type === 'Subscription' ? t("driver.payments.typeSubscription") : t("driver.payments.typePerSwap")}
                                                        </Badge>
                                                        {isPaid && (
                                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                {t("driver.payments.statusCompleted")}
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
                                                        <span className="text-blue-700">{t("driver.payments.statusPendingVNPay")}</span>
                                                    </div>
                                                )}
                                                {isPending && isCash && (
                                                    <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-md">
                                                        <Landmark className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                                                        <span className="text-green-700">{t("driver.payments.statusPendingCash")}</span>
                                                    </div>
                                                )}
                                                {isPaid && (
                                                    <div className="flex items-start p-3 bg-gray-50 border border-gray-200 rounded-md">
                                                        <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-gray-600 flex-shrink-0" />
                                                        <span className="text-gray-700">{t("driver.payments.statusPaidComplete")}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                            <div className="p-4 pt-0 space-y-2">
                                                {isPending && isVnPay && (
                                                    <>
                                                        <Button
                                                            variant="default"
                                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                                            size="sm"
                                                            onClick={() => handleRetryVNPay(payment.id)}
                                                            disabled={!!regeneratingId || !!switchingId}
                                                        >
                                                            {regeneratingId === payment.id ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    {t("driver.payments.buttonGeneratingLink")}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                                    {t("driver.payments.buttonPayWithVNPay")}
                                                                </>
                                                            )}
                                                        </Button>

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
                                                            {t("driver.payments.switchToCash")}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <Card>
                                    <CardContent className="py-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">
                                                {t("driver.payments.paginationPage")} {currentPage} / {totalPages}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    {t("driver.payments.paginationPrev")}
                                                </Button>

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
                                                    {t("driver.payments.paginationNext")}
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
            </div>
        </div>
    );
}