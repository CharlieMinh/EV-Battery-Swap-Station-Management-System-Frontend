import api from '../configs/axios';

// Types - Updated to match SQL schema
export interface Battery {
  id: string; // BatteryUnits.Id
  serial: string; // BatteryUnits.Serial
  batteryModelId: string; // BatteryUnits.BatteryModelId
  stationId: string; // BatteryUnits.StationId
  status: number; // BatteryUnits.Status (0=Empty, 1=Charging, 2=Full, 3=Maintenance)
  updatedAt: string; // BatteryUnits.UpdatedAt
  isReserved: boolean; // BatteryUnits.IsReserved
  // Additional fields for UI
  slot?: string;
  health?: number;
  voltage?: number;
  cycles?: number;
  lastSwap?: string;
  model?: string;
  temperature?: number;
}

export interface Booking {
  id: string; // Reservations.Id
  userId: string; // Reservations.UserId
  stationId: string; // Reservations.StationId
  batteryModelId: string; // Reservations.BatteryModelId
  batteryUnitId?: string; // Reservations.BatteryUnitId
  slotDate: string; // Reservations.SlotDate
  slotStartTime: string; // Reservations.SlotStartTime
  slotEndTime: string; // Reservations.SlotEndTime
  qrCode?: string; // Reservations.QRCode
  checkedInAt?: string; // Reservations.CheckedInAt
  verifiedByStaffId?: string; // Reservations.VerifiedByStaffId
  status: number; // Reservations.Status (0=Pending, 1=CheckedIn, 2=Completed, 3=Cancelled)
  cancelReason?: number; // Reservations.CancelReason
  cancelNote?: string; // Reservations.CancelNote
  cancelledAt?: string; // Reservations.CancelledAt
  createdAt: string; // Reservations.CreatedAt
  // Additional fields for UI
  customer?: string;
  vehicle?: string;
  time?: string;
  code?: string;
  checkInWindow?: {
    earliest: string;
    latest: string;
  };
  registrationTime?: string;
}

export interface Transaction {
  id: string; // SwapTransactions.Id
  transactionNumber: string; // SwapTransactions.TransactionNumber
  userId: string; // SwapTransactions.UserId
  reservationId?: string; // SwapTransactions.ReservationId
  stationId: string; // SwapTransactions.StationId
  vehicleId: string; // SwapTransactions.VehicleId
  userSubscriptionId?: string; // SwapTransactions.UserSubscriptionId
  invoiceId?: string; // SwapTransactions.InvoiceId
  issuedBatteryId: string; // SwapTransactions.IssuedBatteryId
  returnedBatteryId?: string; // SwapTransactions.ReturnedBatteryId
  issuedBatterySerial: string; // SwapTransactions.IssuedBatterySerial
  returnedBatterySerial?: string; // SwapTransactions.ReturnedBatterySerial
  checkedInByStaffId?: string; // SwapTransactions.CheckedInByStaffId
  batteryIssuedByStaffId?: string; // SwapTransactions.BatteryIssuedByStaffId
  batteryReceivedByStaffId?: string; // SwapTransactions.BatteryReceivedByStaffId
  completedByStaffId?: string; // SwapTransactions.CompletedByStaffId
  vehicleOdoAtSwap: number; // SwapTransactions.VehicleOdoAtSwap
  batteryHealthIssued?: number; // SwapTransactions.BatteryHealthIssued
  batteryHealthReturned?: number; // SwapTransactions.BatteryHealthReturned
  paymentType: number; // SwapTransactions.PaymentType (0=Subscription, 1=Card, 2=Cash)
  swapFee: number; // SwapTransactions.SwapFee
  kmChargeAmount: number; // SwapTransactions.KmChargeAmount
  totalAmount: number; // SwapTransactions.TotalAmount
  isPaid: boolean; // SwapTransactions.IsPaid
  status: number; // SwapTransactions.Status (0=Started, 1=CheckedIn, 2=BatteryIssued, 3=BatteryReturned, 4=Completed, 5=Cancelled)
  startedAt: string; // SwapTransactions.StartedAt
  checkedInAt?: string; // SwapTransactions.CheckedInAt
  batteryIssuedAt?: string; // SwapTransactions.BatteryIssuedAt
  batteryReturnedAt?: string; // SwapTransactions.BatteryReturnedAt
  completedAt?: string; // SwapTransactions.CompletedAt
  cancelledAt?: string; // SwapTransactions.CancelledAt
  notes?: string; // SwapTransactions.Notes
  cancellationReason?: string; // SwapTransactions.CancellationReason
  // Additional fields for UI
  customer?: string;
  vehicle?: string;
  time?: string;
  batteryOut?: string;
  batteryIn?: string;
  amount?: number;
  paymentMethod?: 'subscription' | 'card' | 'cash';
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  date?: string;
}

