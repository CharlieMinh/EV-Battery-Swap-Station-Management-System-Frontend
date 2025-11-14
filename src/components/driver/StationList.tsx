import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Clock, Phone, Search, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";


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

  const [searchText, setSearchText] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTimeInput, setFilterTimeInput] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const filteredStations = stations?.filter((station) => {
    const searchLower = searchText.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      station.name.toLowerCase().includes(searchLower) ||
      station.address.toLowerCase().includes(searchLower) ||
      station.city.toLowerCase().includes(searchLower);

    let matchesStatus = true;
    if (filterStatus === 'open') {
      matchesStatus = station.isOpenNow;
    } else if (filterStatus === 'closed') {
      matchesStatus = !station.isOpenNow;
    }

    let matchesTime = true;
    if (filterTimeInput.trim()) {
      const inputParts = filterTimeInput.trim().split(':');
      const inputHour = parseInt(inputParts[0]);
      const inputMinute = inputParts.length > 1 ? parseInt(inputParts[1]) : 0;

      if (!isNaN(inputHour) && inputHour >= 0 && inputHour <= 23 && inputMinute >= 0 && inputMinute <= 59) {
        const inputTimeInMinutes = inputHour * 60 + inputMinute;

        const openParts = station.openTime.split(':');
        const openHour = parseInt(openParts[0]);
        const openMinute = parseInt(openParts[1]);
        const openTimeInMinutes = openHour * 60 + openMinute;

        const closeParts = station.closeTime.split(':');
        const closeHour = parseInt(closeParts[0]);
        const closeMinute = parseInt(closeParts[1]);
        const closeTimeInMinutes = closeHour * 60 + closeMinute;

        if (closeTimeInMinutes >= openTimeInMinutes) {
          matchesTime = inputTimeInMinutes >= openTimeInMinutes && inputTimeInMinutes <= closeTimeInMinutes;
        } else {
          matchesTime = inputTimeInMinutes >= openTimeInMinutes || inputTimeInMinutes <= closeTimeInMinutes;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesTime;
  }) || [];

  const totalPages = Math.ceil(filteredStations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStations = filteredStations.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterStatus, filterTimeInput]);

  if (!stations || stations.length === 0) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              {t("driver.availableStations")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("driver.stationList.subtitle")}
            </p>
          </div>
          <Card className="border border-orange-500 rounded-lg">
            <CardHeader>
              <CardTitle className="text-orange-500 font-bold">{t("driver.availableStations")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500">{t("driver.noStationsFound")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            {t("driver.availableStations")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("driver.stationList.subtitle")}
          </p>
        </div>
        <Card className="border-2 border-orange-500 rounded-lg shadow-lg">


          <CardContent className="p-4">
            <div className="space-y-4 mb-6 bg-gray-50 p-4 rounded-lg border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("driver.stationList.searchPlaceholder")}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t("driver.stationList.filter.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("driver.stationList.filter.statusAll")}</SelectItem>
                    <SelectItem value="open">{t("driver.stationList.filter.statusOpen")}</SelectItem>
                    <SelectItem value="closed">{t("driver.stationList.filter.statusClosed")}</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    placeholder={t("driver.stationList.filter.timePlaceholder")}
                    value={filterTimeInput}
                    onChange={(e) => setFilterTimeInput(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {filterTimeInput && (
                    <button
                      onClick={() => setFilterTimeInput('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  {t("driver.stationList.filter.summaryShown")} <span className="font-semibold text-orange-600">{currentStations.length}</span> / {filteredStations.length} {t("driver.availableStations").toLowerCase()}
                  {filteredStations.length !== stations.length && (
                    <span className="text-gray-400"> {t("driver.stationList.filter.summaryFilteredFrom")} {stations.length}</span>
                  )}
                </p>
                {(searchText || filterStatus !== 'all' || filterTimeInput) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchText('');
                      setFilterStatus('all');
                      setFilterTimeInput('');
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("driver.stationList.filter.clear")}
                  </Button>
                )}
              </div>
            </div>

            {filteredStations.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-lg font-medium text-gray-500">{t("driver.stationList.empty.title")}</p>
                <p className="text-sm text-gray-400 mt-1">{t("driver.stationList.empty.suggestion")}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentStations.map((station) => (
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
                          <Badge variant={station.isOpenNow ? "default" : "destructive"} className={station.isOpenNow ? "bg-green-500" : ""}>
                            {station.isOpenNow ? t("driver.stationStatus.open") : t("driver.stationStatus.closed")}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4 text-sm text-gray-700">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-orange-500" />
                            <span>{t("driver.operatingHours")}: {station.openTime.substring(0, 5)} - {station.closeTime.substring(0, 5)}</span>
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

                {totalPages > 1 && (
                  <div className="mt-6 bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {t("driver.stationList.pagination.page")} {currentPage} / {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          {t("driver.stationList.pagination.prev")}
                        </Button>

                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={currentPage === pageNum ? "bg-orange-500 hover:bg-orange-600" : ""}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          {t("driver.stationList.pagination.next")}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}