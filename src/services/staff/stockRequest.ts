import api from "@/configs/axios"; // hoặc đường dẫn tới instance axios của bạn

export interface CreateStockRequestPayload {
  stationId: string;
  batteryModelId: string;
  quantity: number;
  staffNote?: string;
}

export interface StockRequestResponse {
  id: string;
  stationId: string;
  stationName: string;
  batteryModelId: string;
  batteryModelName: string;
  quantity: number;
  staffNote: string;
  status: string;
  requestedByStaffId: string;
  requestedByStaffName: string;
  requestDate: string;
  adminReviewerId?: string;
  adminReviewerName?: string;
  adminReviewDate?: string;
  adminNote?: string;
  relatedBulkCreateRequestId?: string;
  updatedAt: string;
}
export interface StockRequest {
  id: string;
  stationId: string;
  stationName: string;
  batteryModelId: string;
  batteryModelName: string;
  quantity: number;
  staffNote: string;
  status: string;
  requestedByStaffId: string;
  requestedByStaffName: string;
  requestDate: string;
  adminReviewerId?: string;
  adminReviewerName?: string;
  adminReviewDate?: string;
  adminNote?: string;
  relatedBulkCreateRequestId?: string;
  updatedAt: string;
}
/**
 * Tạo yêu cầu nhập pin (stock request) cho trạm
 */
export const createStockRequest = async (
  payload: CreateStockRequestPayload
): Promise<StockRequestResponse> => {
  const response = await api.post<StockRequestResponse>(
    "/api/v1/staff/stock-requests",
    payload
  );
  return response.data;
};

export const getStockRequestById = async (id: string): Promise<StockRequest> => {
  const response = await api.get<StockRequest>(`/api/v1/staff/stock-requests/${id}`);
  return response.data;
};

/**
 * 🟩 Lấy danh sách các yêu cầu nhập kho của chính nhân viên
 */
export const getMyStockRequests = async (): Promise<StockRequest[]> => {
  const response = await api.get<StockRequest[]>(`/api/v1/staff/stock-requests/mine`);
  return response.data;
};
