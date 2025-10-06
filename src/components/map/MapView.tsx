import { useLocation, useNavigate } from "react-router-dom";
import { Coordinates, getDistanceBetweenPoints, Station } from "./osrmUtils";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import useGeoLocation from "./useGeoLocation";
import { Map } from "leaflet";
import { FaCrosshairs } from "react-icons/fa";

interface MapState {
  userLocation: Coordinates;
  stations: Station[];
  nearestStation: Station & { distance: number };
}

export default function MapView() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const location = useGeoLocation();
  const mapRef = useRef<Map | null>(null);
  const ZOOM_LEVEL = 14;

  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  // kiểm tra nếu không có state (ví dụ reload F5)
  useEffect(() => {
    if (!state) {
      navigate("/");
    }
  }, [state, navigate]);

  if (!state) return null;

  const { userLocation, stations, nearestStation } = state as MapState;

  const showCurrentLocation = () => {
    if (location.loaded && !location.error) {
      if (mapRef.current != null) {
        mapRef.current.flyTo([userLocation.lat, userLocation.lng], ZOOM_LEVEL, {
          animate: true,
        });
      }
    } else {
      alert(state.error.message);
    }
  };

  useEffect(() => {
    if (mapRef.current && nearestStation) {
      const bounds: [number, number][] = [
        [userLocation.lat, userLocation.lng],
        [nearestStation.coordinates.lat, nearestStation.coordinates.lng],
      ];
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [nearestStation]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const route = await getDistanceBetweenPoints(
          userLocation,
          nearestStation.coordinates
        );

        setRouteCoords(route.coordinates);
      } catch (error) {
        console.log("Lỗi lấy tuyến đường", error);
      }
    };
    fetchRoute();
  }, [userLocation, nearestStation]);

  return (
    <div className="w-full h-screen relative">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={ZOOM_LEVEL}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker người dùng */}
        {location.loaded && !location.error && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Bạn đang ở đây</Popup>
          </Marker>
        )}

        {/* Marker các trạm */}
        {stations.map((station) => {
          const isNearest = station.id === nearestStation.id;
          return (
            <Marker
              key={station.id}
              position={[station.coordinates.lat, station.coordinates.lng]}
            >
              <Popup>
                <b>{station.name}</b>
                <br />
                {station.address}
                {isNearest && (
                  <div style={{ color: "red" }}>⭐ Trạm gần nhất</div>
                )}
              </Popup>
            </Marker>
          );
        })}

        <button
          onClick={showCurrentLocation}
          className="absolute bottom-5 right-5 z-[9999] bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200"
          title="Hiện vị trí của tôi"
        >
          <FaCrosshairs size={20} />
        </button>

        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: "blue",
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
