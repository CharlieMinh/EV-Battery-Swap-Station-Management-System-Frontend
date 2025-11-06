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
export async function countHistoryStationById(
  stationId: string,
  _page: number,   // chỉ là tham số, không dùng làm bộ đếm
  pageSize: number
): Promise<number> {
  try {
    let totalCompleted = 0;
    let currentPage = 1; // luôn bắt đầu từ trang 1
    let totalPages = 1;

    do {
      const res = await api.get<SwapHistoryResponse>(
        `/api/v1/swaps/all/admin?stationId=${stationId}&page=${currentPage}&pageSize=${pageSize}`
      );

      const completed = res.data.transactions.filter(
        (tx) => tx.stationId === stationId && tx.status === "Completed"
      );

      const byStatus = res.data.transactions
        .filter((tx) => tx.stationId === stationId)
        .reduce((acc, tx) => {
          acc[tx.status] = (acc[tx.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      console.log(
        `📄 Trang ${currentPage}: ${res.data.transactions.length} giao dịch của trạm ${stationId} — chi tiết:`,
        byStatus
      );

      totalCompleted += completed.length;
      totalPages = res.data.totalPages;
      currentPage++;
    } while (currentPage <= totalPages);

    console.log(`✅ Tổng ${totalCompleted} giao dịch Completed tại trạm ${stationId}`);
    return totalCompleted;
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử đổi pin:", error);
    return 0;
  }
}


export async function fetchHistoryStationById(
  stationId: string,
  page: number,
  pageSize: number
): Promise<SwapTransaction[]> {
  try {
    let allTransactions: SwapTransaction[] = [];
    let currentPage = page;
    let totalPages = 1;

    do {
      const response = await api.get<SwapHistoryResponse>(
        `/api/v1/swaps/all/admin?page=${currentPage}&pageSize=${pageSize}`
      );

      // Lọc giao dịch của trạm cần tìm
      const filtered = response.data.transactions.filter(
        (tx) => tx.stationId === stationId
      );

      allTransactions = allTransactions.concat(filtered);

      totalPages = response.data.totalPages;
      currentPage++;
    } while (currentPage <= totalPages);

    console.log(`✅ Lấy được ${allTransactions.length} giao dịch của trạm ${stationId}`);
    return allTransactions;
  } catch (error) {
    console.error("❌ Lỗi khi lấy lịch sử đổi pin theo stationId:", error);
    return [];
  }
}


export async function getTotalCompletedSwaps(): Promise<number> {
  try {
    let totalSwaps = 0;
    let page = 1;
    const pageSize = 50;
    let totalPages = 1;

    while (page <= totalPages) {
      const res = await api.get(`/api/v1/swaps/all/admin`, {
        params: { page, pageSize },
      });

      const data = res.data;
      const completed = data.transactions.filter(
        (tx: any) => tx.status === "Completed"
      );

      totalSwaps += completed.length;
      totalPages = data.totalPages;
      page++;
    }

    return totalSwaps;
  } catch (error) {
    console.error("Error counting completed swaps:", error);
    return 0;
  }
}
