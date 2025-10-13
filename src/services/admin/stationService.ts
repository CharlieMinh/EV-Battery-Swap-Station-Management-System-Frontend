import api from '@/configs/axios';
import React from 'react'

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface Station {
    id: String;
    name: String;
    address: String;
    city?: String;
    coordinates: {
        lat: number;
        lng: number;
    };
    isActive: boolean;
    openTime?:String;
    closeTime?:String;
    phoneNumber?:String;
    primaryImageUrl?:String;
    isOpenNow: boolean;
}


export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function fetchStations( page: number,
  pageSize: number
)
 {
    try {
        const response = await api.get(`/v1/Stations?page=${page}&pageSize=${pageSize}`)
        const mappedItems = response.data.items.map((s: any) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      isActive: s.isActive,
      coordinates: {
        lat: s.lat,   // ✅ map đúng field
        lng: s.lng,  // ✅ map đúng field
      },
    }));

    return {
      ...response.data,
      items: mappedItems, // ✅ trả về items đúng kiểu Station
    };
    } catch (error) {
        console.error('Error fetching stations:', error);
        throw error;
    }
}

export async function handleSubmit(data: any): Promise<Station> {
    try {
        const response = await api.post('/v1/admin/stations',data , {withCredentials: true});       
        return response.data;
    } catch (error) {
        console.error('Error adding station:', error);
        throw error;
    }
}

export async function fetchStationById(id: string): Promise<Station> {
   try {
      const response = await api.get(`/v1/Stations/${id}`); 
      return response.data;
   } catch (error) {
      console.error('Error fetching station by ID:', error);
      throw error;
   }
}
