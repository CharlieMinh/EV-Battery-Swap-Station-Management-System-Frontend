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
}

export interface UpdateUserPayload {
    name?: string;
    phoneNumber?: string;
    role: string;
    status: string;
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
        // Thử các format khác
        const wrappedPayload = {
            name: payload.name,
            phoneNumber: payload.phoneNumber,
            role: parseInt(payload.role),
            status: parseInt(payload.status) // Có thể backend cần số thay vì string
        };

        const response = await api.put(`/api/v1/Users/${id}`, wrappedPayload, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating user:', error);
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

