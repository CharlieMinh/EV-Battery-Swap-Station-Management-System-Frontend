import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Battery, Clock, MapPin, Star, Filter, Search } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface Station {
  id: string;
  name: string;
  address: string;
  distance: string;
  availableBatteries: number;
  totalSlots: number;
  rating: number;
  pricePerSwap: number;
  status: "open" | "maintenance";
  waitTime: string;
  hours: string;
}

interface StationListProps {
  stations: Station[];
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

  return (
    <Card className="border-2 border-orange-100 rounded-lg">
      <CardHeader >
        <CardTitle className="text-orange-500 font-bold">{t("driver.availableStations")}</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> {t("driver.filter")}
          </Button>
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <Input
              placeholder={t("driver.searchStations")}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stations.map((station) => (
            <Card
              key={station.id}
              className={`cursor-pointer transition-colors ${selectedStation === station.id
                ? "border-2 border-orange-500 rounded-lg"
                : "border border-gray-500 rounded-lg"
                }`}
              onClick={() => onStationSelect(station.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium font-bold text-orange-500">{station.name}</h3>
                    <p className="text-sm text-gray-500">{station.address}</p>
                  </div>
                  <Badge
                    variant={
                      station.status === "open" ? "default" : "destructive"
                    }
                  >
                    {t(`driver.${station.status}`)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Battery className="w-4 h-4 mr-1 text-green-500" />
                    {station.availableBatteries}/{station.totalSlots}{" "}
                    {t("driver.available")}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-blue-500" />
                    {station.waitTime}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-purple-500" />
                    {station.distance}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {station.rating}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-medium">
                    ${station.pricePerSwap}/swap
                  </span>
                  <Button
                    size="sm"
                    disabled={station.status !== "open"}
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
