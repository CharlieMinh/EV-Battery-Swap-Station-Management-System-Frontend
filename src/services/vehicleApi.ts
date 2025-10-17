import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5194";

export interface VehicleModel {
    id: string;
    name: string;
    fullName: string;
    brand: string;
    compatibleBatteryModelId: string;
    compatibleBatteryModelName: string;
    imageUrl?: string;
    isActive: boolean;
    description?: string;
}

export interface Vehicle {
    id: string;
    vin: string;
    plate: string;
    vehicleModelId?: string;
    vehicleModelName?: string;
    vehicleModelFullName?: string;
    brand?: string;
    compatibleBatteryModelId: string;
    compatibleBatteryModelName: string;
    photoUrl?: string;
    registrationPhotoUrl?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateVehicleRequest {
    vin: string;
    plate: string;
    vehicleModelId: string;
    photoUrl: string;
    registrationPhotoUrl: string;
}

export interface UpdateVehicleRequest {
    plate?: string;
    photoUrl?: string;
    registrationPhotoUrl?: string;
}

export interface ScanResult {
    vin?: string;
    plate?: string;
    brand?: string;
    vehicleModel?: string;
    confidence: number;
    rawData?: Record<string, string>;
    errorMessage?: string;
}

// API Functions

/**
 * Lấy danh sách xe của user hiện tại
 */
export const getMyVehicles = async (): Promise<Vehicle[]> => {
    const response = await axios.get<Vehicle[]>(`${API_BASE_URL}/api/v1/vehicles`, {
        withCredentials: true,
    });
    return response.data;
};

/**
 * Lấy chi tiết 1 xe
 */
export const getVehicleById = async (id: string): Promise<Vehicle> => {
    const response = await axios.get<Vehicle>(`${API_BASE_URL}/api/v1/vehicles/${id}`, {
        withCredentials: true,
    });
    return response.data;
};

/**
 * Tạo xe mới
 */
export const createVehicle = async (data: CreateVehicleRequest): Promise<Vehicle> => {
    const response = await axios.post<Vehicle>(`${API_BASE_URL}/api/v1/vehicles`, data, {
        withCredentials: true,
    });
    return response.data;
};

/**
 * Cập nhật xe
 */
export const updateVehicle = async (id: string, data: UpdateVehicleRequest): Promise<Vehicle> => {
    const response = await axios.put<Vehicle>(`${API_BASE_URL}/api/v1/vehicles/${id}`, data, {
        withCredentials: true,
    });
    return response.data;
};

/**
 * Xóa xe
 */
export const deleteVehicle = async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/vehicles/${id}`, {
        withCredentials: true,
    });
};

/**
 * Lấy danh sách vehicle models
 */
export const getVehicleModels = async (isActive?: boolean): Promise<VehicleModel[]> => {
    const response = await axios.get<VehicleModel[]>(`${API_BASE_URL}/api/v1/vehicle-models`, {
        params: { isActive },
        withCredentials: true,
    });
    return response.data;
};

/**
 * Quét ảnh đăng ký xe (cà vẹt) để tự động trích xuất thông tin
 */
export const scanVehicleRegistration = async (imageFile: File): Promise<ScanResult> => {
    const formData = new FormData();
    formData.append("imageFile", imageFile);

    const response = await axios.post<ScanResult>(
        `${API_BASE_URL}/api/v1/vehicles/scan-registration`,
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
        }
    );
    return response.data;
};

/**
 * Quét ảnh đăng ký xe từ URL
 */
export const scanVehicleRegistrationFromUrl = async (imageUrl: string): Promise<ScanResult> => {
    const response = await axios.post<ScanResult>(
        `${API_BASE_URL}/api/v1/vehicles/scan-registration-url`,
        { imageUrl },
        {
            withCredentials: true,
        }
    );
    return response.data;
};

/**
 * Tìm VehicleModelId từ Brand + Model name
 * @param brand Tên hãng xe (VinFast, Toyota, Honda, etc.)
 * @param modelName Tên model xe (VF3, VF5, VF8, etc.)
 * @param models Danh sách vehicle models
 * @returns VehicleModelId nếu tìm thấy, null nếu không
 */
export const findVehicleModelId = (
    brand: string,
    modelName: string,
    models: VehicleModel[]
): string | null => {
    // Match by brand and model name (case-insensitive, fuzzy match)
    const matched = models.find((m) => {
        const brandMatch = m.brand?.toLowerCase() === brand?.toLowerCase();
        const modelMatch =
            m.name?.toLowerCase().includes(modelName?.toLowerCase()) ||
            modelName?.toLowerCase().includes(m.name?.toLowerCase()) ||
            m.fullName?.toLowerCase().includes(modelName?.toLowerCase());
        return brandMatch && modelMatch;
    });

    return matched?.id || null;
};

