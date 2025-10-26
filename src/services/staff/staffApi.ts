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
  // Nếu raw đã là .../api/... thì dùng luôn; nếu chưa thì thêm /api/v1
  return hasApiPrefix ? trimmed : `${trimmed}/api/v1`;
}
export const API_BASE_URL: string = buildBaseURL();

/* =========================
 *  Axios instance
 * ========================= */
export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
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
 *  Types (đủ cho tất cả màn hình)
 * ========================= */
export type UserMe = {
  id?: string;
  userId?: string;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: "Admin" | "Staff" | "Driver";
  stationId?: string | null;
  station?: { stationId: string; name?: string; address?: string };
};

export type Reservation = {
  reservationId: string;
  userId?: string;
  userName?: string;         // để hiển thị tên khách hàng (nếu BE trả)
  vehicleId?: string;
  vehiclePlate?: string;     // để hiển thị biển số (nếu BE trả)
  vehicleModelName?: string; // phòng khi BE trả tên model xe
  batteryModelId?: string;
  batteryModelName?: string;
  // 2 schema thời gian có thể xuất hiện — FE đã fallback rồi
  startTime?: string;
  endTime?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  checkInWindow?: { earliestTime?: string; latestTime?: string };
  status?:
    | "Pending"
    | "CheckedIn"
    | "Completed"
    | "Cancelled"
    | "Expired"
    | string;
  stationId?: string;
};

export type BatteryUnit = {
  batteryId: string;
  serialNumber: string;
  batteryModelId: string;
  batteryModelName?: string;
  status?: string;     // FE sẽ map sang tiếng Việt
  stationId?: string;
  soh?: number;
  updatedAt?: string;
  isReserved?: boolean;
};

export type StationBatteryStats = {
  total?: number;
  totalBatteries?: number;
  available?: number;
  availableBatteries?: number;
  inUse?: number;
  charging?: number;
  maintenance?: number;
  reserved?: number;
  faulty?: number;
  exportedToday?: number;
};

export type Payment = {
  paymentId: string;
  swapId?: string;
  amount: number;
  method: "Cash" | "VnPay" | string;
  status: "Pending" | "Paid" | "Failed";
  createdAt: string;
  paidAt?: string;
};

export type SwapFinalizeResponse = {
  swapId: string;
  reservationId: string;
  timestamp?: string;
  oldBattery?: { serialNumber: string; modelName?: string; status?: string };
  newBattery?: { serialNumber: string; modelName?: string; status?: string };
  driverName?: string;
};

/* =========================
 *  Nhãn trạng thái PIN (TV)
 * ========================= */
export const STATUS_LABELS_VI: Record<string, string> = {
  Available: "Sẵn sàng",
  InUse: "Đang sử dụng",
  Charging: "Đang sạc",
  Maintenance: "Bảo trì",
  Reserved: "Đã đặt trước",
  Faulty: "Lỗi",
};

/* =========================
 *  Auth / User
 * ========================= */
export const getMe = async () => {
  const { data } = await api.get<UserMe>("auth/me");
  // Chuẩn hóa stationId cho chắc
  const stationId =
    (data as any).stationId ??
    (data as any).StationId ??
    (data as any).stationID ??
    null;
  return { data: { ...data, stationId } as UserMe };
};

export const updateUser = (userId: string, payload: Partial<UserMe>) =>
  api.put<UserMe>(`users/${userId}`, payload);

export const resetPassword = (payload: {
  oldPassword?: string;
  newPassword: string;
}) => api.post("auth/reset-password", payload);

/* =========================
 *  Upload (ảnh kiểm tra/xe)
 * ========================= */
export const uploadFile = async (file: File) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("fileupload/vehicle-photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return (data && (data.url || data.path)) || data;
};

/* =========================
 *  Queue / Reservations
 * ========================= */
export const listReservations = (params: {
  stationId: string | number;
  date?: string;      // 'YYYY-MM-DD'
  status?: string;    // '' (Tất cả) hoặc Pending/CheckedIn/...
}) => api.get<Reservation[]>("slot-reservations", { params });

export const checkInReservation = (
  reservationId: string,
  body: { bayCode?: string; notes?: string }
) => api.post(`slot-reservations/${reservationId}/check-in`, body);

/* =========================
 *  Swap
 * ========================= */
export const finalizeSwapFromReservation = (payload: {
  reservationId: string;
  oldBatterySerial: string;
}) => api.post<SwapFinalizeResponse>("swaps/finalize-from-reservation", payload);

export const completeSwap = (swapId: string) =>
  api.put(`swaps/${swapId}/complete`);

/* =========================
 *  Payments
 * ========================= */
export const listPayments = (params?: {
  status?: "Pending" | "Paid";
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}) => api.get<Payment[]>("payments", { params });

export const completeCashPayment = (paymentId: string) =>
  api.post(`payments/${paymentId}/complete-cash`, {});

/* =========================
 *  Inventory
 * ========================= */
export const stationBatteryStats = (stationId: string | number) =>
  api.get<StationBatteryStats>(`stations/${stationId}/battery-stats`);

/** Lấy danh sách pin, chuẩn hóa field cho UI (không hiển thị voltage vì DB không có) */
export const listStationBatteries = async (
  stationId: string | number
): Promise<{ data: BatteryUnit[] }> => {
  const { data } = await api.get<any[]>(`stations/${stationId}/batteries`);

  const normalizeStatus = (val: any): string => {
    const v = String(val || "").toLowerCase();
    if (v.includes("sẵn") || v.includes("available")) return "Available";
    if (v.includes("sử dụng") || v.includes("inuse")) return "InUse";
    if (v.includes("sạc") || v.includes("charging")) return "Charging";
    if (v.includes("bảo trì") || v.includes("maintenance")) return "Maintenance";
    if (v.includes("đặt") || v.includes("reserved")) return "Reserved";
    if (v.includes("lỗi") || v.includes("faulty")) return "Faulty";
    return "Available";
  };

  const normalized: BatteryUnit[] = (Array.isArray(data) ? data : []).map(
    (raw) => ({
      batteryId: raw?.batteryId ?? raw?.BatteryId ?? raw?.id ?? "N/A",
      serialNumber:
        raw?.serialNumber ??
        raw?.SerialNumber ??
        raw?.serial ??
        raw?.Serial ??
        raw?.code ?? // phòng khi DB lưu code
        raw?.Code ??
        "N/A",
      batteryModelId:
        raw?.batteryModelId ??
        raw?.BatteryModelId ??
        raw?.batteryModel?.id ??
        "N/A",
      batteryModelName:
        raw?.batteryModelName ??
        raw?.BatteryModelName ??
        raw?.batteryModel?.name ??
        undefined,
      status: normalizeStatus(raw?.status ?? raw?.Status),
      stationId:
        raw?.stationId ?? raw?.StationId ?? raw?.station?.id ?? undefined,
      updatedAt:
        raw?.updatedAt ??
        raw?.UpdatedAt ??
        raw?.lastUpdated ??
        raw?.LastUpdated ??
        raw?.modifiedAt ??
        raw?.ModifiedAt ??
        undefined,
      isReserved: Boolean(
        raw?.isReserved ?? raw?.IsReserved ?? raw?.reserved ?? raw?.Reserved ?? false
      ),
    })
  );

  return { data: normalized };
};

export const createReplenishmentRequest = (payload: {
  stationId: string | number;
  reason?: string;
  items: { batteryModelId: string; quantityRequested: number }[];
}) => api.post("replenishment-requests", payload);

export default api;
