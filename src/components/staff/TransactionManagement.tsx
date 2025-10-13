import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Transaction } from "../../services/staffApi";
import staffApi from "../../services/staffApi";

interface TransactionManagementProps {
  recentTransactions: Transaction[];
}

export function TransactionManagement({
  recentTransactions,
}: TransactionManagementProps) {
  const { t, formatCurrency } = useLanguage();
  
  // TransactionManagement component already receives recentTransactions from parent
  // No need to fetch additional data here as it's already integrated

  return (
    <Card className="border border-orange-200 rounded-lg shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="text-orange-600 text-2xl font-bold">
          {t("staff.recentTransactions")}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t("staff.recentTransactionsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-6 border border-orange-100 rounded-lg bg-gray-50 shadow-sm"
            >
              <div className="flex items-center" style={{gap: '15px'}}>
                <div className="text-center">
                  <p className="font-mono text-lg text-orange-600 font-bold">{transaction.time}</p>
                  <Badge variant="secondary" className={
                    transaction.paymentMethod === "subscription"
                      ? "bg-blue-500 text-white"
                      : transaction.paymentMethod === "card"
                      ? "bg-green-500 text-white"
                      : "bg-yellow-500 text-white"
                  }>
                    {t(`staff.${transaction.paymentMethod}`)}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium text-black">{transaction.customer}</p>
                  <p className="text-sm text-gray-500">{transaction.vehicle}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span className="flex items-center">
                      <ArrowUpRight className="w-3 h-3 mr-1 text-red-500" />
                      {transaction.batteryOut}
                    </span>
                    <span className="flex items-center">
                      <ArrowDownLeft className="w-3 h-3 mr-1 text-green-500" />
                      {transaction.batteryIn}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600 text-lg">{formatCurrency(transaction.amount || transaction.totalAmount || 0)}</p>
                <Badge className="bg-green-100 text-green-800 font-semibold">
                  {t("staff.completed")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