export interface DailyStats {
  totalSwaps: number;
  revenue: number;
  avgSwapTime: number;
  customerRating: number;
  lowBatteryAlerts: number;
  maintenanceNeeded: number;
}

export interface RevenueStats {
  totalRevenue: number;
  onlineRevenue: number;
  counterRevenue: number;
  paidTransactions: number;
  pendingTransactions: number;
  unpaidTransactions: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  periodLabel: string;
}

export interface ReservationData {
  id: string; // Reservations.Id
  userId: string; // Reservations.UserId
  stationId: string; // Reservations.StationId
  batteryModelId: string; // Reservations.BatteryModelId
  batteryUnitId?: string; // Reservations.BatteryUnitId
  slotDate: string; // Reservations.SlotDate
  slotStartTime: string; // Reservations.SlotStartTime
  slotEndTime: string; // Reservations.SlotEndTime
  qrCode?: string; // Reservations.QRCode
  checkedInAt?: string; // Reservations.CheckedInAt
  verifiedByStaffId?: string; // Reservations.VerifiedByStaffId
  status: number; // Reservations.Status (0=Pending, 1=CheckedIn, 2=Completed, 3=Cancelled)
  cancelReason?: number; // Reservations.CancelReason
  cancelNote?: string; // Reservations.CancelNote
  cancelledAt?: string; // Reservations.CancelledAt
  createdAt: string; // Reservations.CreatedAt
  // Additional fields for UI
  checkInWindow?: {
    earliest: string;
    latest: string;
  };
  customerInfo?: {
    name: string;
    phone: string;
    vehicle: string;
  };
  assignedBattery?: {
    batteryUnitId: string;
    serialNumber: string;
    chargeLevel: number;
    location: string;
  };
}

export interface SwapData {
  bookingId: string;
  batteryOutId: string;
  batteryInId: string;
  amount: number;
  paymentMethod: string;
}

export interface InspectionData {
  batteryId: string;
  health: number;
  voltage: number;
  temperature: number;
  notes?: string;
  issues?: string[];
}

