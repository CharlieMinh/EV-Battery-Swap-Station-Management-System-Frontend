// src/services/staff/staffApi.ts
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
  userId?: string;          // ⭐ thêm để map tên
  userName?: string;        // nếu BE có sẵn thì dùng luôn
  vehiclePlate?: string;
  vehicleModelName?: string;
  batteryModelId?: string;
  batteryModelName?: string;
  status?: string;
  qrCode?: string;          // ⭐ QR code từ BE (đã có signature)

  // thông tin slot (để hiển thị khung giờ)
  slotDate?: string;        // yyyy-MM-dd
  slotStartTime?: string;   // HH:mm:ss
  slotEndTime?: string;     // HH:mm:ss
  checkInWindow?: { earliestTime?: string; latestTime?: string };

  relatedComplaintId: string,
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
  faulty?: number;
  depleted?: number;
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
  stationId?: string | number; // ⭐ cần cho lọc đúng trạm
};

export const STATUS_LABELS_VI: Record<string, string> = {
  Available: "Sẵn sàng",
  InUse: "Đang sử dụng",
  Charging: "Đang sạc",
  Maintenance: "Bảo trì",
  Reserved: "Đã đặt trước",
  Faulty: "Lỗi",
  Depleted: "Hết pin",
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

/** Chuẩn hoá response để luôn có userId/userName và các field slot */
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
    qrCode: x?.qrCode ?? "",
    slotDate: x?.slotDate ?? "",
    slotStartTime: x?.slotStartTime ?? "",
    slotEndTime: x?.slotEndTime ?? "",
    checkInWindow: x?.checkInWindow,
    relatedComplaintId: x?.relatedComplaintId ?? "",
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
  oldBatteryHealth: number;  // ⭐ % pin cũ (0-100)
  note?: string;  // ⭐ Ghi chú từ staff
}): Promise<SwapFinalizeResponse & { code?: number }> {
  const { reservationId, oldBatteryHealth, note } = payload;

  // ⭐ DEBUG: Log request payload
  console.log("🔍 staffApi - finalizeSwapFromReservation payload:", {
    reservationId,
    oldBatteryHealth,
    note,
    noteType: typeof note,
    noteLength: note?.length || 0,
  });

  try {
    // Backend expects property name `Notes` (JSON `notes`). Map it explicitly.
    const requestBody = { reservationId, oldBatteryHealth, notes: note } as any;
    console.log("🔍 staffApi - Request body being sent:", requestBody);
    
    const res = await api.post<SwapFinalizeResponse>(
      "swaps/finalize-from-reservation",
      requestBody
    );
    return { success: true, ...res.data, code: 200 };
  } catch (e: any) {
    const code = e?.response?.status;
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      e?.message ||
      "Đã có lỗi xảy ra.";
    
    if (code === 500) {
      console.warn("⚠️ BE 500; FE cho phép demo tiếp.");
      return { success: false, code, message: msg };
    }
    return { success: false, code, message: msg };
  }
}

/* =========================================================
 *  Inventory APIs (đã thay đổi theo yêu cầu)
 *  - Loại bỏ stationBatteryStats
 *  - Chỉ dùng /BatteryUnits và đảm bảo lọc đúng stationId
 * ========================================================= */

