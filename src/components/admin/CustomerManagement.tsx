import React from "react";
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

interface Customer {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: "active" | "suspended";
  swaps: number;
  revenue: number;
}

interface CustomerManagementProps {
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function CustomerManagement({
  customers,
  searchQuery,
  onSearchChange,
}: CustomerManagementProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">
          {t("admin.customerManagement")}
        </h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input
              placeholder={t("admin.searchCustomers")}
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
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
            {customers.map((customer) => (
              <div
                key={customer.id}
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
                          customer.status === "active"
                            ? "bg-green-400 text-white"
                            : "bg-red-500 text-white "
                        }
                      >
                        {t(`admin.${customer.status}`)}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {customer.plan}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">
                        {t("admin.swaps")}:{" "}
                      </span>
                      <span className="font-medium">{customer.swaps}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {t("admin.revenue")}:{" "}
                      </span>
                      <span className="font-medium">${customer.revenue}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-2 justify-end">
                    <Button size="sm" variant="outline">
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
    </div>
  );
}
