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

    if (payload.name) formData.append("Name", payload.name);
    if (payload.phoneNumber) formData.append("PhoneNumber", payload.phoneNumber);

    // ⚠️ Gửi URL Cloudinary vào đúng field backend đang nhận (ProfilePicture)
    if (payload.profilePicture) formData.append("ProfilePicture", payload.profilePicture);

    if (payload.role !== undefined && payload.role !== null && payload.role !== "") {
      const roleNumber = Number(payload.role);
      if (!isNaN(roleNumber)) {
        formData.append("Role", roleNumber.toString());
      }
    }

    if (payload.status !== undefined && payload.status !== null && payload.status !== "") {
      const statusNumber = Number(payload.status);
      if (!isNaN(statusNumber)) {
        formData.append("Status", statusNumber.toString());
      }
    }

    if (payload.stationId) formData.append("StationId", payload.stationId);

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

