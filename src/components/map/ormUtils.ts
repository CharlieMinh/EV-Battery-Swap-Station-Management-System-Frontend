// src/utils/osrmUtils.ts
import axios from "axios";
import { Coordinates, Station } from "@/services/stationService";

export interface RouteResult {
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

//Tính khoảng cách theo đường đi thực tế
export async function getDistanceBetweenPoints(
  from: Coordinates,
  to: Coordinates
): Promise<RouteResult> {

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const response = await axios.get(url);

    const route = response.data.routes[0]; // đơn vị: mét
    
    return {
        distance: route.distance,
        duration: route.duration,
        coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    }

  } catch (error) {
    console.error("Lỗi khi gọi ORS API:", error);
    throw error;
  }
}

export async function findNearestStation(
  userLocation: Coordinates,
  stations: Station[]
): Promise<(Station & { distance: number }) | null> {

      if (!userLocation || userLocation.lat === 0 && userLocation.lng === 0) {
    console.error("Invalid user location:", userLocation);
    return null;
  }
  let nearestStation: (Station & { distance: number }) | null = null;
  let shortestDistance = Infinity;

  for (const station of stations) {
    try {
      const raw = await getDistanceBetweenPoints(userLocation, station.coordinates);
      const distance = raw.distance // ép kiểu an toàn
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestStation = { ...station, distance };
      }
    } catch (err) {
      console.warn("Error calculating distance for station", station.name, err);
      
    }
  }

  return nearestStation;
}
