import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Battery, User, MapPin, Search, Clock } from "lucide-react";
import {
  BatteryComplaintResponse,
  fetchAllComplaints,
} from "@/services/complaint";
import { fetchCustomerById } from "@/services/admin/customerAdminService";
import { fetchSwapById } from "@/services/swaps";
import { Button } from "../ui/button";
import { useLanguage } from "../LanguageContext";

/** 🕒 Format ngày theo giờ Việt Nam */
function formatVNDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
}

/** 📘 Map trạng thái khiếu nại */
/** 📘 Map trạng thái khiếu nại từ số sang tên ngắn */
const getStatusLabel = (status: number, t: (key: string) => string): string => {
  const statusMap: Record<number, string> = {
    0: t("admin.statusAwaitingSchedule"),
    1: t("admin.statusScheduled"),
    2: t("admin.statusCheckedIn"),
    3: t("admin.statusUnderReview"),
    4: t("admin.statusSystemError"),
    5: t("admin.statusUserError"),
    6: t("admin.statusResolved"),
  };
  return statusMap[status] || String(status);
};

const statusColors: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800", // Chờ đặt lịch
  1: "bg-blue-100 text-blue-800", // Đã đặt lịch
  2: "bg-indigo-100 text-indigo-800", // Đã check-in
  3: "bg-purple-100 text-purple-800", // Đang kiểm tra
  4: "bg-teal-100 text-teal-800", // Xác nhận lỗi hệ thống
  5: "bg-red-100 text-red-800", // Từ chối
  6: "bg-green-100 text-green-800", // Đã giải quyết
};

const ComplaintsOfCustomer: React.FC = () => {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<BatteryComplaintResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [completedAtMap, setCompletedAtMap] = useState<Record<string, string>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Phân trang
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [pageSize] = useState(6); // số item mỗi trang

  useEffect(() => {
    const loadComplaintsWithUserNames = async () => {
      try {
        const data = await fetchAllComplaints(1, 1000); // lấy tất cả
        const complaintList = data.items || [];

        const userIds = [
          ...new Set(
            complaintList.map((c: any) => c.reportedByUserId).filter(Boolean)
          ),
        ];

        const namesMap: Record<string, string> = {};
        await Promise.all(
          userIds.map(async (id) => {
            try {
              const user = await fetchCustomerById(id as string);
              namesMap[id as string] = user.name || "Không rõ";
            } catch (err) {
              namesMap[id as string] = "Không rõ";
            }
          })
        );

        const completedMap: Record<string, string> = {};
        await Promise.all(
          complaintList.map(async (c: any) => {
            if (c.swapTransactionId) {
              try {
                const swap = await fetchSwapById(c.swapTransactionId);
                if (swap?.completedAt) {
                  completedMap[c.id] = swap.completedAt;
                }
              } catch (err) {}
            }
          })
        );

        setUserNames(namesMap);
        setComplaints(complaintList);
        setCompletedAtMap(completedMap);
      } catch (error) {
        console.error("Lỗi khi tải danh sách khiếu nại:", error);
      } finally {
        setLoading(false);
      }
    };

    loadComplaintsWithUserNames();
  }, []);

  /** 🔍 Lọc danh sách theo tên người khiếu nại */
  const filteredComplaints = useMemo(() => {
    if (!searchTerm.trim()) return complaints;
    return complaints.filter((c) => {
      const name = userNames[c.reportedByUserId]?.toLowerCase() || "";
      return name.includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, complaints, userNames]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredComplaints.length / pageSize)
  );

  // Dữ liệu phân trang
  const paginatedComplaints = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredComplaints.slice(start, start + pageSize);
  }, [filteredComplaints, page, pageSize]);

  // Đồng bộ inputPage với page
  useEffect(() => {
    setInputPage(page);
  }, [page]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> {t("admin.loading")}
      </div>
    );

  if (complaints.length === 0)
    return (
      <p className="text-center text-gray-500 mt-6">{t("admin.noComplaints")}</p>
    );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        {t("admin.complaintsList")}
      </h2>

      {/* 🔎 Ô lọc */}
      <div className="flex items-center gap-2 mb-4 max-w-md">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder={t("admin.searchByReporter")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-gray-300"
        />
      </div>

      {/* Danh sách complaint */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedComplaints.map((c) => (
          <Card
            key={c.id}
            className="shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Battery className="w-5 h-5 text-blue-500" />
                {t("admin.complaint")} #{c.id.slice(0, 8)}
              </CardTitle>
              <CardDescription>
                {t("admin.reportDate")} {formatVNDate(c.reportDate)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">{t("admin.reporter")}</span>
                {userNames[c.reportedByUserId] || t("admin.unknown")}
              </p>

              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">{t("admin.stationName")}</span>
                {c.stationName || t("admin.unknown")}
              </p>

              <p>
                <span className="font-medium text-gray-700">{t("admin.statusTitle")}</span>
                {(() => {
                  const statusNumber = typeof c.status === "string" ? Number(c.status) : c.status;
                  const label = getStatusLabel(statusNumber, t);
                  const color = statusColors[statusNumber] ?? "bg-gray-100 text-gray-800";
                  return (
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${color}`}
                    >
                      {label}
                    </span>
                  );
                })()}
              </p>

              <p>
                <span className="font-medium text-gray-700">
                  {t("admin.complaintDetails")}
                </span>
                {c.complaintDetails}
              </p>
              {/* 
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">
                  Ngày hoàn tất đổi pin:{" "}
                </span>
                {completedAtMap[c.id]
                  ? formatVNDate(completedAtMap[c.id])
                  : "Chưa hoàn tất"}
              </p> */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Phân trang */}
      <div className="flex justify-center items-center space-x-3 mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t("admin.prev")}
        </Button>

        <div className="flex items-center space-x-1">
          <span className="text-gray-700 text-sm">{t("admin.page")}</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(Number(e.target.value))}
            onBlur={() => {
              let newPage = Number(inputPage);
              if (isNaN(newPage) || newPage < 1) newPage = 1;
              if (newPage > totalPages) newPage = totalPages;
              setPage(newPage);
            }}
            className="w-16 text-center text-sm"
          />
          <span className="text-gray-700 text-sm">/ {totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          {t("admin.next")}
        </Button>
      </div>
    </div>
  );
};

export default ComplaintsOfCustomer;
