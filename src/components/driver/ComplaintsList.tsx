import React, { useEffect, useMemo, useState } from "react";
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

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [stationFilter, setStationFilter] = useState<string>("all");

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

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

    // Unique station names for filter
    const stationOptions = useMemo(() => {
        const set = new Set<string>();
        complaints.forEach((c) => c.stationName && set.add(c.stationName));
        return Array.from(set).sort();
    }, [complaints]);

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

    // Filter (client-side)
    const filteredComplaints = useMemo(() => {
        return complaints.filter((c) => {
            const statusOk = statusFilter === "all" || String(c.status) === statusFilter;
            const stationOk = stationFilter === "all" || c.stationName === stationFilter;
            return statusOk && stationOk;
        });
    }, [complaints, statusFilter, stationFilter]);

    // Pagination derive
    const total = filteredComplaints.length;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, maxPage);
    const paginatedComplaints = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredComplaints.slice(start, start + pageSize);
    }, [filteredComplaints, currentPage, pageSize]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [statusFilter, stationFilter]);

    const clearAll = () => {
        setStatusFilter("all");
        setStationFilter("all");
        setPage(1);
    };

    return (
        <div className="py-14 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 md:mb-14">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
                        Khiếu nại của tôi
                    </h2>
                    <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                        Theo dõi và quản lý các khiếu nại về pin bạn đã báo cáo.
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-8 bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                            <select
                                className="h-11 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value={ComplaintStatus.PendingScheduling}>Chờ đặt lịch</option>
                                <option value={ComplaintStatus.Scheduled}>Đã đặt lịch</option>
                                <option value={ComplaintStatus.CheckedIn}>Đã check-in</option>
                                <option value={ComplaintStatus.Investigating}>Đang kiểm tra</option>
                                <option value={ComplaintStatus.Confirmed}>Xác nhận lỗi</option>
                                <option value={ComplaintStatus.Rejected}>Từ chối</option>
                                <option value={ComplaintStatus.Resolved}>Đã giải quyết</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-600">Trạm</label>
                            <select
                                className="h-11 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                value={stationFilter}
                                onChange={(e) => setStationFilter(e.target.value)}
                            >
                                <option value="all">Tất cả trạm</option>
                                {stationOptions.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2 md:justify-end">
                            <div className="flex gap-2 md:justify-end mt-6">
                                <Button variant="outline" onClick={clearAll} className="h-11">Xoá bộ lọc</Button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                        Có <span className="font-semibold text-gray-900">{total}</span> khiếu nại phù hợp
                    </div>
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
                ) : total === 0 ? (
                    <Card className="max-w-2xl mx-auto">
                        <CardContent className="text-center py-12">
                            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-xl text-gray-600">Không tìm thấy khiếu nại nào phù hợp</p>
                            <p className="text-gray-500 mt-2">Hãy thử thay đổi từ khoá hoặc bộ lọc</p>
                            <div className="mt-6">
                                <Button onClick={clearAll}>Đặt lại bộ lọc</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedComplaints.map((complaint) => {
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
                                    className="flex flex-col rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge className={`${statusInfo.color} text-white`}>
                                                <StatusIcon className="w-4 h-4 mr-1" />
                                                {statusInfo.text}
                                            </Badge>
                                        </div>

                                        <CardDescription className="text-sm text-gray-600">
                                            Báo cáo: {reportTime}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-grow space-y-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Trạm:</p>
                                            <p className="text-base md:text-lg text-gray-900">{complaint.stationName}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Serial pin:</p>
                                            <p className="text-base md:text-lg text-gray-900">{complaint.issuedBatterySerial}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-gray-700">Nội dung:</p>
                                            <p className="text-sm md:text-base text-gray-600 line-clamp-3">
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
                {/* Pagination */}
                {!isLoading && total > 0 && (
                    <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            Hiển thị
                            <select
                                className="h-10 rounded-md border border-gray-200 bg-white px-2 text-sm shadow-sm"
                                value={String(pageSize)}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                            >
                                {[6, 9, 12, 18, 24].map((n) => (
                                    <option key={n} value={n}>
                                        {n} / trang
                                    </option>
                                ))}
                            </select>
                            <span className="ml-2">Tổng: {total}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                            >
                                Trang trước
                            </Button>
                            <span className="text-sm text-gray-700">
                                Trang {currentPage}/{maxPage}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                                disabled={currentPage >= maxPage}
                            >
                                Trang sau
                            </Button>
                        </div>
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
