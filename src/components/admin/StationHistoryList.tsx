import React, { useEffect, useState, useMemo } from "react";
import { Zap, Clock, DollarSign, User, Loader2, Building2, Package, UserCheck, Calendar, Car, CreditCard } from "lucide-react";
import { getAllPayments, Payment } from "@/services/admin/payment";
import { fetchHistoryStationById } from "@/services/admin/stationService";
import { SwapTransaction } from "@/types/SwapTransaction";
import { fetchCustomers, Customer, fetchCustomerById, Subscription } from "@/services/admin/customerAdminService";
import api from "@/configs/axios";
import { useLanguage } from "../LanguageContext";

const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN");

const formatTime = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh", // Bắt buộc múi giờ Việt Nam
  }).format(new Date(date));

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);

interface StationHistoryListProps {
  stationId: string;
}

export const StationHistoryList: React.FC<StationHistoryListProps> = ({
  stationId,
}) => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [swapTransactions, setSwapTransactions] = useState<SwapTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptionNames, setSubscriptionNames] = useState<Record<string, string>>({});
  const [subscriptionInfo, setSubscriptionInfo] = useState<Record<string, { name: string; swapsRemaining: number | null }>>({});
  const [userCurrentSubscriptions, setUserCurrentSubscriptions] = useState<Record<string, { name: string; swapsRemaining: number | null }>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"payments" | "swaps">("payments");

  // Helper function to get customer name from email
  const getCustomerName = (email: string): string => {
    const customer = customers.find((c) => c.email === email);
    return customer?.name || email;
  };

  // Helper function to get subscription name
  const getSubscriptionName = (subscriptionId: string | null | undefined): string | null => {
    if (!subscriptionId) return null;
    return subscriptionNames[subscriptionId] || subscriptionInfo[subscriptionId]?.name || null;
  };

  // Helper function to get subscription info (name and swaps remaining)
  const getSubscriptionInfo = (subscriptionId: string | null | undefined): { name: string; swapsRemaining: number | null } | null => {
    if (!subscriptionId) return null;
    if (subscriptionInfo[subscriptionId]) {
      return subscriptionInfo[subscriptionId];
    }
    // Fallback to old subscriptionNames if available
    if (subscriptionNames[subscriptionId]) {
      return { name: subscriptionNames[subscriptionId], swapsRemaining: null };
    }
    return null;
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        
        // Load customers để map email -> name
        const customersData = await fetchCustomers(1, 1000);
        const customersList = Array.isArray(customersData.data) ? customersData.data : [];
        setCustomers(customersList);

        // Load payments
        const allPayments = await getAllPayments({ page: 1, pageSize: 100 });
        const stationPayments = allPayments.filter(
          (payment) => payment.stationId === stationId
        );
        stationPayments.sort((a, b) => {
          const dateA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.createdAt).getTime();
          const dateB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        setPayments(stationPayments);

        // Load swap transactions
        const swapData = await fetchHistoryStationById(stationId, 1, 100);
        swapData.sort((a, b) => {
          const dateA = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.startedAt || a.checkedInAt || "").getTime();
          const dateB = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.startedAt || b.checkedInAt || "").getTime();
          return dateB - dateA;
        });
        setSwapTransactions(swapData);

        // Get unique userIds from transactions
        const uniqueUserIds = [...new Set(swapData.map(tx => tx.userId).filter((id): id is string => Boolean(id)))];
        
        // Fetch user data to get subscriptions
        const subscriptionInfoMap: Record<string, { name: string; swapsRemaining: number | null }> = {};
        const subscriptionNameMap: Record<string, string> = {};
        const userCurrentSubsMap: Record<string, { name: string; swapsRemaining: number | null }> = {};
        
        // Fetch user data for each unique userId
        for (const userId of uniqueUserIds) {
          try {
            const userData = await fetchCustomerById(userId);
            if (userData.subscriptions && Array.isArray(userData.subscriptions)) {
              // Tìm subscription active hiện tại của user
              const activeSubscription = userData.subscriptions.find((sub: Subscription) => sub.isActive);
              
              if (activeSubscription) {
                const swapsRemaining = activeSubscription.swapsRemaining !== null && activeSubscription.swapsRemaining !== undefined 
                  ? activeSubscription.swapsRemaining 
                  : (activeSubscription.swapsLimit !== null && activeSubscription.swapsLimit !== undefined 
                      ? activeSubscription.swapsLimit - activeSubscription.swapsUsed 
                      : null);
                
                userCurrentSubsMap[userId] = {
                  name: activeSubscription.subscriptionPlan?.name || "Unknown Plan",
                  swapsRemaining: swapsRemaining
                };
              }
              
              // Map subscriptions by ID (cho transaction cũ)
              userData.subscriptions.forEach((sub: Subscription) => {
                const swapsRemaining = sub.swapsRemaining !== null && sub.swapsRemaining !== undefined 
                  ? sub.swapsRemaining 
                  : (sub.swapsLimit !== null && sub.swapsLimit !== undefined 
                      ? sub.swapsLimit - sub.swapsUsed 
                      : null);
                
                subscriptionInfoMap[sub.id] = {
                  name: sub.subscriptionPlan?.name || "Unknown Plan",
                  swapsRemaining: swapsRemaining
                };
                subscriptionNameMap[sub.id] = sub.subscriptionPlan?.name || "Unknown Plan";
              });
            }
          } catch (err) {
            console.error(`Could not fetch user ${userId}:`, err);
          }
        }
        
        setSubscriptionInfo(subscriptionInfoMap);
        setSubscriptionNames(subscriptionNameMap);
        setUserCurrentSubscriptions(userCurrentSubsMap);
      } catch (err) {
        console.error("❌ Lỗi khi lấy lịch sử:", err);
        setPayments([]);
        setSwapTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [stationId]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">{t("admin.loadingHistory")}</p>
        </div>
      </div>
    );

  // Group payments by date
  const groupedPayments = payments.reduce((acc, tx) => {
    const dateKey = tx.completedAt ? formatDate(tx.completedAt) : formatDate(tx.createdAt);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {} as Record<string, Payment[]>);

  // Group swap transactions by date
  const groupedSwaps = swapTransactions.reduce((acc, tx) => {
    const dateKey = tx.completedAt ? formatDate(tx.completedAt) : formatDate(tx.startedAt || tx.checkedInAt || "");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {} as Record<string, SwapTransaction[]>);

  const hasData = payments.length > 0 || swapTransactions.length > 0;

  if (!hasData)
    return (
      <div className="text-center py-6 text-gray-400">
        {t("admin.noSwapTransactions")}
      </div>
    );

  return (
    <div className="space-y-6 mt-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "payments"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          {t("admin.payments")} ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab("swaps")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "swaps"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          {t("admin.swapTransactions")} ({swapTransactions.length})
        </button>
      </div>

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="space-y-8">
          {Object.entries(groupedPayments).map(([date, txs]) => (
        <div key={date}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
            {date}
          </h3>
          <div className="space-y-3">
            {txs.map((tx) => {
              const completedDate = tx.completedAt || tx.createdAt;
              // Handle both number and string status
              const statusValue = typeof tx.status === "string" ? tx.status : String(tx.status);
              const statusText = 
                statusValue === "2" || statusValue === "Completed" || statusValue === "completed"
                  ? t("admin.completed") 
                  : statusValue === "1" || statusValue === "Pending" || statusValue === "pending"
                  ? t("admin.pending")
                  : statusValue === "0" || statusValue === "Unpaid" || statusValue === "unpaid"
                  ? t("admin.inactiveStatus")
                  : statusValue;
              
              return (
                <div
                  key={tx.id}
                  className="bg-white border border-gray-100 p-5 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                          <Clock className="w-4 h-4" /> 
                          {formatTime(completedDate)}
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {statusText}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {tx.method}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">{t("admin.customer")}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.userName || tx.userEmail || t("admin.unknown")}
                        </p>
                      </div>
                    </div>
                    
                    {tx.processedByStaffName && (
                      <div className="flex items-start gap-2">
                        <UserCheck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">{t("admin.staff")}</p>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.processedByStaffName}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tx.stationName && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">{t("admin.station")}</p>
                          <p className="text-sm font-medium text-gray-900">
                            {tx.stationName}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {tx.subscriptionPlanName && (
                      <div className="flex items-start gap-2">
                        <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">{t("admin.plan")}</p>
                          <p className="text-sm font-medium text-orange-600">
                            {tx.subscriptionPlanName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {tx.description && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">{tx.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
        </div>
      )}

      {/* Swap Transactions Tab */}
      {activeTab === "swaps" && (
        <div className="space-y-8">
          {Object.entries(groupedSwaps).map(([date, txs]) => (
            <div key={date}>
              <h3 className="text-lg font-semibold text-gray-700 mb-2 border-b pb-1">
                {date}
              </h3>
              <div className="space-y-3">
                {txs.map((tx) => {
                  const completedDate = tx.completedAt || tx.startedAt || tx.checkedInAt || "";
                  const staffName = (tx as any).completedByStaffName || (tx as any).checkedInByStaffName || null;
                  const customerName = getCustomerName(tx.userEmail);
                  
                  // Lấy thông tin subscription hiện tại của user (không phải từ transaction cũ)
                  const userCurrentSub = tx.userId ? userCurrentSubscriptions[tx.userId] : null;
                  
                  // Xác định payment type và subscription name
                  const isPayPerSwap = tx.paymentType === "PayPerSwap" || !tx.userSubscriptionId;
                  const subscriptionName = isPayPerSwap 
                    ? t("admin.payPerSwapLabel") 
                    : (userCurrentSub?.name || getSubscriptionName(tx.userSubscriptionId) || t("admin.payPerSwapLabel"));
                  const swapsRemaining = userCurrentSub?.swapsRemaining;
                  
                  return (
                    <div
                      key={tx.id}
                      className="bg-white border border-gray-100 p-5 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                              <Clock className="w-4 h-4" /> 
                              {completedDate ? formatTime(completedDate) : "N/A"}
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {tx.status || t("admin.unknown")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {tx.transactionNumber || tx.id.substring(0, 8)}
                          </p>
                          {tx.vehicleLicensePlate && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center justify-end gap-1">
                              <Car className="w-3 h-3" />
                              {tx.vehicleLicensePlate}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-2">
                          <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">{t("admin.customer")}</p>
                            <p className="text-sm font-medium text-gray-900">
                              {customerName}
                            </p>
                            {tx.userEmail && customerName !== tx.userEmail && (
                              <p className="text-xs text-gray-400">{tx.userEmail}</p>
                            )}
                          </div>
                        </div>
                        
                        {staffName && (
                          <div className="flex items-start gap-2">
                            <UserCheck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">{t("admin.staff")}</p>
                              <p className="text-sm font-medium text-gray-900">
                                {staffName}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {tx.stationName && (
                          <div className="flex items-start gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-gray-500">{t("admin.station")}</p>
                              <p className="text-sm font-medium text-gray-900">
                                {tx.stationName}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">{t("admin.plan")}</p>
                            <p className="text-sm font-medium text-orange-600">
                              {subscriptionName}
                            </p>
                            {!isPayPerSwap && swapsRemaining !== null && swapsRemaining !== undefined && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t("admin.remainingSwaps")}: <span className="font-semibold text-orange-600">{swapsRemaining}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {tx.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold">{t("admin.notes")}:</span> {tx.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
