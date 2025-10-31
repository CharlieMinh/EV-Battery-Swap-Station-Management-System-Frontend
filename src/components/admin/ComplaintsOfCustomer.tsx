import React, { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Battery, User, MapPin, Search } from "lucide-react";
import {
  BatteryComplaintResponse,
  fetchAllComplaints,
} from "@/services/complaint";
import { fetchCustomerById } from "@/services/admin/customerAdminService";

/** 🕒 Format ngày theo giờ Việt Nam */
function formatVNDate(dateString: string | null): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
}

/** 📘 Map trạng thái khiếu nại */
const statusLabels: Record<string, string> = {
  PendingScheduling: "Chờ đặt lịch kiểm tra",
  Scheduled: "Đã đặt lịch kiểm tra",
  CheckedIn: "Đã check-in tại trạm",
  Investigating: "Đang kiểm tra thực tế",
  Confirmed: "Xác nhận lỗi hệ thống/bảo hành",
  Rejected: "Từ chối (Lỗi do người dùng)",
  Resolved: "Đã giải quyết (Đổi pin thành công)",
};

const ComplaintsOfCustomer: React.FC = () => {
  const [complaints, setComplaints] = useState<BatteryComplaintResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadComplaintsWithUserNames = async () => {
      try {
        const data = await fetchAllComplaints(1, 20);
        const complaintList = data.items || [];

        // 🔍 Lấy tất cả userId duy nhất
        const userIds = [
          ...new Set(
            complaintList.map((c: any) => c.reportedByUserId).filter(Boolean)
          ),
        ];

        // 🧠 Tạo map {userId: userName}
        const namesMap: Record<string, string> = {};

        await Promise.all(
          userIds.map(async (id) => {
            try {
              const user = await fetchCustomerById(id as string);
              namesMap[id as string] = user.name || "Không rõ";
            } catch (err) {
              console.warn("Không lấy được tên cho user:", id, err);
              namesMap[id as string] = "Không rõ";
            }
          })
        );

        setUserNames(namesMap);
        setComplaints(complaintList);
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

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Đang tải dữ liệu...
      </div>
    );

  if (complaints.length === 0)
    return (
      <p className="text-center text-gray-500 mt-6">Không có khiếu nại nào.</p>
    );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        Danh sách khiếu nại người dùng
      </h2>

      {/* 🔎 Ô lọc theo tên người khiếu nại */}
      <div className="flex items-center gap-2 mb-4 max-w-md">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder="Tìm theo tên người khiếu nại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-gray-300"
        />
      </div>

      {/* Danh sách complaint */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredComplaints.map((c) => (
          <Card
            key={c.id}
            className="shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Battery className="w-5 h-5 text-blue-500" />
                Khiếu nại #{c.id.slice(0, 8)}
              </CardTitle>
              <CardDescription>
                Báo cáo ngày: {formatVNDate(c.reportDate)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Người gửi: </span>
                {userNames[c.reportedByUserId] || "Không rõ"}
              </p>

              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Trạm: </span>
                {c.stationName || "Không xác định"}
              </p>

              <p>
                <span className="font-medium text-gray-700">Trạng thái: </span>
                {statusLabels[c.status] || c.status}
              </p>

              <p>
                <span className="font-medium text-gray-700">
                  Nội dung khiếu nại:{" "}
                </span>
                {c.complaintDetails}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ComplaintsOfCustomer;
