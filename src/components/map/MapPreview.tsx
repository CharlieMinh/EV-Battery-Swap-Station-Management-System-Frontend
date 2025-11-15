import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

type PreviewStation = {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
};

const previewStations: PreviewStation[] = [
  {
    id: "preview-1",
    name: "Trạm Trung Tâm",
    address: "Quận 1, TP. Hồ Chí Minh",
    coordinates: { lat: 10.7758439, lng: 106.7017555 },
  },
  {
    id: "preview-2",
    name: "Trạm Thủ Thiêm",
    address: "Thủ Thiêm, TP. Hồ Chí Minh",
    coordinates: { lat: 10.780889, lng: 106.729 },
  },
  {
    id: "preview-3",
    name: "Trạm Tân Sơn Nhất",
    address: "Sân bay Tân Sơn Nhất",
    coordinates: { lat: 10.813253, lng: 106.662035 },
  },
];

const previewUserLocation = {
  lat: 10.790178,
  lng: 106.707337,
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapPreview() {
  return (
    <div className="w-full h-full">
      <MapContainer
        center={[previewUserLocation.lat, previewUserLocation.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-2xl border border-orange-100 preview-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={[previewUserLocation.lat, previewUserLocation.lng]}
          radius={500}
          pathOptions={{
            color: "#fb923c",
            fillColor: "#fdba74",
            fillOpacity: 0.15,
            weight: 2,
          }}
        />

        <Marker position={[previewUserLocation.lat, previewUserLocation.lng]}>
          <Popup>Vị trí của bạn</Popup>
        </Marker>

        {previewStations.map((station) => (
          <Marker
            key={station.id}
            position={[station.coordinates.lat, station.coordinates.lng]}
          >
            <Popup>
              <div className="font-semibold text-sm text-gray-900">
                {station.name}
              </div>
              <p className="text-xs text-gray-600 mt-1">{station.address}</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

