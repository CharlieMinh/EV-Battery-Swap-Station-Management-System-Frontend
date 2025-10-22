import api from '../configs/axios';

export interface SubscriptionRequest {
  subscriptionPlanId: string;
  vehicleId: string;
  startDate: string;
  notes?: string;
}

export interface SubscriptionResponse {
  id: string;
  subscriptionPlanId: string;
  vehicleId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isBlocked: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VNPayCreateRequest {
  invoiceId: string;
  orderInfo: string;
  ipAddress: string;
}

export interface VNPayCreateResponse {
  paymentUrl: string;
  transactionId: string;
}

export interface VNPayCallbackParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  plateNumber?: string; // Alternative field name
  model: string;
  brand: string;
  batteryModel?: {
    id: string;
    name: string;
    voltage: number;
    capacityWh: number;
  };
  batteryType?: string; // Alternative field name
  batteryCapacity?: number; // Alternative field name
  isActive: boolean;
  status?: string; // Alternative field name
  createdAt: string;
  updatedAt: string;
}

// Tạo subscription mới
export const createSubscription = async (subscriptionData: SubscriptionRequest): Promise<SubscriptionResponse> => {
  try {
    const response = await api.post('/api/v1/subscriptions', subscriptionData);
    return response.data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// Lấy danh sách xe của user
export const getUserVehicles = async (): Promise<Vehicle[]> => {
  try {
    console.log('Đang gọi API để lấy danh sách xe...');
    const response = await api.get('/api/v1/Vehicles');
    console.log('Phản hồi API Vehicles:', response.data);
    
    // Xử lý các định dạng response khác nhau
    let vehicles: Vehicle[] = [];
    
    if (Array.isArray(response.data)) {
      vehicles = response.data;
    } else if (response.data?.items) {
      vehicles = response.data.items;
    } else if (response.data?.data) {
      vehicles = response.data.data;
    } else if (response.data?.vehicles) {
      vehicles = response.data.vehicles;
    } else {
      console.warn('Định dạng response không mong đợi:', response.data);
      vehicles = [];
    }
    
    // Chuẩn hóa dữ liệu xe
    const normalizedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      licensePlate: vehicle.licensePlate || vehicle.plateNumber || 'N/A',
      brand: vehicle.brand || 'Unknown',
      model: vehicle.model || 'Unknown',
      batteryModel: vehicle.batteryModel || (vehicle.batteryType ? {
        id: 'battery-' + vehicle.id,
        name: vehicle.batteryType,
        voltage: 400, // Default voltage
        capacityWh: vehicle.batteryCapacity || 50000
      } : undefined),
      isActive: vehicle.isActive !== undefined ? vehicle.isActive : (vehicle.status === 'active')
    }));
    
    console.log('Danh sách xe đã chuẩn hóa:', normalizedVehicles);
    return normalizedVehicles;
  } catch (error) {
    console.error('Error fetching user vehicles:', error);
    
    // Fallback data nếu API không hoạt động
    console.log('Sử dụng dữ liệu fallback cho vehicles...');
    return [
      {
        id: 'fallback-vehicle-1',
        licensePlate: '30A-12345',
        model: 'VF8',
        brand: 'VinFast',
        batteryModel: {
          id: 'battery-1',
          name: 'Lithium-ion 90kWh',
          voltage: 400,
          capacityWh: 90000
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'fallback-vehicle-2',
        licensePlate: '51G-67890',
        model: 'VF9',
        brand: 'VinFast',
        batteryModel: {
          id: 'battery-2',
          name: 'Lithium-ion 120kWh',
          voltage: 400,
          capacityWh: 120000
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
};

// Tạo payment URL với VNPay
export const createVNPayPayment = async (paymentData: VNPayCreateRequest): Promise<VNPayCreateResponse> => {
  try {
    const response = await api.post('/api/v1/payments/vnpay/create', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    throw error;
  }
};

// Xử lý callback từ VNPay
export const handleVNPayCallback = async (callbackParams: VNPayCallbackParams): Promise<any> => {
  try {
    const response = await api.get('/api/v1/payments/vnpay/callback', {
      params: callbackParams
    });
    return response.data;
  } catch (error) {
    console.error('Error handling VNPay callback:', error);
    throw error;
  }
};

// Xử lý return từ VNPay
export const handleVNPayReturn = async (returnParams: VNPayCallbackParams): Promise<any> => {
  try {
    const response = await api.get('/api/v1/payments/vnpay/return', {
      params: returnParams
    });
    return response.data;
  } catch (error) {
    console.error('Error handling VNPay return:', error);
    throw error;
  }
};
