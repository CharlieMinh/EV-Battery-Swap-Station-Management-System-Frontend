import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Edit, Car, Delete, Check, CheckCircle, XCircle, Loader2 } from "lucide-react"; // Đảm bảo đã import Loader2
import { useLanguage } from "../LanguageContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";

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
    maxSwapsPerMonth: number;
    features?: string[];
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
                setPlans(res.data);
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


    return (
        <div className="container mx-auto p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-6 text-center text-orange-600">
                Các gói dịch vụ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-orange-500">{plan.name}</CardTitle>
                            <p className="text-3xl font-bold text-gray-900">
                                {plan.monthlyPrice.toLocaleString('vi-VN')} VND
                                <span className="text-base font-normal text-gray-500">/tháng</span>
                            </p>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between">
                            <ul className="my-4 space-y-2">
                                <li className="flex items-center">
                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                    {plan.maxSwapsPerMonth} lượt đổi/tháng
                                </li>

                                <li className="flex items-center">
                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                    Loại pin: {plan.batteryModel.name}
                                </li>
                            </ul>
                            <Button
                                className="w-full bg-orange-500 hover:bg-orange-600 mt-4"
                                onClick={() => handleSelectPlan(plan)}
                            >
                                Chọn gói
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>


            {selectedPlan && (
                <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Áp dụng cho xe nào?</DialogTitle>
                            <DialogDescription>
                                Bạn đã chọn: <span className="font-bold text-orange-600">{selectedPlan.name}</span>.
                                <br />
                                Gói này chỉ tương thích với các xe sử dụng pin <span className="font-medium">{selectedPlan.batteryModel.name}</span>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                            {myVehicles.length > 0 ? myVehicles.map((vehicle) => {

                                const isCompatible = vehicle.compatibleBatteryModelId === selectedPlan.batteryModel.id;
                                const isSelected = selectedVehicleId === vehicle.id;

                                return (
                                    <Card
                                        key={vehicle.id}
                                        className={`transition-all ${isSelected ? 'border-2 border-orange-500 bg-orange-50'
                                            : (isCompatible ? 'cursor-pointer hover:border-orange-400'
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
                                                    <p className="font-bold">{vehicle.vehicleModelFullName || vehicle.brand}</p>
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
                            }) : <p>Bạn chưa có xe nào. Vui lòng thêm xe trước.</p>}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                className='bg-orange-500 text-white'
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


            {payment && (
                <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
                            <DialogDescription>
                                Đơn hàng của bạn đã được tạo. Vui lòng hoàn tất thanh toán.
                            </DialogDescription>
                        </DialogHeader>


                        <div className="my-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Gói dịch vụ:</span>
                                <span className="font-medium">{payment.planName}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Tổng cộng:</span>
                                <span className="text-orange-600">
                                    {payment.amount.toLocaleString('vi-VN')} VND
                                </span>
                            </div>
                        </div>


                        <div className="space-y-3 pt-4">
                            <Button
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={handlePayWithVNPay}
                                disabled={isLoading}
                            >

                                Thanh toán ngay bằng VNPay
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
                                onClick={handlePayWithCash}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Thanh toán tiền mặt (Tại trạm)
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}