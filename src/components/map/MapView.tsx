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
import { Map as LeafletMap } from "leaflet";
import { FaCrosshairs } from "react-icons/fa";
import { ArrowLeft, Battery, AlertCircle, Navigation, MapPin, ChevronRight, X, List } from "lucide-react";
import { Coordinates, Station } from "@/services/admin/stationService";
import { StationDetail } from "./StationDetail";
import { useLanguage } from "../LanguageContext";
import { countBatteriesForMultipleStations } from "@/services/batteryPublicService";
interface MapState {
  userLocation: Coordinates;
  stations: Station[];
}

export default function MapView() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const location = useGeoLocation();
  const mapRef = useRef<LeafletMap | null>(null);
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
  // State để lưu số pin của từng trạm
  const [batteryCounts, setBatteryCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [isLoadingBatteries, setIsLoadingBatteries] = useState(true);
  // State để lưu trạm được chọn để chỉ đường (có thể khác trạm gần nhất)
  const [selectedRouteStation, setSelectedRouteStation] = useState<
    (Station & { distance: number }) | null
  >(null);
  // State để lưu khoảng cách của tất cả trạm
  const [stationDistances, setStationDistances] = useState<
    Map<string, number>
  >(new Map());
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false);
  // State để toggle panel chọn trạm
  const [showStationListPanel, setShowStationListPanel] = useState(true);
  const handleBookFromMap = (stationId: string) => {
    navigate('/driver', {
      state: {
        initialSection: 'map',
        preSelectedStationId: stationId
      }
    });
  };

  // Hàm để chọn trạm và vẽ route đến đó
  const handleSelectRoute = async (station: Station) => {
    try {
      // Tính khoảng cách nếu chưa có
      let distance = stationDistances.get(station.id as string);
      if (distance === undefined) {
        const route = await getDistanceBetweenPoints(
          userLocation,
          station.coordinates
        );
        distance = route.distance;
        setStationDistances((prev) => {
          const newMap = new Map(prev);
          newMap.set(station.id as string, distance!);
          return newMap;
        });
      }

      const stationWithDistance = { ...station, distance };
      setSelectedRouteStation(stationWithDistance);
      
      // Cập nhật StationDetail để hiển thị trạm mới được chọn
      setSelectedStationId(station.id as string);
      
      // Fly to station
      if (mapRef.current) {
        mapRef.current.flyTo(
          [station.coordinates.lat, station.coordinates.lng],
          15,
          { animate: true, duration: 1 }
        );
      }
    } catch (error) {
      console.error("Error selecting route:", error);
    }
  };

  // Format khoảng cách
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // Lấy danh sách TẤT CẢ trạm, sắp xếp theo khoảng cách (trạm đang được chọn lên đầu)
  const getAllStations = (): (Station & { distance: number; batteryCount: number })[] => {
    const allStations = stations
      .map((station) => {
        const batteryCount = batteryCounts.get(station.id as string) ?? 0;
        const distance = stationDistances.get(station.id as string) ?? Infinity;
        return { ...station, distance, batteryCount };
      })
      .sort((a, b) => {
        // Trạm đang được chọn để chỉ đường lên đầu
        const aIsSelected = selectedRouteStation?.id === a.id;
        const bIsSelected = selectedRouteStation?.id === b.id;
        if (aIsSelected && !bIsSelected) return -1;
        if (!aIsSelected && bIsSelected) return 1;
        // Sau đó sắp xếp theo khoảng cách
        return a.distance - b.distance;
      });
    
    return allStations;
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

  // Tạo custom marker icon chuyên nghiệp với badge số pin
  const createStationMarkerIcon = (batteryCount: number, isNearest: boolean = false) => {
    const isOutOfStock = batteryCount === 0;
    const isLowStock = batteryCount > 0 && batteryCount <= 3;
    
    // Màu sắc dựa trên số lượng pin
    let markerColor = "#f97316"; // Cam mặc định (có pin)
    let badgeBg = "#ea580c";
    let badgeTextColor = "#ffffff";
    
    if (isOutOfStock) {
      markerColor = "#ef4444"; // Đỏ (hết pin)
      badgeBg = "#dc2626";
    } else if (isLowStock) {
      markerColor = "#f59e0b"; // Vàng cam (ít pin)
      badgeBg = "#d97706";
    }
    
    // Nếu là trạm gần nhất, thêm border highlight
    const borderStyle = isNearest 
      ? "border: 3px solid #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);"
      : "border: 3px solid white;";

    return L.divIcon({
      className: "custom-station-marker",
      html: `
        <div style="position: relative; display: inline-block; cursor: pointer;">
          <!-- Marker pin icon với animation -->
          <div style="
            background: linear-gradient(135deg, ${markerColor} 0%, ${badgeBg} 100%);
            width: 40px;
            height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            ${borderStyle}
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            position: relative;
            transition: all 0.3s ease;
          ">
            <div style="
              transform: rotate(45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>
          <!-- Badge số pin với animation -->
          <div style="
            position: absolute;
            top: -10px;
            right: -10px;
            background: ${badgeBg};
            color: ${badgeTextColor};
            border-radius: 14px;
            min-width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            padding: 0 8px;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          ">
            ${isOutOfStock ? "0" : batteryCount}
          </div>
          ${isOutOfStock ? `
          <!-- Warning indicator cho trạm hết pin -->
          <div style="
            position: absolute;
            top: -5px;
            left: -5px;
            width: 16px;
            height: 16px;
            background: #ef4444;
            border-radius: 50%;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">
            <span style="color: white; font-size: 10px;">⚠</span>
          </div>
          ` : ""}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
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

  // Tính khoảng cách cho tất cả trạm (để hiển thị trong danh sách)
  useEffect(() => {
    const calculateAllDistances = async () => {
      if (!userLocation || stations.length === 0) return;

      setIsCalculatingDistances(true);
      const distances = new Map<string, number>();

      // Tính khoảng cách cho tất cả trạm (song song để nhanh hơn)
      const distancePromises = stations.map(async (station) => {
        try {
          const route = await getDistanceBetweenPoints(
            userLocation,
            station.coordinates
          );
          distances.set(station.id as string, route.distance);
        } catch (error) {
          console.warn(`Error calculating distance for ${station.name}:`, error);
          distances.set(station.id as string, Infinity);
        }
      });

      await Promise.all(distancePromises);
      setStationDistances(distances);
      setIsCalculatingDistances(false);
    };

    calculateAllDistances();
  }, [userLocation, stations]);

  // Vẽ route đến trạm được chọn (selectedRouteStation hoặc nearestStation)
  useEffect(() => {
    const fetchRoute = async () => {
      const targetStation = selectedRouteStation || nearestStation;
      
      if (!targetStation) {
        setRouteCoords([]);
        return;
      }

      try {
        const route = await getDistanceBetweenPoints(
          userLocation,
          targetStation.coordinates
        );

        setRouteCoords(route.coordinates);
        setIsLoading(false);
      } catch (error) {
        console.log("Lỗi lấy tuyến đường", error);
        setIsLoading(false);
      }
    };
    
    if (selectedRouteStation || nearestStation) {
      fetchRoute();
    }
  }, [userLocation, nearestStation, selectedRouteStation]);

  useEffect(() => {
    if (mapRef.current && routeCoords.length > 0) {
      const bounds = routeCoords.map(([lat, lng]) => [lat, lng]) as [
        number,
        number
      ][];
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoords]);

  // Fetch battery counts cho tất cả stations khi map load (tối ưu - chỉ 1 API call)
  useEffect(() => {
    const fetchBatteryCounts = async () => {
      if (!stations || stations.length === 0) {
        setIsLoadingBatteries(false);
        return;
      }

      try {
        setIsLoadingBatteries(true);
        const stationIds = stations.map((s) => s.id as string);
        const counts = await countBatteriesForMultipleStations(stationIds);
        setBatteryCounts(counts);
      } catch (error) {
        console.error("Error fetching battery counts:", error);
        // Nếu lỗi, set tất cả = 0 để hiển thị "Hết pin"
        const emptyMap = new Map<string, number>();
        stations.forEach((s) => emptyMap.set(s.id as string, 0));
        setBatteryCounts(emptyMap);
      } finally {
        setIsLoadingBatteries(false);
      }
    };

    fetchBatteryCounts();
  }, [stations]);

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

      {/* Station Detail và Panel chọn trạm - Bên trái */}
      <div className="absolute top-5 left-5 z-[9999] flex flex-col gap-3">
        {selectedStationId && (
          <StationDetail
            stationId={selectedStationId}
            onClose={() => setSelectedStationId(null)}
          />
        )}

        {/* Panel danh sách trạm có pin - Bên trái, dưới StationDetail - Luôn có sẵn để user chọn trạm khác */}
        {!isLoadingBatteries && stations.length > 0 && (
          <div className={`w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
            showStationListPanel ? 'opacity-100 max-h-[50vh]' : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
            {/* Header với nút toggle */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation size={18} />
                  <h3 className="font-bold text-base">Chọn trạm khác</h3>
                </div>
                <button
                  onClick={() => setShowStationListPanel(!showStationListPanel)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={showStationListPanel ? "Ẩn danh sách" : "Hiện danh sách"}
                >
                  <X size={18} />
                </button>
              </div>
              {nearestStation && (
                <div className="text-xs mt-2 opacity-90 flex items-center gap-1">
                  {(() => {
                    const nearestBatteryCount = batteryCounts.get(nearestStation.id as string) ?? 0;
                    return nearestBatteryCount === 0 
                      ? "⚠️ Trạm gần nhất hết pin"
                      : ` Gần nhất: ${formatDistance(nearestStation.distance)}`;
                  })()}
                </div>
              )}
            </div>

            {/* Danh sách trạm */}
            <div className="max-h-[calc(50vh-100px)] overflow-y-auto">
              {isCalculatingDistances ? (
                <div className="p-8 text-center">
                  <svg
                    className="animate-spin h-8 w-8 text-orange-500 mx-auto mb-2"
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
                  <p className="text-gray-600 text-sm">Đang tính toán khoảng cách...</p>
                </div>
              ) : (
                <>
                  {getAllStations().length === 0 ? (
                    <div className="p-8 text-center">
                      <AlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="text-gray-600">Không có trạm nào</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {getAllStations().map((station) => {
                        const isSelected = selectedRouteStation?.id === station.id;
                        const isNearest = nearestStation?.id === station.id;
                        const isLowStock = station.batteryCount > 0 && station.batteryCount <= 3;
                        const isOutOfStock = station.batteryCount === 0;

                        return (
                          <div
                            key={station.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                              isSelected 
                                ? "bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-500" 
                                : ""
                            } ${isOutOfStock ? "opacity-75" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className={`font-semibold truncate ${
                                    isSelected ? "text-orange-700" : "text-gray-900"
                                  }`}>
                                    {station.name}
                                  </h4>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                      <Navigation size={12} />
                                      Đang chỉ đường
                                    </span>
                                  )}
                                  {!isSelected && isNearest && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                      Gần nhất
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2 truncate">
                                  {station.address}
                                </p>
                                
                                <div className="flex items-center gap-4 text-xs flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span className="text-gray-600">
                                      {formatDistance(station.distance)}
                                    </span>
                                  </div>
                                  <div className={`flex items-center gap-1 ${
                                    isOutOfStock 
                                      ? "text-red-600" 
                                      : isLowStock 
                                      ? "text-yellow-600" 
                                      : "text-green-600"
                                  }`}>
                                    <Battery size={14} />
                                    <span className="font-medium">
                                      {isOutOfStock ? "Hết pin" : `${station.batteryCount} pin`}
                                    </span>
                                    {isLowStock && !isOutOfStock && (
                                      <span className="text-yellow-500">⚠️</span>
                                    )}
                                    {isOutOfStock && (
                                      <AlertCircle size={12} className="text-red-500" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleSelectRoute(station)}
                                disabled={isSelected}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex-shrink-0 ${
                                  isSelected
                                    ? "bg-orange-500 text-white shadow-md cursor-default"
                                    : isOutOfStock
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                }`}
                                title={isOutOfStock ? "Trạm này hết pin" : isSelected ? "Đang chỉ đường đến trạm này" : "Chỉ đường đến trạm này"}
                              >
                                <Navigation size={16} />
                                {isSelected ? "Đang chỉ đường" : "Chỉ đường"}
                                {!isSelected && <ChevronRight size={16} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Nút toggle panel khi đóng */}
        {!isLoadingBatteries && stations.length > 0 && !showStationListPanel && (
          <button
            onClick={() => setShowStationListPanel(true)}
            className="w-96 max-w-[calc(100vw-2rem)] bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 rounded-2xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
            title="Hiện danh sách trạm"
          >
            <List size={18} />
            <span>Chọn trạm khác</span>
          </button>
        )}
      </div>
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

        {/* Marker các trạm với số pin - Chỉ render khi đã load xong battery data */}
        {!isLoadingBatteries && stations.map((station) => {
          const isNearest = station.name === nearestStation?.name;
          const isSelectedForRoute = selectedRouteStation?.id === station.id;
          const batteryCount = batteryCounts.get(station.id as string) ?? 0;
          const isOutOfStock = batteryCount === 0;
          const isLowStock = batteryCount > 0 && batteryCount <= 3;

          return (
            <Marker
              key={String(station?.name)}
              position={[station.coordinates.lat, station.coordinates.lng]}
              icon={createStationMarkerIcon(batteryCount, isNearest || isSelectedForRoute)}
              eventHandlers={{
                click: () => {
                  setSelectedStationId(station.id as string);
                  // Nếu click vào marker và trạm có pin, tự động chọn để chỉ đường
                  if (batteryCount > 0) {
                    handleSelectRoute(station);
                  }
                },
              }}
            >
              <Popup className="custom-popup">
                <div style={{ minWidth: "220px", padding: "4px" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <b style={{ fontSize: "16px", color: "#1f2937", display: "block", marginBottom: "4px" }}>
                      {station.name}
                    </b>
                    <span style={{ fontSize: "13px", color: "#6b7280", display: "block" }}>
                      {station.address}
                    </span>
                  </div>
                  
                  {/* Battery Status Card */}
                  <div style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: isOutOfStock ? "#fee2e2" : isLowStock ? "#fef3c7" : "#dcfce7",
                    borderRadius: "8px",
                    border: `2px solid ${isOutOfStock ? "#fca5a5" : isLowStock ? "#fcd34d" : "#86efac"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Battery 
                        size={18} 
                        style={{ 
                          color: isOutOfStock ? "#dc2626" : isLowStock ? "#d97706" : "#16a34a",
                          flexShrink: 0
                        }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: "14px", 
                          fontWeight: "600",
                          color: isOutOfStock ? "#dc2626" : isLowStock ? "#d97706" : "#16a34a",
                        }}>
                          {isOutOfStock 
                            ? "Hết pin" 
                            : isLowStock 
                            ? `Còn ${batteryCount} pin (sắp hết)` 
                            : `${batteryCount} pin sẵn có`}
                        </div>
                        {!isOutOfStock && (
                          <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                            {isLowStock ? "⚠️ Số lượng thấp" : "✓ Sẵn sàng"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isNearest && (
                    <div style={{
                      marginTop: "8px",
                      padding: "6px 10px",
                      backgroundColor: "#eff6ff",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}>
                      <span style={{ fontSize: "14px" }}>⭐</span>
                      <span style={{ fontSize: "12px", color: "#1e40af", fontWeight: "500" }}>
                        Trạm gần nhất
                      </span>
                    </div>
                  )}
                </div>
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
      </MapContainer>
    </div>
  );
}
