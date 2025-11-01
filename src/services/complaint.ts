import api from "@/configs/axios";

export interface BatteryComplaintResponse {
  id: string;
  swapTransactionId: string | null;
  issuedBatteryId: string | null;
  reportedByUserId: string;
  status: string;
  complaintDetails: string;
  reportDate: string; // ISO date string
  handledByStaffId: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  issuedBatterySerial?: string | null;
  stationName?: string | null;
}

export interface GetComplaintsResponse {
  page: number;
  pageSize: number;
  items: BatteryComplaintResponse[];
}

export async function fetchAllComplaints(page: number, pageSize:number) {
    try {
        const response = await api.get(`/api/BatteryComplaints?page=${page}&pageSize=${pageSize}`, {withCredentials:true })
        return response.data;
    } catch (error) {
        console.error("Error fetching data: ", error)
        throw error
    }
}

export async function fetchComplaintById(id: string, page: number, pageSize: number){
    try {
        const response = await api.get(`/api/BatteryComplaints/${id}?page=${page}&pageSize=${pageSize}`, {withCredentials: true})
        return response.data
    } catch (error) {
        console.error("Error fetching data by Id: ", error)
        throw error
    }
}