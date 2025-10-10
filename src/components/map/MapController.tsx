// src/components/map/MapController.tsx

import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import { Coordinates, Station } from "./ormUtils"; // Đảm bảo đường dẫn import đúng

interface MapControllerProps {
  userLocation: Coordinates;
  routeCoords: [number, number][];
}

export const MapController: React.FC<MapControllerProps> = ({
  userLocation,
  routeCoords,
}) => {
  const map = useMap();

  useEffect(() => {
    // Chỉ chạy khi tuyến đường đã được tính toán
    if (routeCoords.length > 0) {
      // routeCoords đã có format [lat, lng]
      const bounds = [userLocation.lat, userLocation.lng, ...routeCoords].map(
        (c) => (Array.isArray(c) ? c : [c, c]) // Để đảm bảo format đúng khi spread userLocation
      ) as [number, number][];

      map.fitBounds(routeCoords, { padding: [50, 50] }); // FitBounds dựa trên tuyến đường
    } else {
      // Fallback: nếu không có tuyến đường, chỉ set view tại vị trí người dùng
      map.setView([userLocation.lat, userLocation.lng], 14);
    }
  }, [routeCoords, map, userLocation]);

  return null;
};
