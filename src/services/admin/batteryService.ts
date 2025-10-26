import api from "@/configs/axios";
import axios from "axios";

export interface Battery {
  id: string;
  serial: string;
  batteryModelId: string;
  batteryModelName: string;
  voltage: number;
  capacityWh: number;
  manufacturer: string;
  stationId: string;
  stationName: string;
  status: string;
  isReserved: boolean;
  updatedAt: string;
}

export interface AddBatteryPayload {
  stationId: string;
  batteryModelId: string;
  quantity: number;
}

export interface BatteryModel {
  id: string,
  name: string,
  voltage: number,
  capacityWh: number,
  swapPricePerSession: number,
}

export interface BatteryRequest {
  id: string;
  stationId: string;
  stationName: string;
  batteryModelId: string;
  batteryModelName: string;
  quantity: number;
  status: number; // 0: Pending, 1: Confirmed, 2: Rejected
  requestedByAdminId: string;
  requestedByAdminName: string;
  handledByStaffId: string | null;
  handledByStaffName: string | null;
  staffNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmRejectPayload {
  notes: string;
}

export async function fetchAllBatteries(): Promise<Battery[]> {
  try {
    const response = await api.get("/api/BatteryUnits"); // ⚙️ Đổi URL thật của bạn
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching batteries:", error);
    throw error;
  }
}

export async function addBatteryToStation(payload: AddBatteryPayload) {
  try {
    const res = await api.post("/api/bulk-create-requests/request", payload, {withCredentials: true})
    
    return res.data
  }catch (error) {
    console.error("Error post data: ", error);
    throw error;
  }
}

export async function fetchModelBattery(): Promise<BatteryModel[]> {
  try {
    const response = await api.get("/api/BatteryModels");
    return response.data;
  } catch (error) {
    console.error("Error fetching data: ", error)
    throw error
  }
}

export async function fetchBatteryRequests(): Promise<BatteryRequest[]> {
  try {
    const response = await api.get("/api/bulk-create-requests");
    const data = response.data;
    const sortedData = [...data].sort((a, b) => a.quantity - b.quantity);
    return sortedData;
  } catch (error) {
    console.error("Error fetching battery requests:", error);
    throw error;
  }
}

/**
 * Xác nhận một battery request
 */
export async function confirmBatteryRequest(
  id: string,
  payload: ConfirmRejectPayload
): Promise<any> {
  try {
    const response = await api.post(
      `/api/bulk-create-requests/${id}/confirm`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Error confirming battery request ${id}:`, error);
    throw error;
  }
}

/**
 * Từ chối một battery request
 */
export async function rejectBatteryRequest(
  id: string,
  payload: ConfirmRejectPayload
): Promise<any> {
  try {
    const response = await api.post(
      `/api/bulk-create-requests/${id}/reject`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error(`Error rejecting battery request ${id}:`, error);
    throw error;
  }
}

/**
 * Xác nhận nhiều battery requests cùng lúc
 */
export async function confirmMultipleBatteryRequests(
  ids: string[],
  notes: string
): Promise<void> {
  try {
    const confirmPromises = ids.map((id) =>
      confirmBatteryRequest(id, { notes })
    );
    await Promise.all(confirmPromises);
  } catch (error) {
    console.error("Error confirming multiple battery requests:", error);
    throw error;
  }
}

/**
 * Từ chối nhiều battery requests cùng lúc
 */
export async function rejectMultipleBatteryRequests(
  ids: string[],
  notes: string
): Promise<void> {
  try {
    const rejectPromises = ids.map((id) =>
      rejectBatteryRequest(id, { notes })
    );
    await Promise.all(rejectPromises);
  } catch (error) {
    console.error("Error rejecting multiple battery requests:", error);
    throw error;
  }
}
