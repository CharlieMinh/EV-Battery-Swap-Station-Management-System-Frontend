import { useLocation, useNavigate } from "react-router-dom";
import {
  Coordinates,
  findNearestStation,
  getDistanceBetweenPoints,
  Station,
} from "./ormUtils";
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
}

export default function MapView() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const location = useGeoLocation();
  const mapRef = useRef<Map | null>(null);
  const ZOOM_LEVEL = 14;

  const [nearestStation, setNearestStation] = useState<
    (Station & { distance: number }) | null
  >(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // kiểm tra nếu không có state (ví dụ reload F5)
  useEffect(() => {
    if (!state) {
      navigate("/");
    }
  }, [state, navigate]);

  if (!state) return null;

  const { userLocation, stations } = state as MapState;

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
    setIsLoading(true);
    setNearestStation(null);
    setRouteCoords([]);

    const findAndSetNearestStation = async () => {
      if (userLocation && stations.length > 0) {
        const nearest = await findNearestStation(userLocation, stations);
        setNearestStation(nearest);

        if (!nearest) {
          console.warn("Không tìm thấy trạm gần nhất.");
          setIsLoading(false); // Kết thúc loading
        }
      } else {
        setIsLoading(false);
      }
    };
    findAndSetNearestStation();
  }, [userLocation, stations]);

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
      if (!nearestStation) {
        setRouteCoords([]);
        return;
      }

      try {
        const route = await getDistanceBetweenPoints(
          userLocation,
          nearestStation.coordinates
        );

        setRouteCoords(route.coordinates);
        setIsLoading(false);
      } catch (error) {
        console.log("Lỗi lấy tuyến đường", error);
        setIsLoading(false);
      }
    };
    if (nearestStation) {
      fetchRoute();
    }
  }, [userLocation, nearestStation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-gray-100">
        <div className="text-center">
          {/* SVG Spinner (sử dụng Tailwind CSS) */}
          <svg
            className="animate-spin h-8 w-8 text-orange-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg text-gray-700">
            Đang tìm trạm gần nhất và tính toán đường đi...
          </p>
        </div>
      </div>
    );
  }

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
          const isNearest = station.id === nearestStation?.id;
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
