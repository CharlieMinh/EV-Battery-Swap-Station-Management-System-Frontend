import api from "@/configs/axios";

interface Payment {
  amount: number;
  status: number;
  [key: string]: any;
}

interface GetTotalRevenueOptions {
  page?: number;
  pageSize?: number;
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