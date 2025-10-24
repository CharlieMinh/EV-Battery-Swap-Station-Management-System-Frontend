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
