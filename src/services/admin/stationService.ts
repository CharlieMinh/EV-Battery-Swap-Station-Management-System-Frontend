import api from '@/configs/axios';
import React from 'react'

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Station {
<<<<<<< HEAD:src/services/stationService.ts
  id: String;
  name: String;
  address: String;
  city?: String;
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
}

export interface CreateStationRequest {
  name: String;
  address: String;
  city?: String;
  coordinates: Coordinates;
  isActive: boolean;
=======
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
>>>>>>> origin:src/services/admin/stationService.ts
}


export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

<<<<<<< HEAD:src/services/stationService.ts
export async function fetchStations(page: number,
  pageSize: number
) {
  try {
    const response = await api.get(`/v1/Stations?page=${page}&pageSize=${pageSize}`)
    const mappedItems = response.data.items.map((s: any) => ({
=======
export async function fetchStations( page: number,
  pageSize: number
)
 {
    try {
        const response = await api.get(`/api/v1/Stations?page=${page}&pageSize=${pageSize}`)
        const mappedItems = response.data.items.map((s: any) => ({
>>>>>>> origin:src/services/admin/stationService.ts
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

<<<<<<< HEAD:src/services/stationService.ts

export async function createStation(station: CreateStationRequest): Promise<CreateStationRequest> {

  try {
    const {coordinates, ...stationData} = station;
    const body = {
      ...stationData,
      lat: coordinates.lat,
      lng: coordinates.lng,
    };

    const response = await api.post('/v1/Stations', body, {withCredentials: true });

    return {
      name: response.data.name,
      address: response.data.address,
      city: response.data.city,
      coordinates: {
        lat: response.data.lat,
        lng: response.data.lng,
      },
      isActive: response.data.isActive,
=======
export async function handleSubmit(data: any): Promise<Station> {
    try {
        const response = await api.post('/api/v1/admin/stations',data , {withCredentials: true});       
        return response.data;
    } catch (error) {
        console.error('Error adding station:', error);
        throw error;
>>>>>>> origin:src/services/admin/stationService.ts
    }

  } catch (error) {
    console.error('Error creating station:', error);
    throw error;
  }
}

export async function fetchStationById(id: string): Promise<Station> {
   try {
      const response = await api.get(`/api/v1/Stations/${id}`); 
      return response.data;
   } catch (error) {
      console.error('Error fetching station by ID:', error);
      throw error;
   }
}
