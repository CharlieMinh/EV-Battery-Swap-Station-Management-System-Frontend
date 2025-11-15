// src/services/staff/staffDriverService.ts
import api from "@/services/staff/staffApi";
import type { Customer } from "@/services/admin/customerAdminService";

/** Kết quả phân trang khách hàng (Driver) */
export interface PaginatedCustomersResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Customer[];
}

/**
 * Payload tạo Driver (Staff dùng)
 * BE: CreateUserRequest
 * - Staff chỉ được tạo tài khoản Role = Driver (0)
 * - Status để 0 (Active)
 */
export interface CreateDriverPayload {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;

  // cho phép truyền nhưng sẽ mặc định nếu không có
  role?: number;   // 0 = Driver, 1 = Staff, 2 = Admin
  status?: number; // 0 = Active, 1 = Locked
}

/**
 * Staff tạo tài khoản Driver
 * BE endpoint: POST /api/v1/Users
 * Roles được phép: Admin,Staff
 */
export async function createDriverByStaff(
  payload: CreateDriverPayload
): Promise<Customer> {
  const body = {
    email: payload.email.trim(),
    password: payload.password,
    name: payload.name.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    role: payload.role ?? 0,    // Driver
    status: payload.status ?? 0 // Active
  };

  // staffApi đã có baseURL = http://.../api/v1
  const res = await api.post("Users", body);

  // response thực tế từ BE (UserResponse)
  const u = res.data as any;

  const driver = {
    id: u.id ?? u.Id,
    email: u.email ?? u.Email,
    name: u.name ?? u.Name,
    phoneNumber: u.phoneNumber ?? u.PhoneNumber ?? "",
    status: u.status ?? u.Status ?? "Active",
    totalReservations: u.totalReservations ?? u.TotalReservations ?? 0,
    completedReservations:
      u.completedReservations ?? u.CompletedReservations ?? 0,
  } as Customer; // 👈 ép kiểu

  return driver;
}

/**
 * Staff xem danh sách khách hàng (Driver)
 * BE: GET /api/v1/Users/customers
 * Roles được phép: Admin,Staff
 */
export async function fetchCustomersByStaff(
  page: number,
  pageSize: number,
  search?: string
): Promise<PaginatedCustomersResponse> {
  const res = await api.get("Users/customers", {
    params: {
      page,
      pageSize,
      search: search?.trim() || undefined,
    },
  });

  const raw = res.data as {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    data: any[];
  };

  const mapped = raw.data.map((c: any) => {
    const obj = {
      id: c.id ?? c.Id,
      email: c.email ?? c.Email,
      name: c.name ?? c.Name,
      phoneNumber: c.phoneNumber ?? c.PhoneNumber ?? "",
      status: c.status ?? c.Status ?? "Active",
      totalReservations: c.totalReservations ?? c.TotalReservations ?? 0,
      completedReservations:
        c.completedReservations ?? c.CompletedReservations ?? 0,
    } as Customer; // 👈 ép kiểu

    return obj;
  }) as Customer[]; // 👈 ép kiểu thêm cho chắc

  return {
    page: raw.page,
    pageSize: raw.pageSize,
    totalItems: raw.totalItems,
    totalPages: raw.totalPages,
    data: mapped,
  };
}

/**
 * Staff cập nhật thông tin Driver
 * - Staff chỉ được đổi Name, PhoneNumber
 * - KHÔNG gửi Role, Status vì BE không cho Staff đổi
 *
 * BE: PUT /api/v1/Users/{id}
 * [Consumes("multipart/form-data")]
 */
export interface UpdateDriverPayload {
  name: string;
  phoneNumber: string;
}

export async function updateDriverByStaff(
  userId: string,
  payload: UpdateDriverPayload
): Promise<Customer> {
  const form = new FormData();

  if (payload.name.trim()) {
    form.append("Name", payload.name.trim());
  }
  if (payload.phoneNumber.trim()) {
    form.append("PhoneNumber", payload.phoneNumber.trim());
  }

  const res = await api.put(`Users/${userId}`, form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const u = res.data as any;

  const driver = {
    id: u.id ?? u.Id,
    email: u.email ?? u.Email,
    name: u.name ?? u.Name,
    phoneNumber: u.phoneNumber ?? u.PhoneNumber ?? "",
    status: u.status ?? u.Status ?? "Active",
    totalReservations: u.totalReservations ?? u.TotalReservations ?? 0,
    completedReservations:
      u.completedReservations ?? u.CompletedReservations ?? 0,
  } as Customer; // 👈 ép kiểu

  return driver;
}
