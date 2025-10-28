import axios from "axios";

/* =========================
 *  Base URL
 * ========================= */
function buildBaseURL() {
  const raw =
    ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:5194";
  const trimmed = raw.replace(/\/+$/, "");
  const hasApiPrefix = /\/api(\/|$)/i.test(trimmed);
  return hasApiPrefix ? trimmed : `${trimmed}/api/v1`;
}
export const API_BASE_URL: string = buildBaseURL();

/* =========================
 *  Axios instance
 * ========================= */
export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      if (!location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

/* =========================
 *  Types
 * ========================= */
export type Reservation = {
  reservationId: string;
  userName?: string;
  vehiclePlate?: string;
  vehicleModelName?: string;
  batteryModelId?: string;
  batteryModelName?: string;
  status?: string;
};

export type SwapFinalizeResponse = {
  swapId: string;
  reservationId: string;
  timestamp?: string;
  oldBattery?: { serialNumber: string; modelName?: string; status?: string };
  newBattery?: { serialNumber: string; modelName?: string; status?: string };
  driverName?: string;
};

/** =========================
 *  Inventory Types
 * ========================= */
export type StationBatteryStats = {
  total?: number; // preferred
  available?: number;
  inUse?: number;
  charging?: number;
  maintenance?: number;
  reserved?: number;
  exportedToday?: number;
  // alternative BE field names we may encounter
  totalBatteries?: number;
  availableBatteries?: number;
};

export type BatteryUnit = {
  batteryId: string;
  serialNumber?: string;
  batteryModelId?: string;
  batteryModelName?: string;
  status?: string;
  isReserved?: boolean;
  updatedAt?: string;
};

export const STATUS_LABELS_VI: Record<string, string> = {
  Available: "Sẵn sàng",
  InUse: "Đang sử dụng",
  Charging: "Đang sạc",
  Maintenance: "Bảo trì",
  Reserved: "Đã đặt trước",
  Faulty: "Lỗi",
};

/* =========================
 *  Auth/User for Staff
 * ========================= */
export type UserMe = {
  userId?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
  stationId?: string | number;
  station?: { id?: string | number; name?: string };
  phone?: string;
  avatarUrl?: string;
};

export const getMe = () => api.get<UserMe>("Auth/me", { withCredentials: true });

/** Update current user profile; tries common backend variants */
export const updateUser = async (
  userId: string,
  body: { fullName?: string; phone?: string; avatarUrl?: string }
) => {
  const candidates = [
    { method: "put", url: `users/${userId}` },
    { method: "patch", url: `users/${userId}` },
    { method: "put", url: `staff/users/${userId}` },
    { method: "post", url: `users/update-profile` },
    { method: "post", url: `Auth/update-profile` },
    { method: "post", url: `me` },
  ] as const;

  let lastErr: any = null;
  for (const c of candidates) {
    try {
      if (c.method === "put") return await api.put(c.url, body);
      if (c.method === "patch") return await api.patch(c.url, body);
      return await api.post(c.url, body);
    } catch (e: any) {
      if (e?.response?.status && e.response.status < 500) {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("Update profile failed");
};

/** Change password for current user; tries common endpoints */
export const resetPassword = async (payload: {
  oldPassword?: string;
  newPassword: string;
}) => {
  const bodies = [
    { oldPassword: payload.oldPassword, newPassword: payload.newPassword },
    { currentPassword: payload.oldPassword, newPassword: payload.newPassword },
    { oldPwd: payload.oldPassword, newPwd: payload.newPassword },
  ];
  const urls = [
    "Auth/change-password",
    "users/change-password",
    "me/change-password",
  ];
  let lastErr: any = null;
  for (const url of urls) {
    for (const body of bodies) {
      try {
        return await api.post(url, body, { withCredentials: true });
      } catch (e: any) {
        if (e?.response?.status && e.response.status < 500) {
          lastErr = e;
          continue;
        }
        throw e;
      }
    }
  }
  throw lastErr || new Error("Change password failed");
};

/* =========================
 *  Queue APIs (giữ nguyên phần của bạn)
 * ========================= */
export const listReservations = (params: {
  stationId: string | number;
  date?: string;
  status?: string;
}) => api.get<Reservation[]>("slot-reservations", { params });

/** BE đã hỗ trợ check-in full-time; gửi raw QR (base64 hoặc string) */
export const checkInReservation = (reservationId: string, qrCodeData: string) =>
  api.post(`slot-reservations/${reservationId}/check-in`, { qrCodeData });

/* =========================
 *  Swap APIs — phiên bản "smart"
 * ========================= */
/**
 * Một số BE đặt tên field khác nhau. Hàm này sẽ thử lần lượt nhiều biến thể payload
 * cho đến khi thành công; nếu vẫn lỗi sẽ ném ra lỗi cuối cùng (và FE sẽ show message BE).
 */
export const finalizeSwapFromReservation = async (payload: {
  reservationId: string;
  oldBatterySerial: string;
  stationId?: string | number; // nếu BE yêu cầu, bạn có thể truyền thêm
}) => {
  const { reservationId, oldBatterySerial, stationId } = payload;

  const bodies: any[] = [
    // tên phổ biến
    { reservationId, oldBatterySerial, stationId },
    // các biến thể hay gặp
    { reservationId, oldSerial: oldBatterySerial, stationId },
    { reservationId, serial: oldBatterySerial, stationId },
    { reservationId, oldBatteryCode: oldBatterySerial, stationId },
    { reservationId, oldBatterySn: oldBatterySerial, stationId },
    { reservationId, batterySerial: oldBatterySerial, stationId },
  ];

  let lastErr: any = null;
  for (const body of bodies) {
    try {
      const res = await api.post<SwapFinalizeResponse>("swaps/finalize-from-reservation", body);
      return res;
    } catch (e: any) {
      // Nếu là lỗi “có thể do tên field” (400/422), thử biến thể tiếp theo
      if (e?.response?.status === 400 || e?.response?.status === 422) {
        lastErr = e;
        continue;
      }
      // Lỗi khác (403/404/500) thì dừng luôn
      throw e;
    }
  }
  // đã thử hết mà vẫn lỗi -> ném lỗi cuối
  throw lastErr || new Error("Finalize swap failed.");
};

/* =========================
 *  Inventory APIs
 * ========================= */
export const stationBatteryStats = (stationId: string | number) =>
  api.get<StationBatteryStats>(`stations/${stationId}/battery-stats`);

export const listStationBatteries = (stationId: string | number) =>
  api.get<BatteryUnit[]>(`stations/${stationId}/batteries`);

export const createReplenishmentRequest = (payload: {
  stationId: string | number;
  reason?: string;
  items: Array<{ batteryModelId: string; quantityRequested: number }>;
}) => api.post(`stations/${payload.stationId}/replenishment-requests`, payload);

/* =========================
 *  Payments APIs & Types
 * ========================= */
export type Payment = {
  paymentId: string;
  swapId?: string;
  amount?: number;
  method?: "Cash" | "Card" | string;
  status?: "Pending" | "Paid" | string;
  paidAt?: string;
};

export const listAllPayments = (params: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) => api.get<Payment[]>("payments", { params });

export const completeCashPayment = (paymentId: string) =>
  api.post(`payments/${paymentId}/complete-cash`);

export const completeSwap = (swapId: string) =>
  api.post(`swaps/${swapId}/complete`);

/* =========================
 *  File Upload (utility)
 * ========================= */
export const uploadFile = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const candidates = [
    "files/upload",
    "upload",
    "media/upload",
  ];
  let lastErr: any = null;
  for (const url of candidates) {
    try {
      const res = await api.post<{ url?: string; path?: string }>(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      const u = (res.data.url || res.data.path || "").toString();
      if (u) return u;
    } catch (e: any) {
      if (e?.response?.status && e.response.status < 500) {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("Upload failed");
};

export default api;
