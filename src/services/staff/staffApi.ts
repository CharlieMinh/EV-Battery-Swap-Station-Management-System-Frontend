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
 *  Types
 * ========================= */
export type Reservation = {
  reservationId: string;
  userId?: string;
  userName?: string;
  vehiclePlate?: string;
  vehicleModelName?: string;
  batteryModelId?: string;
  batteryModelName?: string;
  status?: string;
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  checkInWindow?: { earliestTime?: string; latestTime?: string };
};

export type SwapFinalizeResponse = {
  success?: boolean;
  swapTransactionId?: string;
  message?: string;
  swapId?: string;
  reservationId?: string;
  timestamp?: string;
  oldBattery?: { serialNumber: string; modelName?: string; status?: string };
  newBattery?: { serialNumber: string; modelName?: string; status?: string };
  driverName?: string;
};

/** =========================
 *  Inventory Types
 * ========================= */
export type StationBatteryStats = {
  total?: number;
  available?: number;
  inUse?: number;
  charging?: number;
  maintenance?: number;
  reserved?: number;
  exportedToday?: number;
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

export const getMe = () =>
  api.get<UserMe>("Auth/me", { withCredentials: true });

/**
 * CHỈ dành cho Admin. FE đã chặn Staff trước khi gọi.
 * Dùng endpoint chuẩn: PUT /users/{id}
 */
export const updateUser = (
  userId: string,
  body: { fullName?: string; phone?: string; avatarUrl?: string }
) => api.put(`users/${userId}`, body);

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
 *  Queue APIs
 * ========================= */
export const listReservations = async (params: {
  stationId: string | number;
  date?: string;
  status?: string;
}) => {
  const res = await api.get<any>("slot-reservations", { params });
  const raw = Array.isArray(res.data)
    ? res.data
    : res.data?.items ?? res.data?.data ?? res.data?.results ?? [];

  const data: Reservation[] = (raw as any[]).map((x) => ({
    reservationId: x?.reservationId ?? x?.id ?? "",
    userId: x?.userId ?? x?.user?.id ?? "",
    userName: x?.userName ?? x?.user?.fullName ?? x?.user?.name ?? "",
    vehiclePlate: x?.vehiclePlate ?? x?.vehicle?.plate ?? "",
    vehicleModelName:
      x?.vehicleModelName ??
      x?.vehicleModel ??
      x?.vehicle?.modelName ??
      "",
    batteryModelId: x?.batteryModelId ?? "",
    batteryModelName: x?.batteryModelName ?? "",
    status: x?.status ?? "",
    slotDate: x?.slotDate ?? "",
    slotStartTime: x?.slotStartTime ?? "",
    slotEndTime: x?.slotEndTime ?? "",
    checkInWindow: x?.checkInWindow,
  }));

  return { data };
};

export const checkInReservation = (reservationId: string, qrCodeData: string) =>
  api.post(`slot-reservations/${reservationId}/check-in`, { qrCodeData });

/* =========================
 *  Swap APIs
 * ========================= */
export async function finalizeSwapFromReservation(payload: {
  reservationId: string;
  oldBatterySerial: string;
  stationId?: string | number;
}): Promise<SwapFinalizeResponse & { code?: number }> {
  const { reservationId, oldBatterySerial, stationId } = payload;

  const bodies = [
    { reservationId, oldBatterySerial, stationId },
    { reservationId, oldSerial: oldBatterySerial, stationId },
    { reservationId, serial: oldBatterySerial, stationId },
    { reservationId, oldBatteryCode: oldBatterySerial, stationId },
    { reservationId, oldBatterySn: oldBatterySerial, stationId },
    { reservationId, batterySerial: oldBatterySerial, stationId },
  ];

  for (const body of bodies) {
    try {
      const res = await api.post<SwapFinalizeResponse>(
        "swaps/finalize-from-reservation",
        body
      );
      return { success: true, ...res.data, code: 200 };
    } catch (e: any) {
      const code = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Đã có lỗi xảy ra.";
      if (code === 400 || code === 422) continue;
      if (code === 500) {
        console.warn("⚠️ BE 500; FE cho phép demo tiếp.");
        return { success: false, code, message: msg };
      }
      return { success: false, code, message: msg };
    }
  }
  return {
    success: false,
    code: 400,
    message: "Không thể finalize swap — các biến thể payload đều lỗi.",
  };
}

/* =========================
 *  Inventory APIs
 * ========================= */
export const stationBatteryStats = (stationId: string | number) =>
  api.get<StationBatteryStats>(`stations/${stationId}/battery-stats`);

export const listStationBatteries = async (stationId: string | number) => {
  const res = await api.get<any>(`stations/${stationId}/batteries`);
  const raw = Array.isArray(res.data)
    ? res.data
    : res.data?.items ??
      res.data?.data ??
      res.data?.results ??
      res.data?.value ??
      [];

  const data: BatteryUnit[] = (raw as any[]).map((x, i) => {
    const batteryId =
      x?.batteryId ??
      x?.id ??
      x?.batteryUnitId ??
      x?.unitId ??
      x?.guid ??
      "";

    const serialNumber =
      x?.serialNumber ??
      x?.serial ??
      x?.batterySerial ??
      x?.sn ??
      x?.serial_no ??
      x?.serial_code ??
      "";

    const modelId =
      x?.batteryModelId ?? x?.modelId ?? x?.battery_model_id ?? x?.model;

    const modelName =
      x?.batteryModelName ??
      x?.modelName ??
      x?.battery_model_name ??
      x?.model ??
      "";

    const status =
      x?.status ??
      x?.batteryStatus ??
      x?.state ??
      x?.battery_state ??
      x?.battery_status ??
      "";

    const isReserved = Boolean(x?.isReserved ?? x?.reserved ?? x?.is_booked);

    const updatedAt =
      x?.updatedAt ??
      x?.lastUpdatedAt ??
      x?.modifiedAt ??
      x?.updated_at ??
      x?.last_update_at ??
      x?.timestamp ??
      undefined;

    return {
      batteryId: batteryId || serialNumber || `row-${i}`,
      serialNumber,
      batteryModelId: modelId,
      batteryModelName: modelName,
      status,
      isReserved,
      updatedAt,
    };
  });

  return { data };
};

export const createReplenishmentRequest = (payload: {
  stationId: string | number;
  reason?: string;
  items: Array<{ batteryModelId: string; quantityRequested: number }>;
}) =>
  api.post(
    `stations/${payload.stationId}/replenishment-requests`,
    payload
  );

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
  const endpoints = ["files/upload", "upload", "media/upload"];
  for (const url of endpoints) {
    try {
      const res = await api.post<{ url?: string; path?: string }>(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      const link = (res.data.url || res.data.path || "").toString();
      if (link) return link;
    } catch (err: any) {
      if (err?.response?.status && err.response.status < 500) continue;
      throw err;
    }
  }
  throw new Error("Upload failed");
};

export default api;

export type UserLite = { id: string; fullName?: string; name?: string; email?: string };

const USERNAME_CACHE_KEY = "userNameCache.v1";
let __USER_NAME_CACHE: Record<string, string> = (() => {
  try {
    return JSON.parse(localStorage.getItem(USERNAME_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
})();

function saveUserNameCache() {
  try {
    localStorage.setItem(USERNAME_CACHE_KEY, JSON.stringify(__USER_NAME_CACHE));
  } catch {}
}

function pickName(u: any): string | undefined {
  return (
    u?.fullName ||
    u?.name ||
    u?.displayName ||
    u?.username ||
    u?.email ||
    u?.user?.fullName ||
    u?.user?.name ||
    undefined
  );
}

async function fetchUserById(id: string): Promise<string | null> {
  try {
    const res = await api.get(`/Users/${id}`);
    const name = pickName(res.data);
    return name || null;
  } catch {
    return null;
  }
}

export async function getUserNameById(userId?: string): Promise<string> {
  const id = (userId || "").trim();
  if (!id) return "";
  if (__USER_NAME_CACHE[id]) return __USER_NAME_CACHE[id];

  const name = await fetchUserById(id);
  const finalName = name || `Khách #${id.slice(-4)}`;
  __USER_NAME_CACHE[id] = finalName;
  saveUserNameCache();
  return finalName;
}

export async function getUserNamesBatch(userIds: (string | undefined)[]): Promise<Record<string, string>> {
  const ids = Array.from(new Set(userIds.filter((x): x is string => !!x)));
  const result: Record<string, string> = {};

  const need: string[] = [];
  for (const id of ids) {
    if (__USER_NAME_CACHE[id]) result[id] = __USER_NAME_CACHE[id];
    else need.push(id);
  }
  if (need.length === 0) return result;

  try {
    const res = await api.get(`/Users`, { params: { ids: need.join(",") } });
    const data = Array.isArray(res.data)
      ? res.data
      : res.data?.items ?? res.data?.data ?? res.data?.results ?? [];

    for (const u of data) {
      const id = u?.id ?? u?.userId;
      const name = pickName(u);
      if (id && name) {
        __USER_NAME_CACHE[id] = name;
        result[id] = name;
      }
    }
    saveUserNameCache();

    const still = need.filter((id) => !result[id]);
    await Promise.all(
      still.map(async (id) => {
        const n = await fetchUserById(id);
        const finalName = n || `Khách #${id.slice(-4)}`;
        __USER_NAME_CACHE[id] = finalName;
        result[id] = finalName;
      })
    );
    saveUserNameCache();
    return result;
  } catch {
    await Promise.all(
      need.map(async (id) => {
        const n = await fetchUserById(id);
        const finalName = n || `Khách #${id.slice(-4)}`;
        __USER_NAME_CACHE[id] = finalName;
        result[id] = finalName;
      })
    );
    saveUserNameCache();
    return result;
  }
}
