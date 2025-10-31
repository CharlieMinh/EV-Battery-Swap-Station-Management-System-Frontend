import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, Loader2, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import axios from "axios";
import { toast } from "react-toastify";
import { InspectionBookingWizard } from "./InspectionBookingWizard";

// Enum cho trạng thái khiếu nại
enum ComplaintStatus {
    PendingScheduling = 0,
    Scheduled = 1,
    CheckedIn = 2,
    Investigating = 3,
    Confirmed = 4,
    Rejected = 5,
    Resolved = 6,
}

// Interface cho khiếu nại
interface BatteryComplaint {
    id: string;
    status: ComplaintStatus;
    complaintDetails: string;
    reportDate: string;
    issuedBatterySerial: string;
    stationName: string;
    swapTransactionId: string;
    scheduledDate?: string;
    inspectionNotes?: string;
    resolutionDetails?: string;
}

export function ComplaintsList() {
    const { t } = useLanguage();

    const [complaints, setComplaints] = useState<BatteryComplaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State cho dialog đặt lịch
    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<BatteryComplaint | null>(null);

    const fetchComplaints = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:5194/api/driver/complaints",
                { withCredentials: true }
            );
            setComplaints(response.data);
        } catch (error: any) {
            const msg = error.response?.data?.message || "Không thể tải danh sách khiếu nại";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    // Map status sang văn bản và màu sắc
    const getStatusInfo = (status: ComplaintStatus) => {
        switch (status) {
            case ComplaintStatus.PendingScheduling:
                return { text: "Chờ đặt lịch", color: "bg-yellow-500", icon: Clock };
            case ComplaintStatus.Scheduled:
                return { text: "Đã đặt lịch", color: "bg-blue-500", icon: Calendar };
            case ComplaintStatus.CheckedIn:
                return { text: "Đã check-in", color: "bg-purple-500", icon: CheckCircle };
            case ComplaintStatus.Investigating:
                return { text: "Đang kiểm tra", color: "bg-orange-500", icon: AlertCircle };
            case ComplaintStatus.Confirmed:
                return { text: "Đã xác nhận lỗi", color: "bg-red-500", icon: AlertCircle };
            case ComplaintStatus.Rejected:
                return { text: "Bị từ chối", color: "bg-gray-500", icon: XCircle };
            case ComplaintStatus.Resolved:
                return { text: "Đã giải quyết", color: "bg-green-500", icon: CheckCircle };
            default:
                return { text: "Không xác định", color: "bg-gray-400", icon: AlertCircle };
        }
    };

    // Handler đặt lịch kiểm tra
    const handleScheduleInspection = (complaint: BatteryComplaint) => {
        setSelectedComplaint(complaint);
        setIsBookingDialogOpen(true);
    };

    const handleBookingSuccess = () => {
        // Refresh danh sách sau khi đặt lịch thành công
        fetchComplaints();
    };

    return (
        <div className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                        Khiếu nại của tôi
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Theo dõi và quản lý các khiếu nại về pin bạn đã báo cáo.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
                    </div>
                ) : complaints.length === 0 ? (
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="text-center py-12">
                            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-600">Bạn chưa có khiếu nại nào</p>
                            <p className="text-gray-500 mt-2">
                                Nếu gặp vấn đề với pin, hãy báo cáo từ lịch sử giao dịch.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {complaints.map((complaint) => {
                            const statusInfo = getStatusInfo(complaint.status);
                            const StatusIcon = statusInfo.icon;
                            const reportTime = new Date(complaint.reportDate).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                            });

                            return (
                                <Card
                                    key={complaint.id}
                                    className="flex flex-col rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge className={`${statusInfo.color} text-white`}>
                                                <StatusIcon className="w-4 h-4 mr-1" />
                                                {statusInfo.text}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg font-bold text-gray-900">
                                            Khiếu nại #{complaint.id.substring(0, 8)}
                                        </CardTitle>
                                        <CardDescription className="text-sm text-gray-600">
                                            Báo cáo lúc: {reportTime}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-grow space-y-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Trạm:</p>
                                            <p className="text-base text-gray-900">{complaint.stationName}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Serial pin:</p>
                                            <p className="text-base text-gray-900">{complaint.issuedBatterySerial}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Nội dung:</p>
                                            <p className="text-sm text-gray-600 line-clamp-3">
                                                {complaint.complaintDetails}
                                            </p>
                                        </div>

                                        {complaint.status === ComplaintStatus.PendingScheduling && (
                                            <div className="pt-4 border-t">
                                                <Button
                                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg"
                                                    onClick={() => handleScheduleInspection(complaint)}
                                                >
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    Đặt lịch kiểm tra
                                                </Button>
                                            </div>
                                        )}

                                        {complaint.scheduledDate && (
                                            <div className="pt-2">
                                                <p className="text-sm font-semibold text-gray-700">Lịch hẹn:</p>
                                                <p className="text-sm text-blue-600">
                                                    {new Date(complaint.scheduledDate).toLocaleString("vi-VN")}
                                                </p>
                                            </div>
                                        )}

                                        {complaint.resolutionDetails && (
                                            <div className="pt-2 border-t">
                                                <p className="text-sm font-semibold text-gray-700">Kết quả:</p>
                                                <p className="text-sm text-green-600">{complaint.resolutionDetails}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Dialog đặt lịch kiểm tra */}
            {selectedComplaint && (
                <InspectionBookingWizard
                    isOpen={isBookingDialogOpen}
                    onClose={() => setIsBookingDialogOpen(false)}
                    complaintId={selectedComplaint.id}
                    swapTransactionId={selectedComplaint.swapTransactionId}
                    onSuccess={handleBookingSuccess}
                />
            )}
        </div>
    );
}
