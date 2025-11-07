import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Eye, Edit, Filter } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import {
  Customer,
  fetchCustomers,
} from "@/services/admin/customerAdminService";
import CustomerDetailModal from "./CustomerDetailModal";

export function CustomerManagement() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // Filter theo tên
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState("");

  // Phân trang
  const [page, setPage] = useState(1);
  const [inputPage, setInputPage] = useState(1);
  const [pageSize] = useState(10);

  // Load dữ liệu
  const getAllCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchCustomers(1, 1000); // lấy tất cả dữ liệu, phân trang tại client
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllCustomers();
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
    setSelectedCustomer(null);
    getAllCustomers();
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  // Filter chỉ theo tên
  const filteredCustomers = useMemo(() => {
    if (!filterText) return customers;
    const query = filterText.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(query));
  }, [customers, filterText]);

  // Dữ liệu phân trang
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize)
  );

  if (isLoading) {
    return <div className="text-center py-6">Đang tải khách hàng...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">
          {t("admin.customerManagement")}
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
              placeholder="Tìm theo tên..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-64"
            />
          )}
        </div>
      </div>

      {/* Danh sách khách hàng */}
      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600">
            Danh sách khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedCustomers.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              Không có khách hàng nào.
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 border rounded-lg border-orange-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge
                          className={
                            customer.status === "Active"
                              ? "bg-green-400 text-white"
                              : "bg-red-500 text-white"
                          }
                        >
                          {customer.status === "Active" ? "Hoạt động" : "Chặn"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>
                      <span className="text-gray-500">Tổng lần thay pin: </span>
                      <span className="font-medium">
                        {customer.totalReservations.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex space-x-2 mt-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(customer)}
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
              Trước
            </Button>

            <div className="flex items-center space-x-1">
              <span className="text-gray-700 text-sm">Trang</span>
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
              Sau
            </Button>
          </div>
        </CardContent>
      </Card>

      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={handleCloseModal}
      />
    </div>
  );
}
