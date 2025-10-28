import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"; // 👈 Đã xóa Badge
import { useNavigate } from "react-router-dom";
// 👇 Sửa đường dẫn import (giả sử service ở src/services/driver/)
import { SubscriptionPlan, subscriptionPlanService } from "../services/driver/subscriptionPlanService";
import { useLanguage } from "./LanguageContext"; // 👈 Giữ nguyên
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"; // 👈 Giữ nguyên
import { Button } from "./ui/button"; // 👈 Giữ nguyên
import { Badge } from "./ui/badge"; // 👈 THÊM: Import Badge từ UI

// Component Card con (đã làm đẹp)
function PlanCard({ plan, isPopular }: { plan: SubscriptionPlan, isPopular: boolean }) {
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Tách các lợi ích từ chuỗi (split by newline)
    const features = plan.benefits.split('\n').filter(f => f.trim() !== "" && f.trim() !== "✓");

    return (
        <Card
            className={`flex flex-col relative rounded-2xl shadow-xl transition-transform duration-300 hover:scale-105 ${isPopular
                ? "bg-gradient-to-br from-orange-50 to-white border-2 border-orange-500" // 👈 Style cho gói Phổ biến
                : "bg-white border-transparent" // 👈 Style cho gói Thường
                }`}
        >
            {isPopular && (
                <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white text-sm font-semibold py-1 px-4 shadow-lg">
                        {t("pricing.mostPopular")}
                    </Badge>
                </div>
            )}

            {/* Header (Tên gói to, Giá nhỏ) */}
            <CardHeader className="text-center pt-10 pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-4 h-14"> {/* 👈 Tên gói to hơn & set chiều cao cố định */}
                    {plan.name}
                </CardTitle>
                <div className="mt-2">
                    <span className="text-4xl font-bold text-orange-600 tracking-tight"> {/* 👈 Giá nhỏ lại & có màu */}
                        {plan.monthlyPrice.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-base font-medium text-gray-500 ml-1"> VND/tháng</span> {/* 👈 Chữ /tháng nhỏ lại */}
                </div>
                <CardDescription className="pt-2 text-base h-20 overflow-hidden"> {/* 👈 Set chiều cao cố định */}
                    {plan.description}
                </CardDescription>
            </CardHeader>

            {/* Content (Bỏ loại pin, căn đều nút) */}
            <CardContent className="flex flex-col flex-1 justify-between space-y-6 p-6 pt-0">
                <ul className="space-y-3 pt-4 border-t">
                    {features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-orange-500 mr-2.5 flex-shrink-0" />
                            <span className="text-gray-600">{feature.replace('✓', '').trim()}</span>
                        </li>
                    ))}
                    {/* ❌ ĐÃ BỎ LOẠI PIN */}
                </ul>
                <Button
                    className={`w-full py-3 text-base font-semibold rounded-lg shadow-md transition-all duration-300 ${isPopular
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                        : "bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50"
                        }`}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => navigate("/driver", { state: { initialSection: "subscription" } })}
                >
                    {t("pricing.getStarted")}
                </Button>
            </CardContent>
        </Card>
    );
}

// Component cha tự fetch data (Giữ nguyên)
export function PricingSection() {
    const { t } = useLanguage();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await subscriptionPlanService.getActivePlans();
                // Lọc và sắp xếp (ví dụ: ưu tiên gói có giá)
                const sortedData = data
                    .filter(p => p.monthlyPrice > 0)
                    .sort((a, b) => a.monthlyPrice - b.monthlyPrice);

                setPlans(sortedData);
            } catch (err) {
                setError(t("pricing.errorLoad") || "Không thể tải gói cước"); // Thêm fallback text
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlans();
    }, [t]); // Thêm t vào dependencies

    return (
        <section id="pricing" className="py-20 bg-gray-50"> {/* Section giữ nguyên style */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        {t("pricing.title")}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t("pricing.subtitle")}</p>
                </div>

                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                    </div>
                )}

                {error && (
                    <div className="text-center text-red-600 flex flex-col items-center">
                        <AlertCircle className="w-10 h-10 mb-2" />
                        <p className="text-lg">{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Chỉ hiển thị 3 gói đầu tiên */}
                        {plans.slice(0, 3).map((plan, index) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                // Đánh dấu gói ở giữa là "phổ biến"
                                isPopular={false}
                            />
                        ))}
                    </div>
                )}

                {!loading && !error && plans.length === 0 && (
                    <p className="text-center text-gray-500 text-lg">Không tìm thấy gói cước nào.</p>
                )}
            </div>
        </section>
    );
}