import React, { use, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Eye, Edit, Plus, Search, Filter } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import {
  Customer,
  CustomerDetail,
  fetchCustomers,
} from "@/services/admin/customerAdminService";
import CustomerDetailModal from "./CustomerDetailModal";

interface CustomerManagementProps {
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CustomerManagement() {
  const { t } = useLanguage();
  const [customer, setCustomer] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // Đã đổi tên state thành selectedCustomer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    const getAllCustomers = async () => {
      try {
        const response = await fetchCustomers(1, 20);
        setCustomer(response.data);
        console.log("Fetched customers:", response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }
    };
    getAllCustomers();
  }, []);

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customer;
    const query = searchQuery.toLowerCase();
    return customer.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.PhoneNumber.includes(query)
    );
  }, [customer, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">
          {t("admin.customerManagement")}
        </h2>
        <div className="flex space-x-2">
          <div className="relative">
            {/* <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" /> */}
            {/* <Input
              placeholder={t("admin.searchCustomers")}
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            /> */}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-10 h-4" /> {t("admin.filter")}
          </Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4" /> {t("admin.addCustomer")}
          </Button>
        </div>
      </div>

      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600">
            {"Danh sách khách hàng"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 ">
            {customer.map((customer) => (
              <div
                key={customer.id as string}
                className="flex items-center justify-between p-4 border rounded-lg border border-orange-200 rounded-lg"
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
                    <div className="flex items-center space-x-2 mt-1 ">
                      <Badge
                        className={
                          customer.status === "Active"
                            ? "bg-green-400 text-white"
                            : "bg-red-500 text-white "
                        }
                      >
                        {t(`admin.${customer.status}`)}
                      </Badge>
                      {/* <span className="text-xs text-gray-400">
                        {customer.plan}
                      </span> */}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">
                        {t("admin.swaps")}:{" "}
                      </span>
                      <span className="font-medium">
                        {customer.totalReservations.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t("admin.revenue")}:{" "}
                      </span>
                      <span className="font-medium">
                        ${customer.completedReservations.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(customer)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
