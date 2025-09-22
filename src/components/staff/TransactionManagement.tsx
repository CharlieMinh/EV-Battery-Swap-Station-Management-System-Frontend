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

interface Transaction {
  id: string;
  customer: string;
  vehicle: string;
  time: string;
  batteryOut: string;
  batteryIn: string;
  amount: number;
  paymentMethod: "subscription" | "card" | "cash";
}

interface TransactionManagementProps {
  recentTransactions: Transaction[];
}

export function TransactionManagement({
  recentTransactions,
}: TransactionManagementProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("staff.recentTransactions")}</CardTitle>
        <CardDescription>{t("staff.recentTransactionsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="font-mono">{transaction.time}</p>
                  <Badge variant="secondary">
                    {t(`staff.${transaction.paymentMethod}`)}
                  </Badge>
                </div>
                <div>
                  <p className="font-medium">{transaction.customer}</p>
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
                <p className="font-medium">${transaction.amount}</p>
                <Badge className="bg-green-100 text-green-800">
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