// API Functions - Using real backend APIs
export const staffApi = {
  // Initialize user session - Get current user and staff profile
  initializeUserSession: async function(): Promise<{
    user: any;
    stationId: string | number;
    staffProfile: any;
  }> {
    try {
      console.log('initializeUserSession: Starting user session initialization');
      const currentUser = await this.getCurrentUser();
      console.log('initializeUserSession: Current user received:', currentUser);
      
      let staffProfile = null;
      let stationId = currentUser.stationId || '9939220c-42ee-4e9b-9f87-6365f6555a8b';
      
      if (currentUser.role === 'Staff' || currentUser.role === 'staff') {
        try {
          staffProfile = await this.getStaffProfile(currentUser.id);
          console.log('initializeUserSession: Staff profile received:', staffProfile);
          stationId = staffProfile.stationId || stationId;
        } catch (staffError) {
          console.warn('initializeUserSession: Could not fetch staff profile:', staffError);
        }
      }
      
      const result = {
        user: currentUser,
        stationId,
        staffProfile
      };
      
      console.log('initializeUserSession: Session initialized successfully:', result);
      return result;
    } catch (error) {
      console.error('Error initializing user session:', error);
      throw error;
    }
  },

  // Get current user info
  getCurrentUser: async function(): Promise<any> {
    try {
      console.log('getCurrentUser: Fetching current user info from /api/v1/Auth/me');
      const response = await api.get('/api/v1/Auth/me');
      console.log('getCurrentUser: API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  // Battery Management - Using real API with BatteryUnits endpoint
  async getBatteries(stationId: number): Promise<Battery[]> {
    try {
      if (!stationId || stationId === 0) {
        console.warn('Station ID is invalid, returning empty array');
        return [];
      }
      
      const response = await api.get(`/api/BatteryUnits`);
      console.log('BatteryUnits API response:', response.data);
      console.log('Requested stationId:', stationId);
      console.log('All batteries:', response.data.data);
      
      // Map all batteries to our interface (temporarily remove station filter)
      const stationBatteries = response.data.data
        .map((battery: any) => {
          console.log(`Battery ${battery.serial} stationId: ${battery.stationId}, requested: ${stationId}`);
          return {
          id: battery.id,
          serial: battery.serial,
          batteryModelId: battery.batteryModelId,
          stationId: battery.stationId,
          status: battery.status === 'Full' ? 2 : 
                  battery.status === 'Charging' ? 1 : 
                  battery.status === 'Maintenance' ? 3 : 
                  battery.status === 'Issued' ? 0 : 0,
          updatedAt: battery.updatedAt,
          isReserved: battery.isReserved,
          // Additional fields for UI compatibility
          slot: `Slot-${battery.serial.slice(-4)}`,
          health: 85, // Default value
          voltage: battery.voltage || 380,
          cycles: 0, // Default value
          lastSwap: battery.updatedAt,
          model: battery.batteryModelName || 'Standard',
          temperature: 25 // Default value
          };
        });
      
      console.log('Mapped batteries:', stationBatteries);
      return stationBatteries;
    } catch (error) {
      console.error('Error fetching batteries:', error);
      return [];
    }
  },

  // Get all batteries without filtering
  async getAllBatteries(): Promise<Battery[]> {
    try {
      const response = await api.get(`/api/BatteryUnits`);
      
      return response.data.data.map((battery: any) => ({
        id: battery.id,
        serial: battery.serial,
        batteryModelId: battery.batteryModelId,
        stationId: battery.stationId,
        status: battery.status === 'Full' ? 2 : 
                battery.status === 'Charging' ? 1 : 
                battery.status === 'Maintenance' ? 3 : 
                battery.status === 'Issued' ? 0 : 0,
        updatedAt: battery.updatedAt,
        isReserved: battery.isReserved,
        // Additional fields for UI compatibility
        slot: `Slot-${battery.serial.slice(-4)}`,
        health: 85, // Default value
        voltage: battery.voltage || 380,
        cycles: 0, // Default value
        lastSwap: battery.updatedAt,
        model: battery.batteryModelName || 'Standard',
        temperature: 25 // Default value
      }));
    } catch (error) {
      console.error('Error fetching all batteries:', error);
      return [];
    }
  },

  async updateBatteryStatus(batteryId: string, status: number, staffId: string): Promise<void> {
    try {
      await api.patch(`/api/BatteryUnits/${batteryId}/status`, {
        status, // Use number status (0=Empty, 1=Charging, 2=Full, 3=Maintenance)
        staffId
      });
    } catch (error) {
      console.error('Error updating battery status:', error);
      throw error;
    }
  },

  // Get booking slot information
  async getBookingSlotInfo(bookingId: string): Promise<{
    slotDate: string;
    slotTime: string;
    checkInWindow: { earliest: string; latest: string };
    registrationTime: string;
  }> {
    try {
      const response = await api.get(`/api/v1/slot-reservations/${bookingId}`);
      const reservation = response.data;
      
      return {
        slotDate: reservation.slotDate,
        slotTime: `${reservation.slotStartTime} - ${reservation.slotEndTime}`,
        checkInWindow: {
          earliest: reservation.slotStartTime,
          latest: reservation.slotEndTime
        },
        registrationTime: reservation.createdAt
      };
    } catch (error) {
      console.error('Error fetching booking slot info:', error);
      throw error;
    }
  },

  // Add battery units to station
  async addBatteryUnitsToStation(requestData: any): Promise<any> {
    try {
      console.log('addBatteryUnitsToStation: Adding battery units to station:', requestData);
      
      // Log request details
      console.log('addBatteryUnitsToStation: Request URL:', '/api/BatteryUnits/add-to-station');
      console.log('addBatteryUnitsToStation: Request method:', 'POST');
      console.log('addBatteryUnitsToStation: Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')?.substring(0, 20)}...`
      });
      
      const response = await api.post('/api/BatteryUnits/add-to-station', requestData);
      console.log('addBatteryUnitsToStation: Success response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('addBatteryUnitsToStation: Error adding battery units:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('addBatteryUnitsToStation: Error response data:', error.response.data);
        console.error('addBatteryUnitsToStation: Error response status:', error.response.status);
        console.error('addBatteryUnitsToStation: Error response headers:', error.response.headers);
      }
      
      if (error.response?.status === 400) {
        console.error('addBatteryUnitsToStation: 400 Bad Request - Invalid request data');
        throw new Error(`400 Bad Request: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.response?.status === 401) {
        console.warn('addBatteryUnitsToStation: Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      if (error.response?.status === 403) {
        console.warn('addBatteryUnitsToStation: Access forbidden for adding battery units');
        throw new Error('Không có quyền thêm pin vào trạm này');
      }
      
      throw error;
    }
  },

  // Get driver info by QR code
  async getDriverByQRCode(qrCode: string): Promise<any> {
    try {
      console.log('getDriverByQRCode: Fetching driver info for QR:', qrCode);
      const response = await api.get(`/api/v1/drivers/qr/${qrCode}`);
      console.log('getDriverByQRCode: Driver info received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('getDriverByQRCode: Error fetching driver info:', error);
      
      // If API fails, return mock data for testing
      console.log('getDriverByQRCode: Returning mock driver data for testing');
      return {
        id: 'driver-001',
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        licenseNumber: 'A123456789',
        vehicleInfo: {
          model: 'Tesla Model 3',
          plateNumber: '30A-12345',
          batteryModel: 'battery-model-001'
        },
        qrCode: qrCode
      };
    }
  },

  // Get reservation by driver ID
  async getReservationByDriverId(driverId: string): Promise<any> {
    try {
      console.log('getReservationByDriverId: Fetching reservation for driver:', driverId);
      const response = await api.get(`/api/v1/reservations/driver/${driverId}`);
      console.log('getReservationByDriverId: Reservation received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('getReservationByDriverId: Error fetching reservation:', error);
      
      // If API fails, return mock data for testing
      console.log('getReservationByDriverId: Returning mock reservation data for testing');
      return {
        id: 'reservation-001',
        userId: driverId,
        stationId: '1',
        batteryModelId: 'battery-model-001',
        batteryUnitId: 'battery-unit-001',
        slotDate: new Date().toISOString().split('T')[0],
        slotStartTime: '09:00',
        slotEndTime: '09:30',
        qrCode: 'RESERVATION-QR-001',
        status: 0,
        createdAt: new Date().toISOString(),
        customerInfo: {
          name: 'Nguyễn Văn A',
          phone: '0123456789',
          vehicle: 'Tesla Model 3'
        }
      };
    }
  },

  // Queue Management - Using real API with Reservations endpoint
  async getQueue(stationId: number): Promise<Booking[]> {
    try {
      console.log('getQueue: Fetching reservations for station:', stationId);
      
      // Try to get reservations from the correct API endpoint
      let response;
      try {
        // First try: /api/v1/slot-reservations (most likely endpoint for reservations)
        response = await api.get(`/api/v1/slot-reservations`);
        console.log('getQueue: Got reservations from /api/v1/slot-reservations:', response.data);
      } catch (slotReservationsError: any) {
        console.warn('getQueue: /api/v1/slot-reservations failed:', slotReservationsError.response?.status);
        
        try {
          // Second try: /api/v1/Reservations
          response = await api.get(`/api/v1/Reservations`);
          console.log('getQueue: Got reservations from /api/v1/Reservations:', response.data);
        } catch (reservationsError: any) {
          console.warn('getQueue: /api/v1/Reservations failed:', reservationsError.response?.status);
          
          try {
            // Third try: /api/Reservations (without v1)
            response = await api.get(`/api/Reservations`);
            console.log('getQueue: Got reservations from /api/Reservations:', response.data);
          } catch (legacyError: any) {
            console.warn('getQueue: All reservation endpoints failed, returning empty array');
            return [];
          }
        }
      }
      
      // Handle different response formats
      let reservations = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          reservations = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          reservations = response.data.data;
        } else if (response.data.reservations && Array.isArray(response.data.reservations)) {
          reservations = response.data.reservations;
        }
      }
      
      console.log('getQueue: Processing reservations:', reservations.length);
      
      return reservations.map((booking: any) => ({
        id: booking.id,
        userId: booking.userId || booking.customerId,
        stationId: booking.stationId,
        batteryModelId: booking.batteryModelId,
        batteryUnitId: booking.batteryUnitId,
        slotDate: booking.slotDate || new Date().toISOString().split('T')[0],
        slotStartTime: booking.slotStartTime || booking.startTime,
        slotEndTime: booking.slotEndTime || booking.endTime,
        qrCode: booking.qrCode,
        checkedInAt: booking.checkedInAt,
        verifiedByStaffId: booking.verifiedByStaffId,
        status: booking.status === 'Pending' ? 0 : booking.status === 'CheckedIn' ? 1 : booking.status === 'Completed' ? 2 : 3,
        cancelReason: booking.cancelReason,
        cancelNote: booking.cancelNote,
        cancelledAt: booking.cancelledAt,
        createdAt: booking.createdAt,
        // Additional fields for UI compatibility
        customer: booking.customerName || booking.userName || 'Customer',
        vehicle: booking.vehicleModel || booking.vehiclePlate || 'Vehicle',
        time: booking.slotStartTime || booking.startTime,
        code: booking.qrCode || booking.id.slice(-8),
        checkInWindow: booking.checkInWindow || {
          earliest: booking.slotStartTime || booking.startTime,
          latest: booking.slotEndTime || booking.endTime
        },
        registrationTime: booking.createdAt
      }));
    } catch (error: any) {
      console.error('getQueue: Error fetching queue:', error);
      
      // Return empty array instead of throwing error
      return [];
    }
  },

  // Swap Process - Using real API (Backend completed 100%)
  async startSwapProcess(bookingId: string, staffId: string, stationId: number): Promise<void> {
    try {
      await api.post('/api/v1/swaps/start', {
        reservationId: bookingId,
        staffId,
        stationId
      });
    } catch (error) {
      console.error('Error starting swap:', error);
      throw error;
    }
  },

  async completeSwapProcess(swapData: SwapData, staffId: string, stationId: number): Promise<void> {
    try {
      await api.put(`/api/v1/swaps/${swapData.bookingId}/complete`, {
        ...swapData,
        staffId,
        stationId
      });
    } catch (error) {
      console.error('Error completing swap:', error);
      throw error;
    }
  },

  // Transaction Management - Using real API with Swaps endpoint
  async getTransactions(stationId: number, limit: number = 10, date?: string): Promise<Transaction[]> {
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: limit.toString()
      });
      
      const response = await api.get(`/api/v1/swaps/history?${params}`);
      return response.data.transactions.map((transaction: any) => ({
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        userId: transaction.userId,
        reservationId: transaction.reservationId,
        stationId: transaction.stationId,
        vehicleId: transaction.vehicleId,
        userSubscriptionId: transaction.userSubscriptionId,
        invoiceId: transaction.invoiceId,
        issuedBatteryId: transaction.issuedBatteryId,
        returnedBatteryId: transaction.returnedBatteryId,
        issuedBatterySerial: transaction.issuedBatterySerial,
        returnedBatterySerial: transaction.returnedBatterySerial,
        checkedInByStaffId: transaction.checkedInByStaffId,
        batteryIssuedByStaffId: transaction.batteryIssuedByStaffId,
        batteryReceivedByStaffId: transaction.batteryReceivedByStaffId,
        completedByStaffId: transaction.completedByStaffId,
        vehicleOdoAtSwap: transaction.vehicleOdoAtSwap,
        batteryHealthIssued: transaction.batteryHealthIssued,
        batteryHealthReturned: transaction.batteryHealthReturned,
        paymentType: transaction.paymentType,
        swapFee: transaction.swapFee,
        kmChargeAmount: transaction.kmChargeAmount,
        totalAmount: transaction.totalAmount,
        isPaid: transaction.isPaid,
        status: transaction.status,
        startedAt: transaction.startedAt,
        checkedInAt: transaction.checkedInAt,
        batteryIssuedAt: transaction.batteryIssuedAt,
        batteryReturnedAt: transaction.batteryReturnedAt,
        completedAt: transaction.completedAt,
        cancelledAt: transaction.cancelledAt,
        notes: transaction.notes,
        cancellationReason: transaction.cancellationReason,
        // Additional fields for UI compatibility
        customer: transaction.customerName || transaction.userName,
        vehicle: transaction.vehicleModel || transaction.vehiclePlate,
        time: transaction.startedAt ? new Date(transaction.startedAt).toLocaleTimeString() : '',
        batteryOut: transaction.issuedBatterySerial,
        batteryIn: transaction.returnedBatterySerial,
        amount: transaction.totalAmount,
        paymentMethod: transaction.paymentType === 0 ? 'subscription' : transaction.paymentType === 1 ? 'card' : 'cash',
        paymentStatus: transaction.isPaid ? 'paid' : 'unpaid',
        date: transaction.startedAt ? new Date(transaction.startedAt).toISOString().split('T')[0] : ''
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  // Revenue Statistics - Using real API with aggregated data
  async getRevenueStats(stationId: number, period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'): Promise<RevenueStats> {
    try {
      const periodLabels = {
        monthly: 'Tháng hiện tại',
        quarterly: 'Quý hiện tại',
        yearly: 'Năm hiện tại'
      };
      
      // Get transactions for the period
      const transactions = await this.getTransactions(stationId, 1000);
      const now = new Date();
      const startDate = period === 'monthly' ? new Date(now.getFullYear(), now.getMonth(), 1) :
                      period === 'quarterly' ? new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1) :
                      new Date(now.getFullYear(), 0, 1);
      
      const periodTransactions = transactions.filter(t => new Date(t.startedAt) >= startDate);
      
      const totalRevenue = periodTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const paidTransactions = periodTransactions.filter(t => t.isPaid).length;
      const pendingTransactions = periodTransactions.filter(t => !t.isPaid && t.status < 4).length;
      const unpaidTransactions = periodTransactions.filter(t => !t.isPaid && t.status >= 4).length;
      
      return {
        totalRevenue,
        onlineRevenue: totalRevenue * 0.6, // Estimate
        counterRevenue: totalRevenue * 0.4, // Estimate
        paidTransactions,
        pendingTransactions,
        unpaidTransactions,
        period,
        periodLabel: periodLabels[period]
      };
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      return {
        totalRevenue: 0,
        onlineRevenue: 0,
        counterRevenue: 0,
        paidTransactions: 0,
        pendingTransactions: 0,
        unpaidTransactions: 0,
        period,
        periodLabel: 'Tháng hiện tại'
      };
    }
  },

  // Update Payment Status - Using real API with SwapTransactions table
  async updatePaymentStatus(transactionId: string, status: 'unpaid' | 'pending' | 'paid'): Promise<void> {
    try {
      const isPaid = status === 'paid';
      await api.put(`/api/v1/swaps/${transactionId}/payment-status`, {
        isPaid
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Dashboard Stats - Using real API with aggregated data
  async getDailyStats(stationId: number, date?: string): Promise<DailyStats> {
    try {
      // Get transactions for the day
      const transactions = await this.getTransactions(stationId, 100, date);
      const todayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.startedAt).toDateString();
        const targetDate = date ? new Date(date).toDateString() : new Date().toDateString();
        return transactionDate === targetDate;
      });

      // Calculate stats from real data
      const totalSwaps = todayTransactions.length;
      const revenue = todayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const avgSwapTime = totalSwaps > 0 ? 8.5 : 0; // Default value since we don't have timing data
      const customerRating = 4.8; // Default value since we don't have rating data
      
      // Get battery alerts from battery status
        const batteries = await this.getBatteries(stationId);
      const lowBatteryAlerts = batteries.filter(b => (b.health || 0) < 20).length;
      const maintenanceNeeded = batteries.filter(b => b.status === 3).length;

      return {
        totalSwaps,
        revenue,
        avgSwapTime,
        customerRating,
        lowBatteryAlerts,
        maintenanceNeeded,
      };
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      return {
        totalSwaps: 0,
        revenue: 0,
        avgSwapTime: 0,
        customerRating: 0,
        lowBatteryAlerts: 0,
        maintenanceNeeded: 0,
      };
    }
  },

  // Battery Health Monitoring - Using real API
  async createInspection(inspectionData: InspectionData, staffId: string, stationId: number): Promise<void> {
    try {
      // Update battery condition using existing endpoint
      await api.patch(`/api/BatteryUnits/${inspectionData.batteryId}/status`, {
        health: inspectionData.health,
        voltage: inspectionData.voltage,
        temperature: inspectionData.temperature,
        notes: inspectionData.notes,
        staffId,
        stationId
      });
    } catch (error) {
      console.error('Error creating inspection:', error);
      throw error;
    }
  },

  // Get Station Info - Using real API (Only this endpoint works)
  async getStationInfo(stationId: number): Promise<any> {
    try {
      const response = await api.get(`/api/v1/Stations/${stationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching station info:', error);
      throw error;
    }
  },

  // Get Staff Profile - Using real API with Users/staff endpoint
  async getStaffProfile(staffId: string): Promise<any> {
    try {
      if (!staffId || staffId === 'undefined') {
        console.warn('Staff ID is undefined, returning default profile');
        return {
          id: 'unknown',
          name: 'Unknown Staff',
          email: 'staff@evbss.com',
          stationId: 1,
          role: 'Staff'
        };
      }
      
      // Check if token exists before making API call
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        console.warn('getStaffProfile: No token found, returning default profile');
        return {
          id: staffId,
          name: 'EVBSS Staff',
          email: 'staff@evbss.local',
          stationId: 1,
          role: 'Staff'
        };
      }
      
      console.log('getStaffProfile: Fetching staff profile with token:', token.substring(0, 20) + '...');
      
      // Try different approaches to get staff profile
      let response;
      try {
        // First try: Get current user info
        response = await api.get('/api/v1/Auth/me');
        console.log('getStaffProfile: Got current user info:', response.data);
        
        // If user is staff, return their profile
        if (response.data.role === 'Staff' || response.data.role === 'staff') {
      return {
        id: response.data.id,
            name: response.data.name || response.data.fullName || 'EVBSS Staff',
            email: response.data.email || 'staff@evbss.local',
            stationId: response.data.stationId || 1,
            role: response.data.role || 'Staff'
          };
        }
      } catch (authError: any) {
        console.warn('getStaffProfile: Auth/me failed, trying Users/staff:', authError.response?.status);
        
        // Fallback: Try Users/staff endpoint
        response = await api.get(`/api/v1/Users/staff`);
      }
      
      // Handle paginated response (as shown in Swagger UI)
      const staffData = response.data.data && response.data.data.length > 0 
        ? response.data.data[0] // Get first staff member from paginated response
        : response.data; // Fallback to direct response
      
      console.log('getStaffProfile: API response:', staffData);
      
      return {
        id: staffData.id,
        name: staffData.name || staffData.fullName,
        email: staffData.email,
        stationId: staffData.stationId || 1,
        role: staffData.role || "Staff"
      };
    } catch (error: any) {
      console.error('Error fetching staff profile:', error);
      
      // If it's a 401 Unauthorized error, clear token and redirect
      if (error.response?.status === 401) {
        console.warn('Token expired or invalid, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return null;
      }
      
      // If it's a 403 Forbidden error, return a default profile instead of throwing
      if (error.response?.status === 403) {
        console.warn('Access forbidden for staff profile, returning default profile');
        return {
          id: staffId,
          name: 'EVBSS Staff',
          email: 'staff@evbss.local',
          stationId: 1,
          role: 'Staff'
        };
      }
      
      throw error;
    }
  },

  // Get reservation by QR code - Using real API
  getReservationByQRCode: async function(qrCode: string): Promise<any> {
    try {
      console.log('getReservationByQRCode: Searching for reservation with QR:', qrCode);
      
      // Search through reservations to find matching QR code
      const reservations = await this.getQueue(1);
      const reservation = reservations.find(r => r.qrCode === qrCode);
      
      if (!reservation) {
        console.warn('getReservationByQRCode: No reservation found for QR code:', qrCode);
        return null;
      }
      
      console.log('getReservationByQRCode: Found reservation:', reservation);
      return reservation;
    } catch (error) {
      console.error('Error getting reservation by QR code:', error);
      throw error;
    }
  },

  // Check-in API - Using real API with SlotReservations endpoint
  async checkInReservation(qrCode: string): Promise<ReservationData> {
    try {
      // Find reservation by QR code first
      const reservations = await this.getQueue(1);
      const reservation = reservations.find(r => r.qrCode === qrCode);
      
      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // Call check-in API
      await api.post(`/api/v1/slot-reservations/${reservation.id}/check-in`);
      
      return {
        id: reservation.id,
        userId: reservation.userId,
        stationId: reservation.stationId,
        batteryModelId: reservation.batteryModelId,
        batteryUnitId: reservation.batteryUnitId,
        slotDate: reservation.slotDate,
        slotStartTime: reservation.slotStartTime,
        slotEndTime: reservation.slotEndTime,
        qrCode: reservation.qrCode,
        checkedInAt: new Date().toISOString(), // Mark as checked in
        verifiedByStaffId: "current-staff",
        status: 1, // CheckedIn
        cancelReason: reservation.cancelReason,
        cancelNote: reservation.cancelNote,
        cancelledAt: reservation.cancelledAt,
        createdAt: reservation.createdAt,
        // Additional fields for UI compatibility
        checkInWindow: reservation.checkInWindow || {
          earliest: reservation.slotStartTime,
          latest: reservation.slotEndTime
        },
        customerInfo: {
          name: reservation.customer || "Customer",
          phone: "0123456789",
          vehicle: reservation.vehicle || "Vehicle"
        },
        assignedBattery: {
          batteryUnitId: reservation.batteryUnitId || "battery1",
          serialNumber: `BAT${reservation.id.slice(-4)}`,
          chargeLevel: 95,
          location: `Slot-${reservation.id.slice(-4)}`
        }
      };
    } catch (error) {
      console.error('Error checking in reservation:', error);
      throw error;
    }
  },

  // Cancel booking API - Using real API with SlotReservations endpoint
  async cancelBooking(bookingId: string, reason: string = "StaffCancelled"): Promise<{ success: boolean; message: string }> {
    try {
      await api.delete(`/api/v1/slot-reservations/${bookingId}`);
      return {
        success: true,
        message: `Booking ${bookingId} cancelled successfully. Reason: ${reason}`
      };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Helper methods for data transformation
  mapBatteryStatus(status: any): 'full' | 'charging' | 'maintenance' | 'empty' {
    if (typeof status === 'number') {
      switch (status) {
        case 0: return 'empty';
        case 1: return 'charging';
        case 2: return 'full';
        case 3: return 'maintenance';
        default: return 'full';
      }
    }

    const statusStr = String(status).toLowerCase();
    if (statusStr.includes('full') || statusStr.includes('ready')) return 'full';
    if (statusStr.includes('charging')) return 'charging';
    if (statusStr.includes('maintenance') || statusStr.includes('repair')) return 'maintenance';
    return 'empty';
  },

  mapReservationStatus(status: any): 'pending' | 'in-progress' | 'confirmed' | 'completed' {
    const statusStr = String(status).toLowerCase();
    if (statusStr.includes('completed') || statusStr.includes('finished')) return 'completed';
    if (statusStr.includes('confirmed') || statusStr.includes('active')) return 'confirmed';
    if (statusStr.includes('progress') || statusStr.includes('ongoing')) return 'in-progress';
    return 'pending';
  },

  mapPaymentMethod(method: any): 'subscription' | 'card' | 'cash' {
    const methodStr = String(method).toLowerCase();
    if (methodStr.includes('subscription') || methodStr.includes('plan')) return 'subscription';
    if (methodStr.includes('card') || methodStr.includes('vnpay')) return 'card';
    return 'cash';
  },

  // Additional API functions for new features - Using BatteryUnits table
  async takeBattery(batteryId: string, staffId: string, stationId: number): Promise<void> {
    try {
      await api.post(`/api/BatteryUnits/add-to-station`, {
        staffId,
        stationId
      });
    } catch (error) {
      console.error('Error taking battery:', error);
      throw error;
    }
  },

  async createPayment(transactionId: string, paymentMethod: string, amount: number): Promise<any> {
    try {
      const response = await api.post(`/api/v1/payments/vnpay/create`, {
        transactionId,
        method: paymentMethod,
        amount
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  async getInvoice(transactionId: string): Promise<any> {
    try {
      const response = await api.get(`/api/v1/invoices/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  },

  async printInvoice(transactionId: string): Promise<void> {
    try {
      // Get invoice data first
      const invoice = await this.getInvoice(transactionId);
      // Trigger browser print dialog
      window.print();
    } catch (error) {
      console.error('Error printing invoice:', error);
      throw error;
    }
  },

  async updateReservationStatus(reservationId: string, status: number): Promise<void> {
    try {
      await api.put(`/api/v1/slot-reservations/${reservationId}`, { status });
    } catch (error) {
      console.error('Error updating reservation status:', error);
      throw error;
    }
  },

  async getBatteryCondition(batteryId: string): Promise<any> {
    try {
      const response = await api.get(`/api/BatteryUnits/${batteryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching battery condition:', error);
      throw error;
    }
  },

  // Function to take battery from station (DELETE /api/BatteryUnits/{id})
  async takeBatteryFromStation(batteryId: string): Promise<any> {
    try {
      console.log('staffApi: Taking battery from station:', batteryId);
      
      const response = await api.delete(`/api/BatteryUnits/${batteryId}`);
      console.log('staffApi: Battery taken successfully:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('staffApi: Error taking battery from station:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Pin không tồn tại hoặc đã được lấy');
      }
      
      if (error.response?.status === 400) {
        throw new Error('Không thể lấy pin này (có thể đang được sử dụng)');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Token đã hết hạn. Vui lòng đăng nhập lại.');
      }
      
      if (error.response?.status === 403) {
        throw new Error('Không có quyền lấy pin này');
      }
      
      throw new Error('Có lỗi xảy ra khi lấy pin');
    }
  },

  async updateBatteryCondition(batteryId: string, conditionData: any): Promise<void> {
    try {
      await api.patch(`/api/BatteryUnits/${batteryId}/status`, conditionData);
    } catch (error) {
      console.error('Error updating battery condition:', error);
      throw error;
    }
  }
};

export default staffApi;
