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
}

export interface CreateStationRequest {
  name: String;
  address: String;
  city?: String;
  coordinates: Coordinates;
  isActive: boolean;
}


export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function fetchStations(page: number,
  pageSize: number
) {
  try {
    const response = await api.get(`/v1/Stations?page=${page}&pageSize=${pageSize}`)
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
    }

  } catch (error) {
    console.error('Error creating station:', error);
    throw error;
  }
}
