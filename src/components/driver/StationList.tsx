import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Clock, Phone, Search, Filter } from "lucide-react";
import { useLanguage } from "../LanguageContext";


export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  isActive: boolean;
  openTime: string;
  closeTime: string;
  phoneNumber: string | null;
  primaryImageUrl: string | null;
  isOpenNow: boolean;
}

interface StationListProps {
  stations: Station[] | null;
  selectedStation: string | null;
  searchQuery: string;
  onStationSelect: (stationId: string) => void;
  onSearchChange: (query: string) => void;
  onBooking: () => void;
}

export function StationList({
  stations,
  selectedStation,
  searchQuery,
  onStationSelect,
  onSearchChange,
  onBooking,
}: StationListProps) {
  const { t } = useLanguage();

  // Hiển thị thông báo khi không có trạm nào
  if (!stations || stations.length === 0) {
    return (
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-500 font-bold">{t("driver.availableStations")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">{t("driver.noStationsFound")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-orange-500 rounded-lg">
      <CardHeader>
        <CardTitle className="text-orange-500 font-bold">{t("driver.availableStations")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stations.map((station) => (
            <Card
              key={station.id}
              className={`cursor-pointer transition-all duration-200 overflow-hidden ${selectedStation === station.id
                ? "border-2 border-orange-500 shadow-lg"
                : "border border-gray-200 hover:shadow-md"
                }`}
              onClick={() => onStationSelect(station.id)}
            >

              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-orange-600">{station.name}</h3>
                    <p className="text-sm text-gray-500">{station.address}, {station.city}</p>
                  </div>
                  {/* === HIỂN THỊ TRẠNG THÁI "MỞ CỬA" / "ĐÓNG CỬA" === */}
                  <Badge variant={station.isOpenNow ? "default" : "destructive"} className={station.isOpenNow ? "bg-green-500" : ""}>
                    {t(station.isOpenNow ? "Đang mở cửa" : "Đã đóng cửa")}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-700">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-orange-500" />
                    <span>Giờ hoạt động: {station.openTime.substring(0, 5)} - {station.closeTime.substring(0, 5)}</span>
                  </div>
                  {station.phoneNumber && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-orange-500" />
                      <span>{station.phoneNumber}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end items-center mt-3">
                  <Button
                    className="bg-orange-500 hover:bg-orange-600"
                    size="sm"
                    disabled={!station.isActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBooking();
                    }}
                  >
                    {t("driver.reserve")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}