import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";

export function PaymentResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<"success" | "failure" | "error">("error");
    const [paymentType, setPaymentType] = useState<string>("subscription"); // "subscription" or "payperswap"
    const [txnRef, setTxnRef] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [responseCode, setResponseCode] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        const processPayment = () => {
            // Check if this is from backend redirect (has 'status' param)
            const backendStatus = searchParams.get("status");
            const type = searchParams.get("type") || "subscription"; // Default to subscription

            console.log("Processing payment result. Backend status:", backendStatus, "Type:", type);

            if (backendStatus) {
                // Already processed by backend - just display result
                console.log("✅ Payment already processed by backend");
                setPaymentStatus(backendStatus as any);
                setPaymentType(type);
                setTxnRef(searchParams.get("ref") || "");
                setAmount(searchParams.get("amount") || "");
                setResponseCode(searchParams.get("code") || "");
                setIsLoading(false);
            } else {
                // Direct from VNPay - this shouldn't happen with our current setup
                // But handle it just in case
                console.warn("⚠️ Received VNPay params directly without backend processing");
                const vnpResponseCode = searchParams.get("vnp_ResponseCode");
                const vnpTransactionStatus = searchParams.get("vnp_TransactionStatus");
                const vnpTxnRef = searchParams.get("vnp_TxnRef");
                const vnpAmount = searchParams.get("vnp_Amount");

                setTxnRef(vnpTxnRef || "");
                setAmount(vnpAmount || "");
                setResponseCode(vnpResponseCode || "");

                // Check if payment was successful based on VNPay response codes
                if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
                    setPaymentStatus("success");
                } else {
                    setPaymentStatus("failure");
                }

                setIsLoading(false);
            }
        };

        processPayment();
    }, [searchParams]);

    const handleBackToDashboard = () => {
        navigate("/driver", { state: { initialSection: "profile" } });
    };

    const handleRetry = () => {
        // Redirect dựa trên loại thanh toán
        if (paymentType === "payperswap") {
            navigate("/driver", { state: { initialSection: "booking" } });
        } else {
            navigate("/driver", { state: { initialSection: "subscription-plans" } });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-12 pb-8 text-center">
                        <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">Đang xử lý kết quả thanh toán...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader className="text-center pb-8 pt-12">
                    {paymentStatus === "success" ? (
                        <>
                            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-green-600 mb-3">
                                Thanh toán thành công!
                            </CardTitle>
                            <CardDescription className="text-lg text-gray-600">
                                {paymentType === "payperswap"
                                    ? "Đặt lịch đổi pin của bạn đã được xác nhận thành công."
                                    : "Gói đăng ký của bạn đã được kích hoạt thành công."}
                            </CardDescription>
                        </>
                    ) : paymentStatus === "failure" ? (
                        <>
                            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-red-600 mb-3">
                                Thanh toán thất bại
                            </CardTitle>
                            <CardDescription className="text-lg text-gray-600">
                                Giao dịch không thành công. Vui lòng thử lại.
                            </CardDescription>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle className="w-12 h-12 text-yellow-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-yellow-600 mb-3">
                                Có lỗi xảy ra
                            </CardTitle>
                            <CardDescription className="text-lg text-gray-600">
                                {errorMessage || "Không thể xác nhận trạng thái thanh toán. Vui lòng kiểm tra lại."}
                            </CardDescription>
                        </>
                    )}
                </CardHeader>

                <CardContent className="px-8 pb-12">
                    {/* Transaction Details */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
                        <h3 className="font-semibold text-gray-800 mb-4 text-lg">Chi tiết giao dịch</h3>

                        {txnRef && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">Mã giao dịch:</span>
                                <span className="font-medium text-gray-800">{txnRef}</span>
                            </div>
                        )}

                        {amount && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">Số tiền:</span>
                                <span className="font-bold text-orange-600 text-lg">
                                    {(parseInt(amount) / 100).toLocaleString('vi-VN')} VND
                                </span>
                            </div>
                        )}

                        {responseCode && paymentStatus === "failure" && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Mã lỗi:</span>
                                <span className="font-medium text-red-600">{responseCode}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">Trạng thái:</span>
                            <span className={`font-semibold ${paymentStatus === "success" ? "text-green-600" :
                                paymentStatus === "failure" ? "text-red-600" :
                                    "text-yellow-600"
                                }`}>
                                {paymentStatus === "success" ? "Thành công" :
                                    paymentStatus === "failure" ? "Thất bại" :
                                        "Không xác định"}
                            </span>
                        </div>
                    </div>

                    {/* Success Message */}
                    {paymentStatus === "success" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            {paymentType === "payperswap" ? (
                                <p className="text-green-800 text-sm">
                                    ✓ Lịch hẹn đổi pin của bạn đã được xác nhận.
                                    <br />
                                    ✓ Vui lòng đến trạm đúng giờ đã đặt để thực hiện đổi pin.
                                    <br />
                                    ✓ Bạn có thể xem chi tiết lịch hẹn trong mục "Lịch hẹn của tôi".
                                </p>
                            ) : (
                                <p className="text-green-800 text-sm">
                                    ✓ Gói đăng ký đã được kích hoạt và có hiệu lực trong 30 ngày.
                                    <br />
                                    ✓ Bạn có thể bắt đầu sử dụng dịch vụ đổi pin ngay bây giờ.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Failure Message */}
                    {paymentStatus === "failure" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800 text-sm font-medium mb-2">
                                Lý do có thể:
                            </p>
                            <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                                <li>Số dư tài khoản không đủ</li>
                                <li>Thông tin thẻ không chính xác</li>
                                <li>Giao dịch bị hủy bởi người dùng</li>
                                <li>Lỗi kết nối với ngân hàng</li>
                            </ul>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8">
                        <Button
                            onClick={handleBackToDashboard}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 text-base"
                        >
                            Về trang chủ
                        </Button>

                        {paymentStatus !== "success" && (
                            <Button
                                onClick={handleRetry}
                                variant="outline"
                                className="flex-1 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-6 text-base"
                            >
                                Thử lại
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
