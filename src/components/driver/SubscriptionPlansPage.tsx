import React, { useEffect, useState, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Edit, Car, Delete, Check, CheckCircle, XCircle, Loader2, Landmark, CreditCard, Search } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// --- Logic (Giữ nguyên) ---

interface Vehicle {
    id: string;
    compatibleBatteryModelId: string;
    vin: string;
    plate: string;
    brand: string;
    vehicleModelFullName?: string;
    compatibleBatteryModelName?: string;
    photoUrl?: string;
}
interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    maxSwapsPerMonth: number | null; // Sửa: Cho phép null
    features?: string[]; // (Cái này có vẻ không được dùng, nhưng giữ nguyên)
    benefits: string; // 👈 Thêm benefits (dựa trên file PricingSection)
    batteryModel: {
        id: string;
        name: string;
    };
}

interface Payment {
    paymentId: string;
    userSubscriptionId: string;
    paymentUrl: string;
    amount: number;
    planName: string;
    planDescription?: string;
    maxSwapsPerMonth: number;
    message: string;
}


export function SubscriptionPlansPage() {
    const { t } = useLanguage();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    // Flow mới: không cần chọn xe khi mua gói
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [payment, setPayment] = useState<Payment | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    // Bộ lọc client-side
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [minPrice, setMinPrice] = useState<string>("");
    const [maxPrice, setMaxPrice] = useState<string>("");
    const [battery, setBattery] = useState<string>("ALL");

    // Phân trang client-side
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    const navigate = useNavigate();

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
        return () => clearTimeout(handler);
    }, [search]);

    const handlePayWithVNPay = () => {
        if (payment && payment.paymentUrl) {
            toast.loading("Đang chuyển hướng đến VNPay...");
            window.location.href = decodeURIComponent(payment.paymentUrl);
            navigate("/driver", { state: { initialSection: "profile" } });
        } else {
            toast.error("Không tìm thấy link thanh toán VNPay.");
        }
    };


    const handlePayWithCash = async () => {
        if (!payment || !payment.paymentId) return;

        setIsLoading(true);

        try {
            const response = await axios.post(
                `http://localhost:5194/api/v1/payments/${payment.paymentId}/select-cash`,
                {},
                { withCredentials: true }
            );

            toast.success("Đã tạo đơn hàng của bạn ! Hãy đến trạm để thực hiện hoàn tất thanh toán  ");
            setIsPaymentModalOpen(false);


        } catch (error: any) {
            const msg = error.response?.data?.message || "Không thể chọn phương thức tiền mặt.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePendingSubscription = async (plan: SubscriptionPlan) => {
        setIsLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5194/api/v1/subscriptions/create-pending",
                {
                    subscriptionPlanId: plan.id,
                },
                { withCredentials: true }
            );

            setPayment(response.data);
            setIsPaymentModalOpen(true);
        } catch (error: any) {
            const msg = error.response?.data?.message || "Không thể tạo đơn hàng.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const getSubscriptionPlans = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:5194/api/v1/subscription-plans",
                    {
                        withCredentials: true,
                    }
                );
                // Lọc và sắp xếp
                const sortedData = (res.data as SubscriptionPlan[])
                    .filter(p => p.monthlyPrice > 0)
                    .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
                setPlans(sortedData);
            } catch (error) {
                toast.error("Không thể lấy gói đăng ký hiện tại, vui lòng thử lại sau");
            }
        };
        getSubscriptionPlans();
    }, []);


    // Flow mới: không cần tải danh sách xe khi mua gói

    // Danh sách loại pin từ dữ liệu
    const batteryOptions = useMemo(() => {
        const set = new Set<string>();
        plans.forEach(p => {
            if (p.batteryModel?.name) set.add(p.batteryModel.name);
        });
        return Array.from(set).sort();
    }, [plans]);

    // Áp dụng lọc client-side
    const filteredPlans = useMemo(() => {
        let list = [...plans];
        if (debouncedSearch) {
            list = list.filter(p => p.name.toLowerCase().includes(debouncedSearch));
        }
        if (minPrice) {
            const min = Number(minPrice);
            if (!isNaN(min)) list = list.filter(p => p.monthlyPrice >= min);
        }
        if (maxPrice) {
            const max = Number(maxPrice);
            if (!isNaN(max)) list = list.filter(p => p.monthlyPrice <= max);
        }
        if (battery && battery !== "ALL") {
            list = list.filter(p => p.batteryModel?.name === battery);
        }
        list.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        return list;
    }, [plans, debouncedSearch, minPrice, maxPrice, battery]);

    // Tính toán phân trang client-side
    const total = filteredPlans.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, maxPage);
    const pagedPlans = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPlans.slice(start, start + pageSize);
    }, [filteredPlans, currentPage, pageSize]);


    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        // Hiển thị dialog xác nhận trước khi đăng ký
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmSubscription = () => {
        if (selectedPlan) {
            setIsConfirmDialogOpen(false);
            handleCreatePendingSubscription(selectedPlan);
        }
    };

    // --- JSX (Đã làm đẹp) ---

    return (
        // ✅ Sửa: Thêm container style giống Homepage
        <div className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ✅ Sửa: Thêm tiêu đề phụ và style lại */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        Chọn gói thuê pin phù hợp
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">Chọn một gói dịch vụ phù hợp nhất với nhu cầu di chuyển của bạn.</p>
                </div>

                {/* Filters */}
                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                            <Label className="mb-1 block">Tìm theo tên</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Nhập tên gói..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block">Giá tối thiểu</Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="VD: 100.000"
                                    value={minPrice ? Number(minPrice).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setMinPrice(value);
                                        setPage(1);
                                    }}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block">Giá tối đa</Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="VD: 1.000.000"
                                    value={maxPrice ? Number(maxPrice).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        setMaxPrice(value);
                                        setPage(1);
                                    }}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">đ</span>
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1 block">Loại pin</Label>
                            <Select value={battery} onValueChange={(v) => { setBattery(v); setPage(1); }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    {batteryOptions.map(b => (
                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pagedPlans.map((plan, index) => {
                        // Tách lợi ích (giống PricingSection)
                        const features = (plan.benefits || "").split('\n').filter(f => f.trim() !== "" && f.trim() !== "✓");


                        return (
                            <Card
                                key={plan.id}
                                className={`flex flex-col relative rounded-2xl shadow-lg transition-transform duration-300 hover:scale-105 bg-white"
                                    }`}
                            >


                                {/* ✅ Sửa: Tên gói to lên, giá nhỏ xuống, căn giữa */}
                                <CardHeader className="text-center pt-10 pb-6">
                                    <CardTitle className="text-2xl font-bold text-gray-900 h-16">
                                        {plan.name}
                                    </CardTitle>
                                    <div className="mt-2">
                                        <span className="text-3xl font-bold text-orange-600 tracking-tight">
                                            {plan.monthlyPrice.toLocaleString('vi-VN')}
                                        </span>
                                        <span className="text-lg font-medium text-gray-500 ml-1"> VND/tháng</span>
                                    </div>
                                    <CardDescription className="pt-4 text-base text-gray-600 h-24 overflow-hidden">
                                        {plan.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-grow flex flex-col justify-between p-6 pt-0">
                                    <ul className="my-4 space-y-3 pt-6 border-t">
                                        <li className="flex items-start">
                                            <CheckCircle className="w-5 h-5 text-orange-500 mr-2.5 flex-shrink-0" />
                                            <span className="text-gray-600">
                                                {/* Hiển thị "Không giới hạn" nếu maxSwapsPerMonth là null */}
                                                {plan.maxSwapsPerMonth ? `${plan.maxSwapsPerMonth} lượt đổi/tháng` : "Đổi pin không giới hạn"}
                                            </span>
                                        </li>
                                        {/* Lặp qua các lợi ích (benefits) */}
                                        {features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-start">
                                                <CheckCircle className="w-5 h-5 text-orange-500 mr-2.5 flex-shrink-0" />
                                                <span className="text-gray-600">{feature.replace('✓', '').trim()}</span>
                                            </li>
                                        ))}
                                        {/* ❌ Bỏ: Dòng "Loại pin" */}
                                    </ul>
                                    <Button
                                        className={`w-full py-5 text-base font-semibold rounded-lg shadow-md transition-all duration-300 bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50"
                                            }`}

                                        onClick={() => handleSelectPlan(plan)}
                                    >
                                        Chọn gói
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="mt-8 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Tổng: {total.toLocaleString('vi-VN')} gói
                        </div>
                        <div className="flex items-center gap-3">
                            <Label className="text-sm">Hiển thị</Label>
                            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[6, 9, 12, 18].map(n => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                >
                                    Trang trước
                                </Button>
                                <span className="text-sm">Trang {currentPage}/{maxPage}</span>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(maxPage, p + 1))}
                                    disabled={currentPage >= maxPage}
                                >
                                    Trang sau
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredPlans.length === 0 && (
                    <p className="text-center text-gray-500 text-lg py-12">Không tìm thấy gói nào phù hợp với tiêu chí lọc.</p>
                )}

                {/* Dialog Xác Nhận Đăng Ký Gói */}
                {selectedPlan && (
                    <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                        <DialogContent className="max-w-lg rounded-xl">
                            <DialogHeader className="text-center">
                                <DialogTitle className="text-2xl font-bold text-gray-900">
                                    Xác nhận đăng ký gói
                                </DialogTitle>
                                <DialogDescription className="text-base text-gray-600 pt-4">
                                    Bạn có chắc chắn muốn đăng ký gói{" "}
                                    <span className="font-bold text-orange-600">{selectedPlan.name}</span>?
                                </DialogDescription>
                            </DialogHeader>

                            <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-900 font-medium mb-2">
                                    📌 Lưu ý quan trọng:
                                </p>
                                <p className="text-sm text-blue-800">
                                    Gói này chỉ áp dụng với những xe có model pin{" "}
                                    <span className="font-bold">{selectedPlan.batteryModel.name}</span>.
                                    <br />
                                    Hãy đảm bảo bạn sở hữu xe với model pin này trước khi mua gói.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsConfirmDialogOpen(false)}
                                    disabled={isLoading}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6"
                                    onClick={handleConfirmSubscription}
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Xác nhận đăng ký
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* --- Dialog Thanh Toán (Làm đẹp) --- */}
                {payment && (
                    <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                        <DialogContent className="max-w-md rounded-xl">
                            <DialogHeader className="text-center">
                                <DialogTitle className="text-2xl font-bold text-gray-900">Hoàn tất thanh toán</DialogTitle>
                                <DialogDescription className="text-base text-gray-600 pt-2">
                                    Đơn hàng của bạn đã được tạo. Vui lòng chọn phương thức.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="my-6 space-y-3 border-t border-b py-6">
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-600">Gói dịch vụ:</span>
                                    <span className="font-medium text-gray-800 text-right">{payment.planName}</span>
                                </div>
                                <div className="flex justify-between items-baseline text-lg font-bold">
                                    <span>Tổng cộng:</span>
                                    <span className="text-3xl font-extrabold text-orange-600">
                                        {payment.amount.toLocaleString('vi-VN')} VND
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Button
                                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-5 text-base rounded-lg shadow-md"
                                    onClick={handlePayWithVNPay}
                                    disabled={isLoading}
                                >
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    Thanh toán ngay bằng VNPay
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-semibold py-5 text-base rounded-lg"
                                    onClick={handlePayWithCash}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Landmark className="mr-2 h-5 w-5" />}
                                    Thanh toán tiền mặt (Tại trạm)
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
