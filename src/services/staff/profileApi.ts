import api from '../../configs/axios';

// Types
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    avatar?: string;
    role: string;
    stationId?: string;
}

export interface UpdateProfileRequest {
    name?: string;
    phoneNumber?: string;
    email?: string;
    avatar?: string;
}

export interface StationInfo {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    totalSlots: number;
    availableSlots: number;
    operatingHours: {
        open: string;
        close: string;
    };
    phoneNumber?: string;
    status: string;
}

// API Functions
export const getMyProfile = async (): Promise<UserProfile> => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
};

export const updateProfile = async (userId: string, data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put(`/api/v1/users/${userId}`, data);
    return response.data;
};

export const getStationInfo = async (stationId: string): Promise<StationInfo> => {
    const response = await api.get(`/api/v1/stations/${stationId}`);
    return response.data;
};

export default {
    getMyProfile,
    updateProfile,
    getStationInfo,
};
