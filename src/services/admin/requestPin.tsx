// src/services/admin/stockRequestService.ts
import api from "@/configs/axios";

// Interface gửi lên API
export interface ReviewStockRequestPayload {
  isApproved: boolean;
  adminNote: string;
}

// Interface response từ API (nếu backend trả object khác, bạn có thể chỉnh)
export interface ReviewStockRequestResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface StockRequest {
  id: string;
  stationId: string;
  stationName: string;
  batteryModelId: string;
  batteryModelName: string;
  quantity: number;
  staffNote: string | null;
  status: "PendingAdminReview" | "Approved" | "Rejected";
  requestedByStaffId: string;
  requestedByStaffName: string;
  requestDate: string;
  adminReviewerId: string | null;
  adminReviewerName: string | null;
  adminReviewDate: string | null;
  adminNote: string | null;
  relatedBulkCreateRequestId: string | null;
  updatedAt: string;
}

// Hàm review stock request
export const reviewStockRequest = async (
  id: string,
  payload: ReviewStockRequestPayload
): Promise<ReviewStockRequestResponse> => {
  try {
    const response = await api.post<ReviewStockRequestResponse>(
      `/api/v1/admin/stock-requests/${id}/review`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error reviewing stock request:", error);
    throw error.response?.data || error;
  }
};

export const getPendingStockRequests = async (): Promise<StockRequest[]> => {
  try {
    const response = await api.get<StockRequest[]>(
      `/api/v1/admin/stock-requests/pending`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching pending stock requests:", error);
    throw error.response?.data || error;
  }
};

export const getStockRequestById = async (
  id: string
): Promise<StockRequest> => {
  try {
    const response = await api.get<StockRequest>(
      `/api/v1/admin/stock-requests/${id}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching stock request by ID:", error);
    throw error.response?.data || error;
  }
};
