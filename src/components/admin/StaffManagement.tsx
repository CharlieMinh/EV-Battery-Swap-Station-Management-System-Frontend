import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Eye, Edit, Plus, Filter } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { fetchStaffList, Staff } from "@/services/admin/staffAdminService";
import StaffDetailModal from "./StaffDetailModal";

export function StaffManagement() {
  const { t } = useLanguage();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter theo tên
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");

  // Phân trang
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [pageSize] = useState(10);

  const getAllStaff = async () => {
    setIsLoading(true);
    try {
      const response = await fetchStaffList(1, 1000); // lấy tất cả dữ liệu, phân trang tại client
      setStaffList(response.data);
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllStaff();
  }, []);

  // Đồng bộ inputPage khi page thay đổi
  useEffect(() => {
    setInputPage(page);
  }, [page]);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [filterText]);

  const handleCloseModal = () => {
    setSelectedStaff(null);
    getAllStaff();
  };

  const handleViewDetails = (staff: Staff) => {
    setSelectedStaff(staff);
  };

  // Filter chỉ theo tên
  const filteredStaff = useMemo(() => {
    if (!filterText) return staffList;
    const query = filterText.toLowerCase();
    return staffList.filter((s) => s.name.toLowerCase().includes(query));
  }, [staffList, filterText]);

  // Dữ liệu phân trang
  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));

  if (isLoading) {
    return <div className="text-center py-6">{t("admin.loadingStaff")}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">
          {t("admin.staffManagement")}
        </h2>
        <div className="flex space-x-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="w-4 h-4 mr-1" /> {t("admin.filter")}
          </Button>
          {showFilter && (
            <Input
              type="text"
              placeholder={t("admin.searchByName")}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-64"
            />
          )}
        </div>
      </div>

      {/* Danh sách nhân viên */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600">{t("admin.staffList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedStaff.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              {t("admin.noStaff")}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedStaff.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg border-orange-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">
                        {member.stationName}
                      </p>
                      <Badge
                        className={
                          member.status === "Active"
                            ? "bg-green-400 text-white"
                            : "bg-red-500 text-white"
                        }
                      >
                        {t(`admin.${member.status}`)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex justify-center space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(member)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
        </CardContent>
      </Card>

      <StaffDetailModal staff={selectedStaff} onClose={handleCloseModal} />
    </div>
  );
}
