import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { MapPin, Navigation } from "lucide-react";
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

interface StationMapProps {
  stations: Station[];
}

export function StationMap({ stations }: StationMapProps) {
  const { t } = useLanguage();

  return (
    <Card className="lg:col-span-1 border-2 border-orange-100 rounded-lg">
      <CardHeader>
        <CardTitle className="text-orange-500 font-bold">Nearby Stations</CardTitle>
        <CardDescription>
          Find and reserve battery swap stations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-green-50 rounded-lg h-64 flex items-center justify-center mb-4 relative">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">{t("driver.interactiveMap")}</p>
            <p className="text-sm text-gray-500">
              {t("driver.showingStations")} {stations.length}{" "}
              {t("driver.stationsNearby")}
            </p>
          </div>
          {/* Mock map pins */}
          <div className="absolute top-4 left-8 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute top-12 right-12 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-8 left-16 w-3 h-3 bg-red-500 rounded-full"></div>
        </div>
        <Button className="w-full">
          <Navigation className="w-4 h-4 mr-2" />
          {t("driver.useMyLocation")}
        </Button>
      </CardContent>
    </Card>
  );
}
