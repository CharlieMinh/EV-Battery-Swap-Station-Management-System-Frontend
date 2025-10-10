// src/components/map/StationMarkers.tsx

import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import { Station } from "./ormUtils"; // Đảm bảo đường dẫn import đúng
import { Icon } from "leaflet";

// Định nghĩa lại các Icon (nên đặt ở đây hoặc trong một file constants)
const nearestStationIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

const defaultStationIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

interface StationMarkersProps {
  stations: Station[];
  nearestStation: (Station & { distance: number }) | null;
}

export const StationMarkers: React.FC<StationMarkersProps> = ({
  stations,
  nearestStation,
}) => {
  // Tối ưu hóa render: Chỉ tính toán lại khi stations hoặc nearestStation thay đổi
  const markers = useMemo(() => {
    return stations.map((station) => {
      const isNearest = station.name === nearestStation?.name;
      return (
        <Marker
          key={station.name}
          position={[station.coordinates.lat, station.coordinates.lng]}
          icon={isNearest ? nearestStationIcon : defaultStationIcon}
        >
          <Popup>
            <b>{station.name}</b>
            <br />
            {station.address}
            {isNearest && nearestStation && (
              <div style={{ color: "red", fontWeight: "bold" }}>
                ⭐ Trạm gần nhất ({(nearestStation.distance / 1000).toFixed(2)}{" "}
                km)
              </div>
            )}
          </Popup>
        </Marker>
      );
    });
  }, [stations, nearestStation]);

  return <>{markers}</>;
};