/** Helper: so sánh stationId an toàn */
function sameStation(a?: string | number, b?: string | number) {
  if (a == null || b == null) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/** Chuẩn hoá 1 record BatteryUnit */
function normalizeBatteryItem(x: any, i: number): BatteryUnit {
  const batteryId =
    x?.batteryId ?? x?.id ?? x?.batteryUnitId ?? x?.unitId ?? x?.guid ?? "";

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

  const stationId =
    x?.stationId ??
    x?.station_id ??
    x?.station?.id ??
    x?.station?.stationId ??
    x?.locationId ??
    undefined;

  return {
    batteryId: batteryId || serialNumber || `row-${i}`,
    serialNumber,
    batteryModelId: modelId,
    batteryModelName: modelName,
    status,
    isReserved,
    updatedAt,
    stationId,
  };
}

/** Gọi /BatteryUnits (thử nhiều biến thể đường dẫn) */
async function fetchBatteryUnitsRaw(stationId: string | number): Promise<any[]> {
  const paths: Array<{ url: string; withParam?: boolean }> = [
    { url: "BatteryUnits", withParam: true },     // /api/v1/BatteryUnits?stationId=...
    { url: "battery-units", withParam: true },    // /api/v1/battery-units?stationId=...
    { url: "batteryunits", withParam: true },     // fallback
    // fallback rất cũ: vẫn để dưới station
    { url: `stations/${stationId}/batteries`, withParam: false },
  ];

  let lastErr: any = null;
  for (const p of paths) {
    try {
      const res = await api.get<any>(p.url, p.withParam ? { params: { stationId } } : undefined);
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.items ?? res.data?.data ?? res.data?.results ?? res.data?.value ?? [];
      if (Array.isArray(raw)) return raw;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Không tải được danh sách BatteryUnits");
}

/** ⭐ Danh sách pin của ĐÚNG trạm staff đang hoạt động */
export const listStationBatteries = async (stationId: string | number) => {
  const raw = await fetchBatteryUnitsRaw(stationId);
  const normalized = raw.map(normalizeBatteryItem);

  // Nếu BE chưa filter → lọc client theo stationId
  const filtered = normalized.filter((b) =>
    b.stationId ? sameStation(b.stationId, stationId) : true
  );

  return { data: filtered };
};

/** Map nhóm trạng thái (phục vụ thống kê) */
function normStatus(raw?: string) {
  const s = (raw || "").trim().toLowerCase();
  if (["available", "ready", "full", "sẵn sàng", "đầy"].includes(s)) return "Available";
  if (["inuse", "in use", "đang sử dụng"].includes(s)) return "InUse";
  if (["charging", "đang sạc"].includes(s)) return "Charging";
  if (["maintenance", "bảo trì"].includes(s)) return "Maintenance";
  if (["reserved", "đã đặt trước"].includes(s)) return "Reserved";
  if (["faulty", "lỗi"].includes(s)) return "Faulty";
  if (["depleted", "empty", "hết pin"].includes(s)) return "Depleted";
  return "";
}

/** ⭐ Thống kê trực tiếp từ BatteryUnits (đúng trạm) */
export async function getStationInventory(stationId: string | number): Promise<{
  list: BatteryUnit[];
  stats: StationBatteryStats;
}> {
  const { data: list } = await listStationBatteries(stationId);
  const by = (v: string) => list.filter((b) => normStatus(b.status) === v).length;

  const stats: StationBatteryStats = {
    total: list.length,
    available: by("Available"),
    inUse: by("InUse"),
    charging: by("Charging"),
    maintenance: by("Maintenance"),
    reserved: by("Reserved"),
    faulty: by("Faulty"),
    depleted: by("Depleted"),
  };

  return { list, stats };
}
/** Gửi yêu cầu nhập pin cho trạm */
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

/* =========================
 *  User name cache helpers
 * ========================= */
export type UserLite = { id: string; fullName?: string; name?: string; email?: string };

const USERNAME_CACHE_KEY = "userNameCache.v1";
let __USER_NAME_CACHE: Record<string, string> = (() => {
  try {
    return JSON.parse(localStorage.getItem(USERNAME_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
})();

// ⭐ Cache toàn bộ danh sách customers
let __CUSTOMERS_LOADED = false;
let __LOADING_CUSTOMERS: Promise<void> | null = null;

/** Pre-load toàn bộ customers vào cache (chỉ gọi 1 lần) */
async function preloadCustomers() {
  if (__CUSTOMERS_LOADED) return;
  if (__LOADING_CUSTOMERS) return __LOADING_CUSTOMERS;
  
  __LOADING_CUSTOMERS = (async () => {
    try {
      console.log("🔄 Pre-loading customers list...");
      const res = await api.get('/Users/customers', { 
        params: { page: 1, pageSize: 1000 }
      });
      
      const customers = res.data?.data || [];
      console.log(`✅ Loaded ${customers.length} customers`);
      
      for (const user of customers) {
        const id = user?.id || user?.Id;
        const name = pickName(user);
        if (id && name) {
          __USER_NAME_CACHE[id] = name;
        }
      }
      
      saveUserNameCache();
      __CUSTOMERS_LOADED = true;
    } catch (err) {
      console.error("❌ Failed to preload customers:", err);
    }
  })();
  
  return __LOADING_CUSTOMERS;
}

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

/** Gọi API lấy tên user - Staff dùng /Users/customers */
async function fetchUserById(id: string): Promise<string | null> {
  try {
    console.log(`🌐 Calling GET /Users/customers (search by ID ${id})`);
    
    // Thử gọi /Users/{id} trước (nếu Staff có quyền)
    try {
      const res = await api.get(`/Users/${id}`);
      console.log(`📥 Response for ${id}:`, res.data);
      const name = pickName(res.data);
      if (name) return name;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        console.warn(`⚠️ Staff không có quyền GET /Users/${id}, thử dùng /Users/customers`);
      }
    }
    
    // Fallback: Dùng /Users/customers với pagination lớn
    const customersRes = await api.get('/Users/customers', { 
      params: { page: 1, pageSize: 100 } 
    });
    console.log(`📥 Customers response:`, customersRes.data);
    
    const customers = customersRes.data?.data || [];
    const user = customers.find((u: any) => u.id === id || u.Id === id);
    
    if (user) {
      const name = pickName(user);
      console.log(`✅ Found user ${id} from customers:`, name);
      return name || null;
    }
    
    console.warn(`⚠️ User ${id} not found in customers list`);
    return null;
  } catch (err) {
    console.error(`❌ Failed to fetch user ${id}:`, err);
    return null;
  }
}

/** Lấy tên 1 userId (có cache). Nếu không lấy được → fallback "Khách #xxxx" */
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

/** Lấy tên theo mảng userId. Pre-load customers trước, rồi lấy từ cache */
export async function getUserNamesBatch(userIds: (string | undefined)[]): Promise<Record<string, string>> {
  const ids = Array.from(new Set(userIds.filter((x): x is string => !!x)));
  const result: Record<string, string> = {};

  console.log("📞 getUserNamesBatch - Input IDs:", ids);

  // ⭐ Pre-load customers nếu chưa load
  await preloadCustomers();

  // Lấy từ cache
  for (const id of ids) {
    if (__USER_NAME_CACHE[id]) {
      result[id] = __USER_NAME_CACHE[id];
    } else {
      // Fallback nếu không tìm thấy
      result[id] = `Khách #${id.slice(-4)}`;
      console.warn(`⚠️ User ${id} not found in cache`);
    }
  }
  
  console.log("✅ getUserNamesBatch - Final result:", result);
  return result;
}
