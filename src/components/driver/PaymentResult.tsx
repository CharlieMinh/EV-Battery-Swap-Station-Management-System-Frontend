import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { useLanguage } from "../LanguageContext";

export function PaymentResult() {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<"success" | "failure" | "error">("error");
    const [paymentType, setPaymentType] = useState<string>("subscription");
    const [txnRef, setTxnRef] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [responseCode, setResponseCode] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        const processPayment = () => {
            const backendStatus = searchParams.get("status");
            const type = searchParams.get("type") || "subscription";

            console.log("Processing payment result. Backend status:", backendStatus, "Type:", type);

            if (backendStatus) {
                console.log("✅ Payment already processed by backend");
                setPaymentStatus(backendStatus as any);
                setPaymentType(type);
                setTxnRef(searchParams.get("ref") || "");
                setAmount(searchParams.get("amount") || "");
                setResponseCode(searchParams.get("code") || "");
                setIsLoading(false);
            } else {
                console.warn("⚠️ Received VNPay params directly without backend processing");
                const vnpResponseCode = searchParams.get("vnp_ResponseCode");
                const vnpTransactionStatus = searchParams.get("vnp_TransactionStatus");
                const vnpTxnRef = searchParams.get("vnp_TxnRef");
                const vnpAmount = searchParams.get("vnp_Amount");

                setTxnRef(vnpTxnRef || "");
                setAmount(vnpAmount || "");
                setResponseCode(vnpResponseCode || "");

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
                        <p className="text-gray-600 text-lg">{t("driver.paymentResult.processing")}</p>
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
                                {t("driver.paymentResult.titleSuccess")}
                            </CardTitle>
                            <CardDescription className="text-lg text-gray-600">
                                {paymentType === "payperswap"
                                    ? t("driver.paymentResult.successBookingMessage")
                                    : t("driver.paymentResult.successSubscriptionMessage")}
                            </CardDescription>
                        </>
                    ) : paymentStatus === "failure" ? (
                        <>
                            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <XCircle className="w-12 h-12 text-red-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-red-600 mb-3">
                                {t("driver.paymentResult.titleFailure")}
                            </CardTitle>
                            <CardDescription className="text-lg text-gray-600">
                                {t("driver.paymentResult.descriptionFailure")}
                            </CardDescription>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                                <AlertCircle className="w-12 h-12 text-yellow-600" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-yellow-600 mb-3">
                                {t("driver.paymentResult.titleError")}
                            </CardTitle>
                            <CardDescription className="text-lg text-gray-600">
                                {errorMessage || t("driver.paymentResult.errorMessage")}
                            </CardDescription>
                        </>
                    )}
                </CardHeader>

                <CardContent className="px-8 pb-12">
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
                        <h3 className="font-semibold text-gray-800 mb-4 text-lg">{t("driver.paymentResult.transactionDetailsTitle")}</h3>

                        {txnRef && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">{t("driver.paymentResult.transactionIdLabel")}</span>
                                <span className="font-medium text-gray-800">{txnRef}</span>
                            </div>
                        )}

                        {amount && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-gray-600">{t("driver.paymentResult.amountLabel")}</span>
                                <span className="font-bold text-orange-600 text-lg">
                                    {(parseInt(amount) / 100).toLocaleString('vi-VN')} VND
                                </span>
                            </div>
                        )}

                        {responseCode && paymentStatus === "failure" && (
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">{t("driver.paymentResult.errorCodeLabel")}</span>
                                <span className="font-medium text-red-600">{responseCode}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600">{t("driver.paymentResult.statusLabel")}</span>
                            <span className={`font-semibold ${paymentStatus === "success" ? "text-green-600" :
                                paymentStatus === "failure" ? "text-red-600" :
                                    "text-yellow-600"
                                }`}>
                                {paymentStatus === "success" ? t("driver.paymentResult.statusSuccess") :
                                    paymentStatus === "failure" ? t("driver.paymentResult.statusFailure") :
                                        t("driver.paymentResult.statusUnknown")}
                            </span>
                        </div>
                    </div>

                    {paymentStatus === "success" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            {paymentType === "payperswap" ? (
                                <p className="text-green-800 text-sm">
                                    {t("driver.paymentResult.noteBookingConfirmed")}
                                    <br />
                                    {t("driver.paymentResult.noteArriveOnTime")}
                                    <br />
                                    {t("driver.paymentResult.noteViewAppointment")}
                                </p>
                            ) : (
                                <p className="text-green-800 text-sm">
                                    {t("driver.paymentResult.noteSubscriptionActive")}
                                    <br />
                                    {t("driver.paymentResult.noteSubscriptionCanUseNow")}
                                </p>
                            )}
                        </div>
                    )}

                    {paymentStatus === "failure" && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800 text-sm font-medium mb-2">
                                {t("driver.paymentResult.failureReasonsTitle")}
                            </p>
                            <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                                <li>{t("driver.paymentResult.failureReasonBalance")}</li>
                                <li>{t("driver.paymentResult.failureReasonCardInfo")}</li>
                                <li>{t("driver.paymentResult.failureReasonCancelled")}</li>
                                <li>{t("driver.paymentResult.failureReasonBankError")}</li>
                            </ul>
                        </div>
                    )}

                    <div className="flex gap-4 mt-8">
                        <Button
                            onClick={handleBackToDashboard}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 text-base"
                        >
                            {t("driver.paymentResult.buttonBackToDashboard")}
                        </Button>

                        {paymentStatus !== "success" && (
                            <Button
                                onClick={handleRetry}
                                variant="outline"
                                className="flex-1 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-6 text-base"
                            >
                                {t("driver.paymentResult.buttonRetry")}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
