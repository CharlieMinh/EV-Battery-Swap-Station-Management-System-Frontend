import api from "@/configs/axios";

export interface Staff {
    id: string;
    email: string;
    name: string;
    phoneNumber: string | null;
    role: string;
    status: string;
    createdAt: Date;
    lastLogin: Date;
    stationName: string
    stationId: string,
}

export interface StaffDetails extends Staff {
    totalReservationsVerified: number;
    totalSwapTransactions: number;
    recentReservationsVerified: number;
    recentSwapTransactions: number;
    profilePicture: string
}

export async function fetchStaffList(page: number, pageSize: number) {
    try {
        const response = await api.get(`/api/v1/Users/staff?page=${page}&pageSize=${pageSize}`);
        console.log(" API response:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching staff list:', error);
        throw error;
    }
}

export async function fetchStaffById(id: string) {
    try {
        const response = await api.get(`/api/v1/Users/staff/${id}`);
        const staff = response.data;
        return staff as StaffDetails;
    } catch (error) {
        console.error('Error fetching staff by ID:', error);
        throw error;
    }
}