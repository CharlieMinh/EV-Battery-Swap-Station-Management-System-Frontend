import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
// 👈 Thêm Badge, Landmark, CreditCard
import { Badge } from "../ui/badge";
import { Edit, Car, Delete, Check, CheckCircle, XCircle, Loader2, Landmark, CreditCard } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

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
    const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);

    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [payment, setPayment] = useState<Payment | null>(null);


    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

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

    const handleCreatePendingSubscription = async () => {
        if (!selectedVehicleId || !selectedPlan) return;

        setIsLoading(true);

        try {
            const response = await axios.post(
                "http://localhost:5194/api/v1/subscriptions/create-pending",
                {
                    subscriptionPlanId: selectedPlan.id,
                    vehicleId: selectedVehicleId,
                },
                { withCredentials: true }
            );

            setPayment(response.data)
            setIsVehicleModalOpen(false);
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


    useEffect(() => {
        const getMyVehicles = async () => {
            try {
                const res = await axios.get("http://localhost:5194/api/v1/vehicles", {
                    withCredentials: true,
                });
                setMyVehicles(res.data);
            } catch (err) {
                toast.error("Không thể lấy xe bạn đã đăng ký, vui lòng thử lại sau");
            }
        };

        getMyVehicles();
    }, []);


    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setSelectedVehicleId(null);
        setIsVehicleModalOpen(true);
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {plans.map((plan, index) => {
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

                {/* --- Dialog Chọn Xe (Làm đẹp) --- */}
                {selectedPlan && (
                    <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
                        <DialogContent className="max-w-lg rounded-xl">
                            <DialogHeader className="text-center">
                                <DialogTitle className="text-2xl font-bold text-gray-900">Áp dụng cho xe nào?</DialogTitle>
                                <DialogDescription className="text-lg text-gray-600 pt-2">
                                    Gói <span className="font-bold text-orange-600">{selectedPlan.name}</span>
                                    <br />
                                    chỉ tương thích với pin <span className="font-medium text-gray-800">{selectedPlan.batteryModel.name}</span>.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="max-h-64 overflow-y-auto space-y-3 p-1">
                                {myVehicles.length > 0 ? myVehicles.map((vehicle) => {
                                    const isCompatible = vehicle.compatibleBatteryModelId === selectedPlan.batteryModel.id;
                                    const isSelected = selectedVehicleId === vehicle.id;
                                    return (
                                        <Card
                                            key={vehicle.id}
                                            className={`rounded-xl transition-all ${isSelected
                                                ? 'border-2 border-orange-500 bg-orange-50 shadow-lg'
                                                : (isCompatible
                                                    ? 'cursor-pointer hover:border-orange-400 hover:bg-gray-50'
                                                    : 'opacity-50 bg-gray-100 cursor-not-allowed')
                                                }`}
                                            onClick={() => {
                                                if (isCompatible) {
                                                    setSelectedVehicleId(vehicle.id);
                                                } else {
                                                    toast.error("Xe này không tương thích với gói pin đã chọn.");
                                                }
                                            }}
                                        >
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <Car className="w-8 h-8 text-gray-600" />
                                                    <div>
                                                        <p className="font-bold text-base text-gray-900">{vehicle.vehicleModelFullName || vehicle.brand}</p>
                                                        <p className="text-sm text-gray-600">Biển số: {vehicle.plate}</p>
                                                    </div>
                                                </div>
                                                {isCompatible ? (
                                                    isSelected && <CheckCircle className="w-6 h-6 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-6 h-6 text-red-500" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                }) : <p className="text-center text-gray-500 py-4">Bạn chưa có xe nào. Vui lòng thêm xe trước.</p>}
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    className='bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg'
                                    onClick={handleCreatePendingSubscription}
                                    disabled={!selectedVehicleId || isLoading}
                                >
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isLoading ? "Đang xử lý..." : "Tiếp tục"}
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
