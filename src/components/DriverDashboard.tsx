import React, { useState, useEffect } from "react";
import axios from "axios";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useLanguage } from "../components/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import {
  MapPin,
  Battery,
  History,
  User as UserIcon,
  LogOut,
  Zap,
  Bell,
  HeadphonesIcon,
  Car,
} from "lucide-react";
import { User } from "../App";

// Import driver components
import { StationMap } from "../components/driver/StationMap";
import { StationList } from "../components/driver/StationList";
import { BookingWizard } from "../components/driver/BookingWizard";
import { QRCodeDialog } from "../components/driver/QRCodeDialog";
import { SwapStatus } from "../components/driver/SwapStatus";
import { SubscriptionStatus } from "../components/driver/SubscriptionStatus";
import { SwapHistory } from "../components/driver/SwapHistory";
import { DriverProfile } from "../components/driver/DriverProfile";
import { DriverSupport } from "../components/driver/DriverSupport";
import { MyVehicle } from "./driver/MyVehicle";

interface DriverPortalPageProps {
  user: User;
  onLogout: () => void;
}

export function DriverPortalPage({ user, onLogout }: DriverPortalPageProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("swap");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingDialog, setBookingDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [profileName, setProfileName] = useState<string>(user.name);
  const [profileEmail, setProfileEmail] = useState<string>(user.email);
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  const [swapHistory, setSwapHistory] = useState<any>(null);
  const [recentSwaps, setRecentSwaps] = useState<Swap[]>([]);

  interface Swap {
    id: string;
    transactionNumber: string;
    stationName: string;
    stationAddress: string;
    completedAt: string;
    totalAmount: number;
    status: string;
    vehicleLicensePlate: string;
    batteryHealthIssued: number;
    batteryHealthReturned: number;
    isPaid: boolean;
    notes?: string;
  }

  const stations = [
    {
      id: "1",
      name: "Downtown Hub",
      address: "123 Main St, City Center",
      distance: "0.8 km",
      availableBatteries: 12,
      totalSlots: 20,
      rating: 4.8,
      pricePerSwap: 25,
      status: "open" as const,
      waitTime: "< 5 min",
      hours: "24/7",
    },
    {
      id: "2",
      name: "Mall Station",
      address: "456 Shopping Ave",
      distance: "1.2 km",
      availableBatteries: 8,
      totalSlots: 15,
      rating: 4.6,
      pricePerSwap: 25,
      status: "open" as const,
      waitTime: "10-15 min",
      hours: "6AM - 11PM",
    },
    {
      id: "3",
      name: "Airport Terminal",
      address: "789 Airport Rd",
      distance: "5.4 km",
      availableBatteries: 0,
      totalSlots: 25,
      rating: 4.9,
      pricePerSwap: 30,
      status: "maintenance" as const,
      waitTime: "Closed",
      hours: "Maintenance",
    },
  ];

  const vehicles = [
    {
      id: "1",
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      vin: "ABC123456",
      batteryModel: "TM3-75kWh",
    },
    {
      id: "2",
      make: "BMW",
      model: "iX3",
      year: 2022,
      vin: "DEF789012",
      batteryModel: "BMW-80kWh",
    },
  ];



  useEffect(() => {
    async function fetchSwapHistory() {
      try {
        // ✅ Nếu showAll = false → chỉ lấy 3 bản ghi đầu
        // ✅ Nếu showAll = true → gọi API all=true để lấy hết
        const url = showAll
          ? "http://localhost:5194/api/v1/swaps/mine?all=true"
          : "http://localhost:5194/api/v1/swaps/mine?page=1&pageSize=3";

        const response = await axios.get(url, { withCredentials: true });

        setSwapHistory(response.data);                // lưu cả object
        setRecentSwaps(response.data.transactions);
      } catch (error: any) {
        console.error("Lỗi khi lấy lịch sử đổi pin:", error);
      }
    }

    fetchSwapHistory();
  }, [showAll]);


  const subscriptionPlan = {
    name: "Monthly Unlimited",
    swapsUsed: 12,
    swapsLimit: 999,
    renewDate: "2024-02-15",
    price: 149,
  };

  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  const handleBooking = () => {
    if (selectedStation) {
      setBookingDialog(true);
      setBookingStep(1);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center p-2 bg-orange-500 ">
              <div className="inline-flex items-center justify-center w-8 h-8 mr-3">
                <img
                  src="src/assets/logoEV2.png "
                  alt="FPTFAST Logo"
                  className="w-10 h-9 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-white">
                  F P T F A S T
                </span>
                <span className="text-sm font-medium text-white">Driver</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="flex flex-col flex-1">
            <SidebarGroup className="flex-1">
              <SidebarGroupContent className="h-full">
                <SidebarMenu className="flex flex-col h-full">
                  {/* <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("map")}
                      isActive={activeSection === "map"}
                      className="h-[60px]"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t("driver.findStations")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem> */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("mycar")}
                      isActive={activeSection === "mycar"}
                      className="h-[60px]"
                    >
                      <Car className="w-4 h-4" />
                      <span>{t("driver.mycar")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("swap")}
                      isActive={activeSection === "swap"}
                      className="h-[60px]"
                    >
                      <Battery className="w-4 h-4" />
                      <span>{t("driver.swap")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("history")}
                      isActive={activeSection === "history"}
                      className="h-[60px]"
                    >
                      <History className="w-4 h-4" />
                      <span>{t("driver.history")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("profile")}
                      isActive={activeSection === "profile"}
                      className="h-[60px]"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{t("driver.profile")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("support")}
                      isActive={activeSection === "support"}
                      className="h-[60px]"
                    >
                      <HeadphonesIcon className="w-4 h-4" />
                      <span>{t("driver.support")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="flex items-center p-2 space-x-2 min-w-0 bg-gray-100">
              <Avatar className="shrink-0">
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="flex justify-between items-center h-16 px-4">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-orange-600">
                  {/* {activeSection === "map" && t("driver.findStations")} */}
                  {activeSection === "mycar" && t("driver.mycar")}
                  {activeSection === "swap" && t("driver.swap")}
                  {activeSection === "history" && t("driver.history")}
                  {activeSection === "profile" && t("driver.profile")}
                  {activeSection === "support" && t("driver.support")}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Button variant="ghost" size="icon">
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* {activeSection === "map" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <StationMap stations={stations} />
                  <StationList
                    stations={stations}
                    selectedStation={selectedStation}
                    searchQuery={searchQuery}
                    onStationSelect={setSelectedStation}
                    onSearchChange={setSearchQuery}
                    onBooking={handleBooking}
                  />
                </div>
              </div>
            )} */}
            {activeSection === "mycar" && (
              <div className="space-y-6">
                <div>
                  <MyVehicle vehicles={vehicles}></MyVehicle>
                </div>
              </div>
            )}
            {activeSection === "swap" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SwapStatus onQRDialog={() => setQrDialog(true)} />
                  <SubscriptionStatus subscriptionPlan={subscriptionPlan} />
                </div>
              </div>
            )}

            {activeSection === "history" && (
              <div className="space-y-6">
                <SwapHistory
                  recentSwaps={recentSwaps}
                  swapHistory={swapHistory}
                  showAll={showAll}
                  setShowAll={setShowAll}
                />
              </div>
            )}


            {activeSection === "profile" && (
              <DriverProfile
                user={user}
                profileName={profileName}
                profileEmail={profileEmail}
                profilePhone={profilePhone}
                onNameChange={setProfileName}
                onEmailChange={setProfileEmail}
                onPhoneChange={setProfilePhone}
              />
            )}

            {activeSection === "support" && <DriverSupport />}
          </main>
        </SidebarInset>
      </div>

      {/* Dialogs */}
      <BookingWizard
        isOpen={bookingDialog}
        onClose={() => setBookingDialog(false)}
        bookingStep={bookingStep}
        selectedVehicle={selectedVehicle}
        selectedTime={selectedTime}
        selectedStation={selectedStation}
        vehicles={vehicles}
        stations={stations}
        timeSlots={timeSlots}
        onStepChange={setBookingStep}
        onVehicleSelect={setSelectedVehicle}
        onTimeSelect={setSelectedTime}
        onQRDialog={() => setQrDialog(true)}
      />

      <QRCodeDialog isOpen={qrDialog} onClose={() => setQrDialog(false)} />
    </SidebarProvider>
  );
}
