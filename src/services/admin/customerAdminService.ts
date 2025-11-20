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
      profilePicture?: string | File,
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

    // Gửi file hoặc URL vào field ProfilePicture
    if (payload.profilePicture) {
      if (payload.profilePicture instanceof File) {
        // Gửi File object trực tiếp
        formData.append("ProfilePicture", payload.profilePicture);
      } else if (typeof payload.profilePicture === "string") {
        // Gửi URL string (nếu cần)
        formData.append("ProfilePicture", payload.profilePicture);
      }
    }

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

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const response = await api.post(`/api/v1/Users/change-password`, payload);
    return response.data;
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
}

export interface SubscriptionInfo {
  id: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isBlocked: boolean;
  vehicleId: string;
  currentMonthSwapCount: number;
  swapsLimit: number | null;
  subscriptionPlan: {
    name: string;
    batteryModelId?: string;
    maxSwapsPerMonth?: number;
  };
  vehicle: {
    id: string;
    plate: string;
    model: string;
  } | null;
}

/**
 * Get vehicles by user ID (for admin)
 * Note: Backend may not have a dedicated endpoint for this.
 * This function tries multiple possible endpoints.
 */
export async function getVehiclesByUserId(userId: string) {
  // First, check if the user detail endpoint includes vehicles
  try {
    const userResponse = await api.get(`/api/v1/Users/${userId}`);
    if (userResponse.data?.vehicles && Array.isArray(userResponse.data.vehicles)) {
      return userResponse.data.vehicles;
    }
  } catch (error) {
    console.log('User endpoint does not include vehicles, trying other endpoints...');
  }

  // Try various endpoint patterns
  const endpoints = [
    `/api/v1/vehicles?userId=${userId}`,
    `/api/v1/Users/${userId}/vehicles`,
    `/api/v1/admin/users/${userId}/vehicles`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || response.data?.items || []);
      if (data.length > 0 || endpoint === endpoints[endpoints.length - 1]) {
        return data;
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error(`Error fetching vehicles from ${endpoint}:`, error);
      }
      continue;
    }
  }

  // If all endpoints fail, return empty array
  console.warn(`No vehicles endpoint found for userId: ${userId}`);
  return [];
}

/**
 * Get subscriptions by user ID (for admin)
 * Note: Backend may not have a dedicated endpoint for this.
 * This function tries multiple possible endpoints.
 */
export async function getSubscriptionsByUserId(userId: string): Promise<SubscriptionInfo[]> {
  // First, check if the user detail endpoint includes subscriptions
  try {
    const userResponse = await api.get(`/api/v1/Users/${userId}`);
    if (userResponse.data?.subscriptions && Array.isArray(userResponse.data.subscriptions)) {
      return userResponse.data.subscriptions;
    }
  } catch (error) {
    console.log('User endpoint does not include subscriptions, trying other endpoints...');
  }

  // Try various endpoint patterns
  const endpoints = [
    `/api/v1/subscriptions?userId=${userId}`,
    `/api/v1/Users/${userId}/subscriptions`,
    `/api/v1/subscriptions/user/${userId}/all`,
    `/api/v1/admin/users/${userId}/subscriptions`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.data || response.data?.items || []);
      if (data.length > 0 || endpoint === endpoints[endpoints.length - 1]) {
        return data;
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error(`Error fetching subscriptions from ${endpoint}:`, error);
      }
      continue;
    }
  }

  // If all endpoints fail, return empty array
  console.warn(`No subscriptions endpoint found for userId: ${userId}`);
  return [];
}

