import api from "@/configs/axios";
import { data } from "react-router-dom";

export interface Customer {
    id: String;
    email: String;
    name: String;
    PhoneNumber: String;
    createdAt: Date;
    lastLogin: Date;
    totalReservations: Number;
    completedReservations: Number;
}

export interface CustomerDetail extends Customer {
    role: String;
    cancelledReservations: Number;
    totalVehicles: Number;
}

export async function fetchCustomers(  page: number,
  pageSize: number
) {
    try {
        const response = await api.get(`/v1/Users/customers?page=${page}&pageSize=${pageSize}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
}

export async function fetchCustomerById(id: String) {
    try {
        const response = await api.get(`/v1/Users/${id}`);
        const customer = response.data;
        return customer as CustomerDetail;
    } catch (error) {
        console.error('Error fetching customer by ID:', error);
        throw error;
    }
}
