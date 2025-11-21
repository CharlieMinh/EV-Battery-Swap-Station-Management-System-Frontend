import { useLocation, useNavigate } from "react-router-dom";
import { findNearestStation, getDistanceBetweenPoints } from "./ormUtils";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import useGeoLocation from "./useGeoLocation";
import { Map } from "leaflet";
import { FaCrosshairs } from "react-icons/fa";
import { ArrowLeft } from "lucide-react";
import { Coordinates, Station } from "@/services/admin/stationService";
import { StationDetail } from "./StationDetail";
import { useLanguage } from "../LanguageContext";
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
  const { t } = useLanguage();

  const [nearestStation, setNearestStation] = useState<
    (Station & { distance: number }) | null
  >(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );
  const handleBookFromMap = (stationId: string) => {
    navigate('/driver', {
      state: {
        initialSection: 'map',
        preSelectedStationId: stationId
      }
    });
  };

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

        if (nearest) {
          setNearestStation(nearest);
          setSelectedStationId(nearest.id as string);
        } else {
          setNearestStation(null);
          setSelectedStationId(null);
        }
      }
      setIsLoading(false);
    };
    findAndSetNearestStation();
  }, [userLocation, stations]);

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

  useEffect(() => {
    if (mapRef.current && routeCoords.length > 0) {
      const bounds = routeCoords.map(([lat, lng]) => [lat, lng]) as [
        number,
        number
      ][];
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoords]);

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
      {/* Nút Back */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-5 left-5 z-[9999] bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200"
        title={t("common.back")}
      >
        <ArrowLeft size={20} />
      </button>

      {selectedStationId && (
        <div className="absolute top-5 left-20 z-[9999]">
          <StationDetail
            stationId={selectedStationId}
            onClose={() => setSelectedStationId(null)}
          />
        </div>
      )}
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={ZOOM_LEVEL}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker người dùng với icon đặc biệt */}
        {location.loaded && !location.error && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: "custom-user-marker",
              html: `<div style="background-color: #3b82f6; border: 3px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>{t("map.yourLocation")}</Popup>
          </Marker>
        )}

        {/* Marker các trạm */}
        {stations.map((station) => {
          const isNearest = station.name === nearestStation?.name;
          return (
            <Marker
              key={String(station?.name)}
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

        {/* Zoom Controls - Bottom Left */}
        <div className="absolute bottom-5 left-5 z-[9999] flex flex-col gap-2">
          <button
            onClick={() => {
              if (mapRef.current) {
                const currentZoom = mapRef.current.getZoom();
                mapRef.current.setZoom(currentZoom + 1);
              }
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200"
            title="Zoom In"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button
            onClick={() => {
              if (mapRef.current) {
                const currentZoom = mapRef.current.getZoom();
                mapRef.current.setZoom(currentZoom - 1);
              }
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200"
            title="Zoom Out"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14"/>
            </svg>
          </button>
        </div>

        {/* Current Location Button - Bottom Right */}
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
        {stations.map((station) => {
          const isNearest = station.name === nearestStation?.name;
          return (
            <Marker
              key={station.id}
              position={[station.coordinates.lat, station.coordinates.lng]}
              eventHandlers={{
                click: () => {
                  setSelectedStationId(station.id); // cập nhật trạm được chọn
                },
              }}
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
      </MapContainer>
    </div>
  );
}
