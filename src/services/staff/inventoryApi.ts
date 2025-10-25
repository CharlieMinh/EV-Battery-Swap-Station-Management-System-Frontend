import axios from '../../configs/axios';

// ==================== ENUMS ====================

export enum BatteryStatus {
    Full = 0,
    Charging = 1,
    Maintenance = 2,
    Issued = 3
}

// Map enum to Vietnamese labels
export const BatteryStatusLabels: Record<BatteryStatus, string> = {
    [BatteryStatus.Full]: 'Đầy',
    [BatteryStatus.Charging]: 'Đang sạc',
    [BatteryStatus.Maintenance]: 'Bảo trì',
    [BatteryStatus.Issued]: 'Đang sử dụng'
};

// Map enum to color classes
export const BatteryStatusColors: Record<BatteryStatus, string> = {
    [BatteryStatus.Full]: 'bg-green-100 text-green-800',
    [BatteryStatus.Charging]: 'bg-blue-100 text-blue-800',
    [BatteryStatus.Maintenance]: 'bg-yellow-100 text-yellow-800',
    [BatteryStatus.Issued]: 'bg-purple-100 text-purple-800'
};

// ==================== REQUEST TYPES ====================

export interface AddStockRequest {
    batteryModelId: string;
    stationId: string;
    status: BatteryStatus;
    quantity: number;
    serialPrefix?: string;
}

export interface RemoveStockRequest {
    batteryModelId: string;
    stationId: string;
    status: BatteryStatus;
    quantity: number;
    reason?: string;
}

export interface ChangeStatusRequest {
    batteryModelId: string;
    stationId: string;
    fromStatus: BatteryStatus;
    toStatus: BatteryStatus;
    quantity: number;
}

// ==================== RESPONSE TYPES ====================

export interface InventoryByModel {
    batteryModelId: string;
    modelName: string;
    totalQuantity: number;
    fullQuantity: number;
    chargingQuantity: number;
    maintenanceQuantity: number;
    issuedQuantity: number;
    lastUpdated: string;
}

export interface InventorySummaryResponse {
    stationId: string;
    stationName: string;
    inventoryByModel: InventoryByModel[];
    generatedAt: string;
}

export interface InventoryDetailResponse {
    id: string;
    batteryModelId: string;
    modelName: string;
    stationId: string;
    stationName: string;
    status: BatteryStatus;
    quantity: number;
    updatedAt: string;
}

export interface AvailableBatteriesResponse {
    stationId: string;
    stationName: string;
    availableNow: number;
    chargingSoon: number;
    totalAvailable: number;
    batteryModels: {
        modelId: string;
        modelName: string;
        fullQuantity: number;
        chargingQuantity: number;
        availableForSwap: number;
    }[];
    recommendedSlots: string;
    lastUpdated: string;
}

export interface Station {
    id: string;
    name: string;
    address: string;
    city: string;
    isActive: boolean;
}

export interface StationsResponse {
    items: Station[];
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

export interface BatteryModel {
    id: string;
    name: string;
    voltage: number;
    capacity: number;
    manufacturer: string;
    warrantyMonths: number;
    pricePerKwh: number;
}

// ==================== API FUNCTIONS ====================

/**
 * Get available batteries at station (for reservation flow)
 * PUBLIC endpoint - accessible to all users
 */
export const getAvailableBatteries = async (
    stationId: string,
    batteryModelId?: string
): Promise<AvailableBatteriesResponse> => {
    const params = new URLSearchParams();
    if (batteryModelId) params.append('batteryModelId', batteryModelId);

    const url = `/api/inventory/available/station/${stationId}${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('getAvailableBatteries: Calling API with URL:', url);

    const response = await axios.get(url);
    console.log('getAvailableBatteries: Response:', response.data);
    return response.data.data;
};

/**
 * Get inventory summary for a station
 * Shows breakdown by battery model with status counts
 */
export const getInventorySummary = async (stationId: string): Promise<InventorySummaryResponse> => {
    const response = await axios.get(`/api/inventory/summary/station/${stationId}`);
    return response.data.data;
};

/**
 * Get all inventory details (Admin only)
 */
export const getAllInventory = async (): Promise<InventoryDetailResponse[]> => {
    const response = await axios.get('/api/inventory/all');
    return response.data.data;
};

/**
 * Add battery stock in bulk (Admin/Staff only)
 */
export const addStock = async (request: AddStockRequest): Promise<{ quantityAdded: number }> => {
    const response = await axios.post('/api/inventory/add-stock', request);
    return response.data.data;
};

/**
 * Remove battery stock in bulk (Admin/Staff only)
 */
export const removeStock = async (request: RemoveStockRequest): Promise<{ quantityRemoved: number }> => {
    const response = await axios.post('/api/inventory/remove-stock', request);
    return response.data.data;
};

/**
 * Change battery status in bulk (Admin/Staff only)
 */
export const changeStatus = async (request: ChangeStatusRequest): Promise<{ quantityChanged: number }> => {
    const response = await axios.post('/api/inventory/change-status', request);
    return response.data.data;
};

/**
 * Get all stations (for dropdown)
 */
export const getStations = async (page: number = 1, pageSize: number = 100): Promise<StationsResponse> => {
    try {
        console.log('getStations: Calling API...');
        const response = await axios.get(`/api/v1/Stations?page=${page}&pageSize=${pageSize}`);
        console.log('getStations: Raw response:', response.data);

        // Backend returns wrapped response: { items: [...], currentPage, pageSize, totalCount, totalPages }
        if (response.data && response.data.items && Array.isArray(response.data.items)) {
            return response.data;
        }

        // Fallback: if direct array
        if (Array.isArray(response.data)) {
            return {
                items: response.data,
                currentPage: page,
                pageSize: pageSize,
                totalCount: response.data.length,
                totalPages: 1
            };
        }

        // Fallback: if nested in data property
        if (response.data.data && Array.isArray(response.data.data.items)) {
            return response.data.data;
        }

        console.error('Unexpected stations response format:', response.data);
        throw new Error('Invalid response format from stations API');
    } catch (error) {
        console.error('getStations error:', error);
        throw error;
    }
};

/**
 * Get all battery models (for dropdown)
 */
export const getBatteryModels = async (): Promise<BatteryModel[]> => {
    try {
        console.log('getBatteryModels: Calling API...');
        const response = await axios.get('/api/BatteryModels');
        console.log('getBatteryModels: Raw response:', response.data);

        // Response is a direct array of battery models
        if (Array.isArray(response.data)) {
            return response.data;
        }

        // Handle if wrapped in data property
        if (response.data.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }

        // Handle if wrapped in items property
        if (response.data.items && Array.isArray(response.data.items)) {
            return response.data.items;
        }

        console.error('Unexpected battery models response format:', response.data);
        throw new Error('Invalid response format from battery models API');
    } catch (error) {
        console.error('getBatteryModels error:', error);
        throw error;
    }
};
