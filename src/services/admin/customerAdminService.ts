import api from "@/configs/axios";
import { ca } from "date-fns/locale";
import { data } from "react-router-dom";

export interface Customer {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
    status: string;
    createdAt: Date;
    lastLogin: Date;
    totalReservations: number;
    completedReservations: number;
}

export interface CustomerDetail extends Customer {
    role: string;
    cancelledReservations: number;
    totalVehicles: number;
    profilePicture: string,
}

export interface UpdateUserPayload {
    name?: string;
    phoneNumber?: string;
    role: string;
    profilePicture?: string,
    status: string;
    stationId?: string
}

export async function fetchCustomers(  page: number,
  pageSize: number
) {
    try {
        const response = await api.get(`/api/v1/Users/customers?page=${page}&pageSize=${pageSize}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
}

export async function fetchCustomerById(id: string) {
    try {
        const response = await api.get(`/api/v1/Users/${id}`);
        const customer = response.data;
        return customer as CustomerDetail;
    } catch (error) {
        console.error('Error fetching customer by ID:', error);
        throw error;
    }
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  try {
    const formData = new FormData();

    // Duyệt tất cả field trong payload
    Object.entries(payload).forEach(([key, value]) => {
      // ❌ Bỏ qua stationId nếu không có (hoặc các field rỗng)
      if (value === undefined || value === null || value === "") return;

      // Convert số sang chuỗi vì FormData chỉ nhận string hoặc Blob
      if (typeof value === "number") formData.append(key, value.toString());
      else formData.append(key, value as any);
    });

    // ép role & status sang chuỗi
    formData.set("role", parseInt(payload.role).toString());
    formData.set("status", parseInt(payload.status).toString());

    const response = await api.put(`/api/v1/Users/${id}`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}


export async function fetchTotalCustomers(  page: number,
  pageSize: number
) {
    try {
        const response = await api.get(`/api/v1/Users/customers?page=${page}&pageSize=${pageSize}`);
        const { totalItems = 0 } = response.data;
        console.log("API send: ", response.data)
        return totalItems;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
}

