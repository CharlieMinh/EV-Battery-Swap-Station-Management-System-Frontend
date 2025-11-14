// src/components/admin/AdminPendingRequests.tsx
import React, { useEffect, useState } from "react";
import {
  getPendingStockRequests,
  StockRequest,
} from "@/services/admin/requestPin";
import { fetchStaffById } from "@/services/admin/staffAdminService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { User, Package } from "lucide-react";
import CheckRequestFromStaff from "./CheckRequestFromStaff";

interface GroupedRequest {
  createdAt: string;
  requests: StockRequest[];
  totalItems: number;
  staffName: string;
  stationName: string;
}

const AdminPendingRequests: React.FC = () => {
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedRequest | null>(
    null
  );

  const fetchAndGroupRequests = async () => {
    setLoading(true);
    try {
      const requests = await getPendingStockRequests();

      const staffCache: Record<string, string> = {};
      await Promise.all(
        requests.map(async (req) => {
          if (!staffCache[req.requestedByStaffId]) {
            const staff = await fetchStaffById(req.requestedByStaffId);
            staffCache[req.requestedByStaffId] = staff.name || "Unknown";
          }
        })
      );

      requests.sort(
        (a, b) =>
          new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
      );

      const groups: GroupedRequest[] = [];
      let currentGroup: GroupedRequest | null = null;

      for (const req of requests) {
        const reqTime = new Date(req.requestDate).getTime();
        if (
          !currentGroup ||
          reqTime - new Date(currentGroup.createdAt).getTime() > 5000
        ) {
          currentGroup = {
            createdAt: req.requestDate,
            requests: [req],
            totalItems: req.quantity,
            staffName: staffCache[req.requestedByStaffId],
            stationName: req.stationName,
          };
          groups.push(currentGroup);
        } else {
          currentGroup.requests.push(req);
          currentGroup.totalItems += req.quantity;
        }
      }

      setGroupedRequests(groups);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndGroupRequests();
  }, []);

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="space-y-4">
      {groupedRequests.map((group, index) => (
        <Card
          key={index}
          className="relative border-orange-400 bg-orange-50 shadow-sm"
        >
          {/* Dấu chấm cảnh báo “!” nhấp nháy */}
          <span className="absolute top-3 left-3 text-orange-600 text-2xl font-bold animate-pulse">
            !
          </span>

          <CardHeader>
            <CardTitle className="text-orange-700 font-semibold pl-8">
              Yêu cầu #{index + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4  ">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-orange-600">
                    {group.staffName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-orange-600">
                    {group.stationName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-orange-600">
                    Tổng pin: {group.totalItems}
                  </span>
                </div>
              </div>

              {/* Nút Xem chi tiết ở bên phải */}
              <button
                className="ml-auto bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                onClick={() => setSelectedGroup(group)} // mở modal
              >
                Xem chi tiết
              </button>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedGroup && (
        <CheckRequestFromStaff
          group={{
            ...selectedGroup,
            adminName: null, // hoặc có giá trị nếu muốn
            staffName: selectedGroup.staffName,
            status: "PendingAdminReview",
          }}
          onClose={() => setSelectedGroup(null)}
          onSuccess={() => {
            setSelectedGroup(null);
            fetchAndGroupRequests(); // reload danh sách pending
          }}
        />
      )}
    </div>
  );
};

export default AdminPendingRequests;
