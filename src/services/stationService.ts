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
    coordinates: {
        lat: number;
        lng: number;
    };
    isActive: boolean;
}


export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export async function fetchStations(  page: number,
  pageSize: number
)
 {
    try {
        const response = await api.get(`/v1/Stations?page=${page}&pageSize=${pageSize}`)
        return response.data;
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
