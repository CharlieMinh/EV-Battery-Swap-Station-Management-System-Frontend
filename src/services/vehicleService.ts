import api from "../configs/axios";

export interface VehicleRegistrationScanResult {
    vin?: string;
    plate?: string;
    brand?: string;
    vehicleModel?: string;
    confidence: number;
    rawData: Record<string, string>;
    errorMessage?: string;
}

export interface ScanRegistrationUrlRequest {
    imageUrl: string;
}

export interface CreateVehicleRequest {
    vin: string;
    plate: string;
    vehicleModelId: string;
    photo: File;
    registrationPhoto: File;
}

export interface CreateVehicleWithUrlRequest {
    vin: string;
    plate: string;
    vehicleModelId: string;
    photoUrl: string;
    registrationPhotoUrl: string;
}

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
    vehicleModelId: string;
    vehicleModelName?: string;
    vehicleModelFullName?: string;
    vehicleModelBrand?: string;
    compatibleBatteryModelId: string;
    compatibleBatteryModelName: string;
    photoUrl?: string;
    registrationPhotoUrl?: string;
    createdAt: string;
    updatedAt?: string;
}

class VehicleService {
    /**
     * Scan vehicle registration image using AWS Rekognition
     */
    async scanRegistration(imageFile: File): Promise<VehicleRegistrationScanResult> {
        const formData = new FormData();
        formData.append('imageFile', imageFile);

        const response = await api.post('/api/v1/vehicles/scan-registration', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    }

    /**
     * Scan vehicle registration image from URL using AWS Rekognition
     */
    async scanRegistrationFromUrl(imageUrl: string): Promise<VehicleRegistrationScanResult> {
        const response = await api.post('/api/v1/vehicles/scan-registration-url', {
            imageUrl
        });

        return response.data;
    }

    /**
     * Get all vehicle models
     */
    async getVehicleModels(isActive?: boolean): Promise<VehicleModel[]> {
        const params = isActive !== undefined ? { isActive } : {};
        const response = await api.get('/api/v1/vehicle-models', { params });
        return response.data;
    }

    /**
     * Get user's vehicles
     */
    async getMyVehicles(): Promise<Vehicle[]> {
        const response = await api.get('/api/v1/vehicles');
        return response.data;
    }

    /**
     * Get vehicle by ID
     */
    async getVehicleById(id: string): Promise<Vehicle> {
        const response = await api.get(`/api/v1/vehicles/${id}`);
        return response.data;
    }

    /**
     * Create new vehicle with file upload
     */
    async createVehicle(data: CreateVehicleRequest): Promise<Vehicle> {
        const formData = new FormData();
        formData.append('Vin', data.vin);
        formData.append('Plate', data.plate);
        formData.append('VehicleModelId', data.vehicleModelId);
        formData.append('Photo', data.photo);
        formData.append('RegistrationPhoto', data.registrationPhoto);

        try {
            const response = await api.post('/api/v1/vehicles', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Vehicle creation error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            throw error;
        }
    }

    /**
     * Create new vehicle with URL
     */
    async createVehicleWithUrl(data: CreateVehicleWithUrlRequest): Promise<Vehicle> {
        const response = await api.post('/api/v1/vehicles/with-url', data);
        return response.data;
    }

    /**
     * Update vehicle
     */
    async updateVehicle(id: string, data: Partial<CreateVehicleWithUrlRequest>): Promise<Vehicle> {
        const response = await api.put(`/api/v1/vehicles/${id}`, data);
        return response.data;
    }

    /**
     * Delete vehicle
     */
    async deleteVehicle(id: string): Promise<void> {
        await api.delete(`/api/v1/vehicles/${id}`);
    }
}

export const vehicleService = new VehicleService();
