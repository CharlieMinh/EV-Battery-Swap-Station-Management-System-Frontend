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

  // User
  userId?: string;
  userName?: string;

  // --- Vehicle fields (mới từ BE) ---
  vehicleId?: string;
  vehicleName?: string;
  licensePlate?: string;

  // --- Alias cũ để không vỡ UI cũ ---
  vehiclePlate?: string;
  vehicleModelName?: string;

  // Battery
  batteryModelId?: string;
  batteryModelName?: string;

  status?: string;
  qrCode?: string;

  // thông tin slot (để hiển thị khung giờ)
  slotDate?: string;
  slotStartTime?: string;
  slotEndTime?: string;
  checkInWindow?: { earliestTime?: string; latestTime?: string };

  relatedComplaintId: string;
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
  stationId?: string | number;
};

export const STATUS_LABELS_VI: Record<string, string> = {
  Available: "Đầy", // Đổi hiển thị cho khớp UI
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
  profilePictureUrl?: string;
};

export const getMe = () =>
  api.get<UserMe>("Auth/me", { withCredentials: true });

/* =========================
 *  updateUser
 * ========================= */
export const updateUser = async (
  userId: string,
  body: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    avatarFile?: File | null;
  }
) => {
  const candidates = [
    { method: "put", url: `users/${userId}` },
    { method: "patch", url: `users/${userId}` },
    { method: "put", url: `staff/users/${userId}` },
    { method: "post", url: `users/update-profile` },
    { method: "post", url: `Auth/update-profile` },
    { method: "post", url: `me` },
  ] as const;

  const Name = (body.fullName ?? "").trim();
  const PhoneNumber = (body.phone ?? "").trim();

  const form = new FormData();
  if (Name) form.append("Name", Name);
  if (PhoneNumber) form.append("PhoneNumber", PhoneNumber);
  if (body.avatarFile) form.append("ProfilePicture", body.avatarFile);

  const jsonPayload = {
    fullName: Name || undefined,
    name: Name || undefined,
    phone: PhoneNumber || undefined,
    phoneNumber: PhoneNumber || undefined,
    avatarUrl: body.avatarUrl || undefined,
  };

  let lastErr: any = null;
  for (const c of candidates) {
    try {
      if (c.method === "put" && c.url.toLowerCase().startsWith("users/")) {
        return await api.put(c.url, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      if (c.method === "put") return await api.put(c.url, jsonPayload);
      if (c.method === "patch") return await api.patch(c.url, jsonPayload);
      return await api.post(c.url, jsonPayload);
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

/* =========================
 *  Change Password
 * ========================= */
export const resetPassword = async (payload: {
  oldPassword?: string;
  currentPassword?: string;
  newPassword: string;
  confirmPassword?: string;
}) => {
  const current =
    (payload.currentPassword ?? payload.oldPassword ?? "").toString();
  const newPwd = (payload.newPassword ?? "").toString();
  const confirm = (payload.confirmPassword ?? payload.newPassword ?? "").toString();

  const bodyCamel = {
    currentPassword: current,
    newPassword: newPwd,
    confirmPassword: confirm,
  };

  const urls = [
    "Auth/change-password",
    "users/change-password",
    "me/change-password",
    "users/me/change-password",
  ];

  let lastErr: any = null;
  for (const url of urls) {
    try {
      return await api.post(url, bodyCamel, { withCredentials: true });
    } catch (e: any) {
      if (e?.response?.status && e.response.status < 500) {
        lastErr = e;
        continue;
      }
      throw e;
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

  const pickVehicleName = (x: any) =>
    x?.vehicleName ??
    x?.vehicleModelName ??
    x?.vehicle?.vehicleModel?.name ??
    x?.vehicle?.modelName ??
    x?.vehicleModel ??
    "";

  const pickLicensePlate = (x: any) =>
    x?.licensePlate ??
    x?.vehiclePlate ??
    x?.license ??
    x?.vehicle?.plateNumber ??
    x?.vehicle?.licensePlate ??
    x?.vehicle?.plate ??
    x?.plate ??
    "";

  const data: Reservation[] = (raw as any[]).map((x) => {
    const id = x?.reservationId ?? x?.id ?? "";
    const userId = x?.userId ?? x?.user?.id ?? "";

    const vehicleId =
      x?.vehicleId ??
      x?.vehicle?.id ??
      x?.vehicle?.vehicleId ??
      undefined;

    const vehicleName = pickVehicleName(x);
    const licensePlate = pickLicensePlate(x);

    const batteryModelId = x?.batteryModelId ?? x?.batteryModel?.id ?? "";
    const batteryModelName =
      x?.batteryModelName ?? x?.batteryModel?.name ?? "";

    return {
      reservationId: id,
      userId,
      userName: x?.userName ?? x?.user?.fullName ?? x?.user?.name ?? "",
      vehicleId,
      vehicleName,
      licensePlate,
      vehiclePlate: licensePlate,
      vehicleModelName: vehicleName,
      batteryModelId,
      batteryModelName,
      status: x?.status ?? "",
      qrCode: x?.qrCode ?? "",
      slotDate: x?.slotDate ?? "",
      slotStartTime: x?.slotStartTime ?? "",
      slotEndTime: x?.slotEndTime ?? "",
      checkInWindow: x?.checkInWindow,
      relatedComplaintId: x?.relatedComplaintId ?? "",
    };
  });

  return { data };
};

export const checkInReservation = (reservationId: string, qrCodeData: string) =>
  api.post(`slot-reservations/${reservationId}/check-in`, { qrCodeData });

/* =========================
 *  Swap APIs
 * ========================= */
export async function finalizeSwapFromReservation(payload: {
  reservationId: string;
  oldBatteryHealth: number;
  note?: string;
}): Promise<SwapFinalizeResponse & { code?: number }> {
  const { reservationId, oldBatteryHealth, note } = payload;

  try {
    const requestBody = { reservationId, oldBatteryHealth, notes: note } as any;
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
    if (code === 500) return { success: false, code, message: msg };
    return { success: false, code, message: msg };
  }
}

/* =========================================================
 *  Inventory APIs
 * ========================================================= */
function sameStation(a?: string | number, b?: string | number) {
  if (a == null || b == null) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

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

async function fetchBatteryUnitsRaw(stationId: string | number): Promise<any[]> {
  const res = await api.get(`stations/${stationId}/batteries`);
  const raw = Array.isArray(res.data)
    ? res.data
    : res.data?.items ??
      res.data?.data ??
      res.data?.results ??
      res.data?.value ??
      [];
  return raw;
}

export const listStationBatteries = async (stationId: string | number) => {
  const raw = await fetchBatteryUnitsRaw(stationId);
  const normalized = raw.map(normalizeBatteryItem);
  const filtered = normalized.filter((b) =>
    b.stationId ? sameStation(b.stationId, stationId) : true
  );
  return { data: filtered };
};

function normStatus(raw?: string) {
  const s = (raw || "").trim().toLowerCase();
  if (["available", "ready", "full", "sẵn sàng", "đầy"].includes(s))
    return "Available";
  if (["inuse", "in use", "đang sử dụng"].includes(s)) return "InUse";
  if (["charging", "đang sạc"].includes(s)) return "Charging";
  if (["maintenance", "bảo trì"].includes(s)) return "Maintenance";
  if (["reserved", "đã đặt trước"].includes(s)) return "Reserved";
  if (["faulty", "lỗi"].includes(s)) return "Faulty";
  if (["depleted", "empty", "hết pin"].includes(s)) return "Depleted";
  return "";
}

export async function getStationInventory(
  stationId: string | number
): Promise<{
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
}) =>
  api.post(`stations/${payload.stationId}/replenishment-requests`, payload);

/* =========================
 *  BatteryUnits status update – dùng cho "Kiểm tra pin"
 * ========================= */

export type BatteryStatusBackend =
  | "Full"
  | "Reserved"
  | "InUse"
  | "Charging"
  | "Depleted"
  | "Maintenance"
  | "Faulty";

/** helper: lấy root host từ API_BASE_URL (bỏ /api hoặc /api/v1) */
function getRootApiBase(): string {
  const m = API_BASE_URL.match(/^(.*)\/api(?:\/v1)?$/i);
  return m ? m[1] : API_BASE_URL;
}

// map text client → tên enum BE
function normalizeBackendStatusName(s: string): BatteryStatusBackend {
  const raw = (s || "").trim();
  const lower = raw.toLowerCase();

  if (["available", "ready", "full", "sẵn sàng", "đầy"].includes(lower))
    return "Full";
  if (["reserved", "đã đặt trước"].includes(lower)) return "Reserved";
  if (["inuse", "in use", "đang sử dụng"].includes(lower)) return "InUse";
  if (["charging", "đang sạc"].includes(lower)) return "Charging";
  if (["depleted", "hết pin", "empty"].includes(lower)) return "Depleted";
  if (["maintenance", "bảo trì"].includes(lower)) return "Maintenance";
  if (["faulty", "lỗi"].includes(lower)) return "Faulty";

  return "Full";
}

// ⭐ map enum → mã số BE (đúng với BatteryStatus.cs)
const STATUS_CODE_MAP: Record<BatteryStatusBackend, number> = {
  Full: 0,
  Reserved: 1,
  InUse: 2,
  Charging: 3,
  Depleted: 4,
  Maintenance: 5,
  Faulty: 6,
};

/** Cập nhật trạng thái 1 viên pin – gửi JSON number đúng enum cho BE */
export const updateBatteryStatus = (
  batteryId: string,
  status: BatteryStatusBackend | string
) => {
  const root = getRootApiBase(); // vd: http://localhost:5194
  const url = `${root}/api/BatteryUnits/${batteryId}/status`;

  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");

  const name = normalizeBackendStatusName(status as string);
  const code = STATUS_CODE_MAP[name];

  return axios.patch(
    url,
    code, // gửi số 0..6, BE bind sang BatteryStatus
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );
};

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
  customer?: any;
  customerName?: string;
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

  const res = await api.post<{ url?: string }>(
    "FileUpload/vehicle-photo",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: true,
    }
  );

  const link = (res.data?.url || "").toString();
  if (link) return link;

  throw new Error("Upload failed: no URL returned");
};

export default api;

/* =========================
 *  User name cache helpers
 * ========================= */
export type UserLite = {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
};

const USERNAME_CACHE_KEY = "userNameCache.v1";
let __USER_NAME_CACHE: Record<string, string> = (() => {
  try {
    return JSON.parse(localStorage.getItem(USERNAME_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
})();

let __CUSTOMERS_LOADED = false;
let __LOADING_CUSTOMERS: Promise<void> | null = null;

async function preloadCustomers() {
  if (__CUSTOMERS_LOADED) return;
  if (__LOADING_CUSTOMERS) return __LOADING_CUSTOMERS;

  __LOADING_CUSTOMERS = (async () => {
    try {
      const res = await api.get("/Users/customers", {
        params: { page: 1, pageSize: 1000 },
      });

      const customers = res.data?.data || [];
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

async function fetchUserById(id: string): Promise<string | null> {
  try {
    try {
      const res = await api.get(`/Users/${id}`);
      const name = pickName(res.data);
      if (name) return name;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        // không có quyền, fallback dưới
      }
    }

    const customersRes = await api.get("/Users/customers", {
      params: { page: 1, pageSize: 100 },
    });

    const customers = customersRes.data?.data || [];
    const user = customers.find((u: any) => u.id === id || u.Id === id);

    if (user) {
      const name = pickName(user);
      return name || null;
    }

    return null;
  } catch (err) {
    console.error(`❌ Failed to fetch user ${id}:`, err);
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

export async function getUserNamesBatch(
  userIds: (string | undefined)[]
): Promise<Record<string, string>> {
  const ids = Array.from(new Set(userIds.filter((x): x is string => !!x)));
  const result: Record<string, string> = {};

  await preloadCustomers();

  for (const id of ids) {
    if (__USER_NAME_CACHE[id]) {
      result[id] = __USER_NAME_CACHE[id];
    } else {
      result[id] = `Khách #${id.slice(-4)}`;
    }
  }
  return result;
}
