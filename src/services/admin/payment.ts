import api from "@/configs/axios";

export interface Payment {
  id: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userPhone?: string | null;
  userSubscriptionId?: string | null;
  subscriptionPlanName?: string | null;
  reservationId?: string | null;
  method: string;
  type: string;
  amount: number;
  status: number; // ❗ string, không phải number
  description?: string | null;
  vnpTxnRef?: string | null;
  paymentReference?: string | null;
  vnpResponseCode?: string | null;
  vnpTransactionNo?: string | null;
  createdAt: string;
  completedAt?: string | null;
  processedByStaffId?: string | null;
  processedByStaffName?: string | null;
  stationId?: string | null;
  stationName?: string | null;
}


interface GetTotalRevenueOptions {
  page?: number;
  pageSize?: number;
  status?: number;
}

export async function getTotalRevenue(options: GetTotalRevenueOptions = {}): Promise<number> {
  let totalRevenue = 0;
  const pageSize = options.pageSize || 20;
  let page = options.page || 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await api.get("/api/v1/payments", {
      params: { page, pageSize, status: 2 },
    });

    const data = response.data;

    const payments: Payment[] = Array.isArray(data.payments) ? data.payments : [];
    totalRevenue += payments.reduce((sum: number, item: Payment) => sum + (item.amount || 0), 0);

    // Lấy tổng số trang từ pagination
    totalPages = data.pagination?.totalPages || 1;
    page += 1;
  }

  return totalRevenue;
}

export async function getMonthlyRevenue(options: GetTotalRevenueOptions = {}): Promise<{ month: string; revenue: number }[]> {
  const pageSize = options.pageSize || 20;
  let page = options.page || 1;
  let totalPages = 1;
  const monthlyRevenue: Record<string, number> = {};

  while (page <= totalPages) {
    const response = await api.get("/api/v1/payments", {
      params: { page, pageSize, status: 2 },
    });
    const data = response.data;
    const payments: Payment[] = Array.isArray(data.payments) ? data.payments : [];

    payments.forEach(p => {
      const date = new Date(p.createdAt);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (p.amount || 0);
    });

    totalPages = data.pagination?.totalPages || 1;
    page += 1;
  }

  return Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));
}

export async function getAllPayments(options: GetTotalRevenueOptions = {}): Promise<Payment[]> {
  const pageSize = options.pageSize || 50;
  let page = options.page || 1;
  let totalPages = 1;
  let allPayments: Payment[] = [];

  while (page <= totalPages) {
const response = await api.get("/api/v1/payments", {
  params: { page, pageSize, status: options.status ?? 2 }, // 🔹 status = 2
});

    const data = response.data;
    const payments: Payment[] = Array.isArray(data.payments) ? data.payments : [];

    allPayments = allPayments.concat(payments);
    totalPages = data.pagination?.totalPages || 1;
    page += 1;
  }

  return allPayments;
}