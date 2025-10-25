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

export async function fetchAllBatteries(): Promise<Battery[]> {
  try {
    const response = await api.get("/api/BatteryUnits"); 
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
    const res = await api.post("/api/BatteryUnits/bulk-create", payload, {withCredentials: true})
    
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
