import api from '@/configs/axios';
import React from 'react'
import { SwapHistoryResponse, SwapTransaction } from '@/types/SwapTransaction';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Station {
    id: string;
    name: string;
    address: string;
    city: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    isActive: boolean;
    openTime?:string;
    closeTime?:string;
    phoneNumber?:string;
    primaryImageUrl?:string;
    isOpenNow: boolean;
}


export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface StationDetail extends Station {
    description?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  totalChargers?: number;
  availableChargers?: number;
  displayId: string
}

export interface UpdateStationPayload {
  name: string,
  address: string,
  city: string,
  lat: number,
  lng: number,
  isActive: boolean
}

export async function fetchStations( page: number,
  pageSize: number
)
 {
    try {
        const response = await api.get(`/api/v1/Stations?page=${page}&pageSize=${pageSize}`)
        const mappedItems = response.data.items.map((s: any) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      isActive: s.isActive,
      coordinates: {
        lat: s.lat,   
        lng: s.lng,   
      },
    }));

    return {
      ...response.data,
      items: mappedItems,
    };
  } catch (error) {
    console.error('Error fetching stations:', error);
    throw error;
  }
}

export async function createStation(data: any): Promise<Station> {
    try {
        const response = await api.post('/api/v1/admin/stations',data , {withCredentials: true});       
        return response.data;
    } catch (error) {
        console.error('Error adding station:', error);
        throw error;
    }
  } 


export async function fetchStationById(id: string): Promise<StationDetail> {
   try {
      const response = await api.get(`/api/v1/Stations/${id}`); 
      return response.data;
   } catch (error) {
      console.error('Error fetching station by ID:', error);
      throw error;
   }
}

export async function updateStation(id:string, payload : UpdateStationPayload) {
  try {
    const wrappedPayload = {
      name: payload.name,
      address: payload.address,
      city: payload.city,
      lat: payload.lat,
      lng: payload.lng,
      isActive: payload.isActive
    }

    const response = await api.put(`/api/v1/admin/stations/${id}`, wrappedPayload, {withCredentials: true})
    return response.data
  } catch(error) {
    console.error("Update failed:", error)
    throw error
  }
}

export async function fetchActiveStations(page:number, pageSize: number) {
    try {
      let activeCount = 0;
      let totalPage = 1;

      do {
        const response = await api.get(`/api/v1/Stations?page=${page}&pageSize=${pageSize}`);
        const items = response.data.items || [];

        activeCount += items.filter((station: any) => station.isActive).length;

        const total = response.data.total || 0;
        totalPage = Math.ceil(total / pageSize);
        
        page++;
      } while(page <= totalPage)

        return activeCount;
    } catch (error) {
        console.error('Error fetching active stations:', error);
    throw error;
    }
} 
export async function fetchBatteryCountByStation(stationId: string) {
  try {
    let count = 0;

    const response = await api.get("/api/BatteryUnits");
    const batteries = response.data.data

    count = batteries.filter((b: any) => b.stationId === stationId).length;
    return count;
  } catch (error) {
    console.error("Failed to get battery of staion:" , error)
  }
}
export async function countHistoryStationByName(
  stationName: string,
  page:number,
  pageSize:number
): Promise<SwapTransaction[]> {
  try {
    const response = await api.get<SwapHistoryResponse>(
      `/api/v1/swaps/history?page=${page}&pageSize=${pageSize}`
    );

    // Lọc những giao dịch thuộc trạm và đã hoàn thành
    const filtered = response.data.transactions.filter(
      (tx) => tx.stationName === stationName && tx.status === "Completed"
    );

    console.log(`Tìm thấy ${filtered.length} giao dịch hoàn thành tại ${stationName}`);
    return filtered;
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đổi pin:", error);
    return [];
  }
}

export async function fetchHistoryStationByName(
  stationName: string,
  page: number,
  pageSize: number
): Promise<SwapHistoryResponse | null> {
  try {
    const response = await api.get<SwapHistoryResponse>(
      `/api/v1/swaps/history?page=${page}&pageSize=${pageSize}`
    );

    // Nếu muốn lọc theo tên trạm tại đây (tùy bạn)
    const filteredTransactions = response.data.transactions.filter(
      (tx) => tx.stationName === stationName
    );

    return {
      ...response.data,
      transactions: filteredTransactions, // giữ nguyên cấu trúc, chỉ thay phần transactions
    };
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đổi pin:", error);
    return null;
  }
}

export async function getTotalCompletedSwaps(): Promise<number> {
  let totalSwaps = 0;
  let page = 0;
  const pageSize = 50; // số giao dịch mỗi lần lấy
  let totalPages = 1;  // khởi tạo tạm

  while (page < totalPages) {
    const response = await api.get(`/api/v1/swaps/history`, {
      params: {
        page,
        pageSize
      }
    });

    const data = response.data;

    // Lọc các giao dịch đã hoàn thành
    const completed = data.transactions.filter(
      (tx: any) => tx.status === "Completed"
    );

    totalSwaps += completed.length;

    // Cập nhật tổng số trang
    totalPages = data.totalPages;
    page += 1;
  }

  return totalSwaps;
}
