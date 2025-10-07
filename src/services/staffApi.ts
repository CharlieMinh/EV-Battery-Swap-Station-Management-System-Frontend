import api from '../configs/axios';

// Types
export interface Battery {
  id: string;
  slot: string;
  status: 'full' | 'charging' | 'maintenance' | 'empty';
  health: number;
  voltage: number;
  cycles: number;
  lastSwap: string;
  model: string;
  temperature: number;
}

export interface Booking {
  id: string;
  customer: string;
  vehicle: string;
  time: string;
  code: string;
  status: 'pending' | 'in-progress' | 'confirmed' | 'completed';
}

export interface Transaction {
  id: string;
  customer: string;
  vehicle: string;
  time: string;
  batteryOut: string;
  batteryIn: string;
  amount: number;
  paymentMethod: 'subscription' | 'card' | 'cash';
}

export interface DailyStats {
  totalSwaps: number;
  revenue: number;
  avgSwapTime: number;
  customerRating: number;
  lowBatteryAlerts: number;
  maintenanceNeeded: number;
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

// API Functions - Using mock data (Backend APIs not fully implemented yet)
export const staffApi = {
  // Battery Management - Using mock data (API endpoint not available yet)
  async getBatteries(stationId: number): Promise<Battery[]> {
    try {
      // API endpoint not available yet, return mock data
      return [
        {
          id: "1",
          slot: "A1",
          status: "full" as const,
          health: 95,
          voltage: 400,
          cycles: 1250,
          lastSwap: "10 min ago",
          model: "TM3-75kWh",
          temperature: 25,
        },
        {
          id: "2",
          slot: "A2",
          status: "charging" as const,
          health: 92,
          voltage: 380,
          cycles: 1180,
          lastSwap: "2 hours ago",
          model: "TM3-75kWh",
          temperature: 28,
        },
        {
          id: "3",
          slot: "A3",
          status: "full" as const,
          health: 88,
          voltage: 395,
          cycles: 1650,
          lastSwap: "1 hour ago",
          model: "BMW-80kWh",
          temperature: 24,
        },
        {
          id: "4",
          slot: "B1",
          status: "maintenance" as const,
          health: 65,
          voltage: 320,
          cycles: 2800,
          lastSwap: "1 day ago",
          model: "TM3-75kWh",
          temperature: 35,
        },
        {
          id: "5",
          slot: "B2",
          status: "charging" as const,
          health: 90,
          voltage: 370,
          cycles: 1420,
          lastSwap: "30 min ago",
          model: "BMW-80kWh",
          temperature: 26,
        },
        {
          id: "6",
          slot: "B3",
          status: "full" as const,
          health: 96,
          voltage: 398,
          cycles: 980,
          lastSwap: "5 min ago",
          model: "BMW-80kWh",
          temperature: 23,
        },
      ];
    } catch (error) {
      console.error('Error fetching batteries:', error);
      return [];
    }
  },

  async updateBatteryStatus(batteryId: string, status: string, staffId: string): Promise<void> {
    try {
      await api.put(`/v1/batteries/${batteryId}/status`, {
        status,
        staffId
      });
    } catch (error) {
      console.error('Error updating battery status:', error);
      // For now, just log the error since this endpoint might not exist
    }
  },

  // Queue Management - Using mock data (API endpoint not available yet)
  async getQueue(stationId: number): Promise<Booking[]> {
    try {
      // API endpoint not available yet, return mock data
      return [
        {
          id: "1",
          customer: "Alex Chen",
          vehicle: "Tesla Model 3",
          time: "15:30",
          code: "SW-2024-001",
          status: "pending" as const,
        },
        {
          id: "2",
          customer: "Sarah Kim",
          vehicle: "BMW iX3",
          time: "16:00",
          code: "SW-2024-002",
          status: "in-progress" as const,
        },
        {
          id: "3",
          customer: "Mike Johnson",
          vehicle: "Nissan Leaf",
          time: "16:30",
          code: "SW-2024-003",
          status: "confirmed" as const,
        },
        {
          id: "4",
          customer: "Emily Davis",
          vehicle: "Tesla Model Y",
          time: "17:00",
          code: "SW-2024-004",
          status: "confirmed" as const,
        },
      ];
    } catch (error) {
      console.error('Error fetching queue:', error);
      return [];
    }
  },

  // Swap Process - Using real API (Backend completed 100%)
  async startSwapProcess(bookingId: string, staffId: string, stationId: number): Promise<void> {
    try {
      await api.post('/v1/swaps/start', {
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
      await api.put(`/v1/swaps/${swapData.bookingId}/complete`, {
        ...swapData,
        staffId,
        stationId
      });
    } catch (error) {
      console.error('Error completing swap:', error);
      throw error;
    }
  },

  // Transaction Management - Using mock data (API endpoint not available yet)
  async getTransactions(stationId: number, limit: number = 10, date?: string): Promise<Transaction[]> {
    try {
      // API endpoint not available yet, return mock data
      return [
        {
          id: "1",
          customer: "Alex Chen",
          vehicle: "Tesla Model 3",
          time: "14:32",
          batteryOut: "A1",
          batteryIn: "B2",
          amount: 25,
          paymentMethod: "subscription" as const,
        },
        {
          id: "2",
          customer: "Sarah Kim",
          vehicle: "BMW iX3",
          time: "14:15",
          batteryOut: "A3",
          batteryIn: "B1",
          amount: 25,
          paymentMethod: "card" as const,
        },
        {
          id: "3",
          customer: "Mike Johnson",
          vehicle: "Nissan Leaf",
          time: "13:58",
          batteryOut: "B3",
          batteryIn: "A2",
          amount: 25,
          paymentMethod: "cash" as const,
        },
      ];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  // Dashboard Stats - Using mock data (API endpoints not available yet)
  async getDailyStats(stationId: number, date?: string): Promise<DailyStats> {
    try {
      // API endpoints not available yet, return realistic mock data
      return {
        totalSwaps: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 2000) + 800,
        avgSwapTime: Math.round((Math.random() * 2 + 2) * 100) / 100, // Round to 2 decimal places
        customerRating: Math.round((Math.random() * 1 + 4) * 100) / 100, // Round to 2 decimal places
        lowBatteryAlerts: Math.floor(Math.random() * 5),
        maintenanceNeeded: Math.floor(Math.random() * 3),
      };
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      // Return default stats on error
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

  // Battery Health Monitoring - Placeholder since no specific endpoint exists
  async createInspection(inspectionData: InspectionData, staffId: string, stationId: number): Promise<void> {
    try {
      // This would need a specific endpoint for battery inspections
      console.log('Battery inspection data:', inspectionData);
      // For now, just log the data since no endpoint exists
    } catch (error) {
      console.error('Error creating inspection:', error);
      throw error;
    }
  },

  // Get Station Info - Using real API (Only this endpoint works)
  async getStationInfo(stationId: number): Promise<any> {
    try {
      const response = await api.get(`/v1/Stations/${stationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching station info:', error);
      // Return mock station info
      return {
        id: stationId,
        name: `Station ${stationId}`,
        address: "123 Main Street",
        city: "HCM",
        isActive: true
      };
    }
  },

  // Get Staff Profile - Using mock data (API requires authentication)
  async getStaffProfile(staffId: string): Promise<any> {
    try {
      // API requires authentication, return mock profile
      return {
        id: staffId,
        name: "EVBSS Staff",
        email: "staff@evbss.com",
        stationId: 1,
        role: "Staff"
      };
    } catch (error) {
      console.error('Error fetching staff profile:', error);
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
  }
};

export default staffApi;
