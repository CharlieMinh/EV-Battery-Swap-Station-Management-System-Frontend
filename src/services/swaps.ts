import api from "@/configs/axios";
import { toast } from "react-toastify";

// === Types ===
export interface SwapTransaction {
  id: string;
  transactionNumber: string;
  status: string;
  userEmail: string;
  stationName: string;
  stationAddress: string;
  vehicleLicensePlate: string;
  vehicleModel: string;
  vehicleOdoAtSwap: number;
  issuedBatterySerial: string;
  returnedBatterySerial: string;
  batteryHealthIssued: number;
  batteryHealthReturned: number;
  paymentType: string;
  swapFee: number;
  kmChargeAmount: number;
  totalAmount: number;
  isPaid: boolean;
  startedAt: Date;
  checkedInAt: Date;
  batteryIssuedAt: Date;
  batteryReturnedAt: Date;
  completedAt: Date;
  notes: string;
  reservationId: string;
  userSubscriptionId: string;
  rating: number;
  feedback: string;
  ratedAt: Date;
}

export interface SlotReservationResponse {
  reservationId: string;
  userId: string;
  userName?: string;
  stationId: string;
  batteryModelId?: string;
  batteryModelName?: string;
  vehicleId: string;
  qrCode?: string;
  status: string;
  slotDate: string;         // ISO date string, ví dụ "2025-10-31"
  slotStartTime: string;    // ISO time string hoặc "HH:mm:ss"
  slotEndTime: string;      // ISO time string hoặc "HH:mm:ss"
  createdAt: string;        // ISO datetime string
  relatedComplaintId?: string; // ⭐ quan trọng: có giá trị nếu là khiếu nại
}

// === Complaint Types ===
export interface InvestigateComplaintRequest {
  investigationNotes?: string;
}

export interface ResolveComplaintRequest {
  newStatus: "Confirmed" | "Rejected";
  resolutionNotes: string;
}

export interface CompleteReswapRequest {
  returnedBatteryHealth?: number;
}

// === Swap APIs ===
export async function fetchSwapById(id: string) {
  const response = await api.get(`/api/v1/SwapTransactions/${id}`);
  return response.data as SwapTransaction;
}

// === Complaint APIs ===

// 4️⃣ Bắt đầu kiểm tra (Investigating)
export async function startComplaintInvestigation(
  complaintId: string,
  notes?: string
) {
  try {
    const res = await api.post(
      `/api/BatteryComplaints/${complaintId}/investigate`,
      {
        investigationNotes: notes || "Kiểm tra thực tế tại trạm.",
      } satisfies InvestigateComplaintRequest
    );
    toast.success("Bắt đầu kiểm tra khiếu nại thành công!");
    return res.data;
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Bắt đầu kiểm tra thất bại!");
    throw err;
  }
}

// 5️⃣ Ra quyết định (Resolve)
export async function resolveComplaint(
  complaintId: string,
  newStatus: "Confirmed" | "Rejected",
  notes: string
) {
  try {
    const res = await api.post(
      `/api/BatteryComplaints/${complaintId}/resolve`,
      {
        newStatus,
        resolutionNotes: notes,
      } satisfies ResolveComplaintRequest
    );
    toast.success("Ra quyết định khiếu nại thành công!");
    return res.data;
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Ra quyết định thất bại!");
    throw err;
  }
}

// 6️⃣ Hoàn tất Re-swap (Resolved)
export async function finalizeComplaintReswap(
  complaintId: string,
  stationId: string,
  returnedBatteryHealth?: number
) {
  try {
    const res = await api.post(
      `/api/BatteryComplaints/${complaintId}/finalize-reswap`,
      { returnedBatteryHealth } satisfies CompleteReswapRequest,
      { params: { stationId } }
    );
    toast.success("Hoàn tất Re-swap thành công!");
    return res.data;
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Hoàn tất Re-swap thất bại!");
    throw err;
  }
}

// (Optional) lấy danh sách khiếu nại
export async function listComplaints(params?: { page?: number; pageSize?: number }) {
  try {
    const res = await api.get(`/api/BatteryComplaints`, { params });
    return res.data;
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Lấy danh sách khiếu nại thất bại!");
    throw err;
  }
}

// (Optional) lấy chi tiết khiếu nại
export async function getComplaintById(id: string) {
  try {
    const res = await api.get(`/api/BatteryComplaints/${id}`);
    return res.data;
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Lấy chi tiết khiếu nại thất bại!");
    throw err;
  }
}

export async function fetchReservationDetail(reservationId: string): Promise<SlotReservationResponse | null> {
  try {
    const res = await api.get(`/api/v1/slot-reservations/${reservationId}`);
    return res.data;
  } catch (err) {
    console.error("fetchReservationDetail error:", err);
    return null;
  }
}
