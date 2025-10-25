import axios from '../../configs/axios';

export interface SlotReservation {
    id: string;
    reservationId: string;
    stationId: string;
    stationName: string;
    batteryModelId: string;
    batteryModelName: string;
    status: 'Pending' | 'CheckedIn' | 'Completed' | 'Cancelled' | 'Expired';
    slotDate: string; 
    slotStartTime: string; 
    slotEndTime: string;
    qrCode: string;
    checkInWindow: {
        earliestTime: string;
        latestTime: string;
    };
}

export interface CheckInRequest {
    qrCodeData: string;
}

export interface CheckInResponse {
    reservationId: string;
    status: string;
    checkedInAt: string;
    assignedBattery: {
        batteryId: string;
        serial: string;
    };
}

export interface CancelReservationRequest {
    reason: 0 | 1 | 2 | 3; // 0: UserCancelled, 1: NoShow, 2: SystemError, 3: Other
    note?: string;
}

export interface SwapTransaction {
    id: string;
    transactionNumber: string;
    status: 'CheckedIn' | 'BatteryIssued' | 'BatteryReturned' | 'Completed' | 'Cancelled';
    userEmail: string;
    stationName: string;
    stationAddress: string;
    vehicleLicensePlate: string;
    vehicleModel: string;
    vehicleOdoAtSwap?: number;
    issuedBatterySerial?: string;
    returnedBatterySerial?: string;
    batteryHealthIssued?: number;
    batteryHealthReturned?: number;
    paymentType: string;
    swapFee: number;
    kmChargeAmount: number;
    totalAmount: number;
    isPaid: boolean;
    startedAt: string;
    checkedInAt?: string;
    batteryIssuedAt?: string;
    batteryReturnedAt?: string;
    completedAt?: string;
    notes?: string;
    reservationId?: string;
    userSubscriptionId?: string;
    rating?: number;
    feedback?: string;
    ratedAt?: string;
}

export interface SwapHistoryResponse {
    transactions: SwapTransaction[];
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// Get slot reservations (queue at station)
export const getSlotReservations = async (
    date?: string,
    stationId?: string,
    status?: string,
    userId?: string
): Promise<SlotReservation[]> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (stationId) params.append('stationId', stationId);
    if (status) params.append('status', status);
    if (userId) params.append('userId', userId);

    const url = `/api/v1/slot-reservations?${params.toString()}`;
    console.log('getSlotReservations: Calling API with URL:', url);
    console.log('getSlotReservations: Parameters:', { date, stationId, status, userId });

    const response = await axios.get(url);
    console.log('getSlotReservations: Response:', response.data);
    return response.data;
};

// Get reservation detail by ID
export const getReservationById = async (id: string): Promise<SlotReservation> => {
    const response = await axios.get(`/api/v1/slot-reservations/${id}`);
    return response.data;
};

// Check-in customer at station (scan QR)
export const checkInReservation = async (
    id: string,
    request: CheckInRequest
): Promise<CheckInResponse> => {
    const response = await axios.post(`/api/v1/slot-reservations/${id}/check-in`, request);
    return response.data;
};

// Cancel reservation
export const cancelReservation = async (
    id: string,
    request: CancelReservationRequest
): Promise<void> => {
    await axios.delete(`/api/v1/slot-reservations/${id}`, { data: request });
};

// Get current swap transaction at station
export const getCurrentSwap = async (): Promise<SwapTransaction | null> => {
    const response = await axios.get('/api/v1/swaps/current');
    return response.data;
};

// Get swap history at station
export const getSwapHistory = async (
    page: number = 1,
    pageSize: number = 10
): Promise<SwapHistoryResponse> => {
    const response = await axios.get(`/api/v1/swaps/history?page=${page}&pageSize=${pageSize}`);
    return response.data;
};
