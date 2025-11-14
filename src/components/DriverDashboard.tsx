import React, { useState, useEffect } from "react";
import axios from "axios";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
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
  Bell,
  HeadphonesIcon,
  Car,
  Pen,
  CreditCardIcon,
  Home,
  AlertCircle,
} from "lucide-react";
import { User } from "../App";
import { useLocation, useNavigate } from "react-router-dom";
import { StationList } from "../components/driver/StationList";
import { SubscriptionPlansPage } from "../components/driver/SubscriptionPlansPage";
import { BookingWizard } from "../components/driver/BookingWizard";
import { QRCodeDialog } from "../components/driver/QRCodeDialog";
import { SwapStatus } from "../components/driver/SwapStatus";
import { SubscriptionStatus } from "../components/driver/SubscriptionStatus";
import { SwapHistory } from "../components/driver/SwapHistory";
import { DriverProfile } from "../components/driver/DriverProfile";
import { MyVehicle } from "../components/driver/MyVehicle";
import { toast } from "react-toastify";
import { MyPaymentsPage } from "./driver/MyPaymentsPage";
import { ComplaintsList } from "./driver/ComplaintsList";

interface DriverDashboardProps {
  user: User;
  onLogout: () => void;
}

interface SubscriptionInfo {
  id: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isBlocked: boolean;
  vehicleId: string;
  currentMonthSwapCount: number;
  swapsLimit: number | null;
  subscriptionPlan: {
    name: string;
    maxSwapsPerMonth?: number;
  };
  vehicles: { id: string; plate: string; model: string; }[] | null;
  vehicle: { id: string; plate: string; model: string; } | null;
}

interface Slot {
  slotStartTime: string;
  slotEndTime: string;
  totalCapacity: number;
  currentReservations: number;
  isAvailable: boolean;
}
interface Vehicle {
  id: string;
  compatibleBatteryModelId: string;
  vin: string;
  plate: string;
  brand: string;
  vehicleModelFullName?: string;
  compatibleBatteryModelName?: string;
  photoUrl?: string;
}
interface Station {
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

export function DriverDashboard({ user, onLogout }: DriverDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("swap");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [qrDialog, setQrDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [subscriptionInfoList, setSubscriptionInfoList] = useState<SubscriptionInfo[]>([]);
  const [stations, setStations] = useState<Station[] | null>(null);

  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    const state = location.state as {
      initialSection?: string;
      selectedStation?: string;
      triggerAction?: string;
    };

    if (state?.initialSection) {
      setActiveSection(state.initialSection);
    }

    if (state?.triggerAction === "setBooking" && state?.selectedStation) {
      openBookingWizard(state.selectedStation);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const infoResponse = await axios.get(
          "http://localhost:5194/api/v1/subscriptions/mine/all",
          { withCredentials: true }
        );
        setSubscriptionInfoList(infoResponse.data);
        console.log("DATA (Tất cả các gói):", infoResponse.data);
      } catch (error) {
        console.error("Fetch subscription failed:", error);
        setSubscriptionInfoList([]);
      }
    };
    fetchSubscriptionData();
  }, []);

  const handleRefreshSubscriptions = async () => {
    try {
      const infoResponse = await axios.get(
        "http://localhost:5194/api/v1/subscriptions/mine/all",
        { withCredentials: true }
      );
      setSubscriptionInfoList(infoResponse.data);
      console.log("Refreshed subscriptions:", infoResponse.data);
    } catch (error) {
      console.error("Refresh subscription failed:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5194/api/v1/vehicles", {
          withCredentials: true,
        });
        setVehicles(res.data);
      } catch (err) {
        console.error("Fetch vehicles failed:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await axios.get("http://localhost:5194/api/v1/stations", {
          withCredentials: true,
        });
        setStations(res.data.items);
      } catch (error) {
        console.error("Fetch stations failed:", error);
      }
    };
    fetchStations();
  }, []);

  const handleRefreshVehicles = async () => {
    try {
      const res = await axios.get("http://localhost:5194/api/v1/vehicles", {
        withCredentials: true,
      });
      setVehicles(res.data);
    } catch (err) {
      console.error("Refresh vehicles failed:", err);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedStation || !selectedVehicle || !bookingDate) return;
    setIsLoadingSlots(true);
    try {
      const res = await axios.get(
        "http://localhost:5194/api/v1/slot-reservations/available-slots",
        {
          params: {
            stationId: selectedStation,
            date: formatDateForApi(bookingDate),
            batteryModelId: selectedVehicle.compatibleBatteryModelId,
          },
          withCredentials: true,
        }
      );
      setSlots(res.data);
    } catch (error) {
      console.error("Thất bại khi lấy slot:", error);
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };
  const handleNavigateToHome = () => {
    navigate("/");
  };


  useEffect(() => {
    if (bookingDialog && selectedStation && selectedVehicle && bookingDate) {
      fetchAvailableSlots();
    }
  }, [bookingDialog, selectedStation, selectedVehicle, bookingDate]);

  const openBookingWizard = (stationId: string) => {
    setSelectedStation(stationId);
    setBookingStep(1);
    setSelectedVehicle(null);
    setBookingDate(new Date());
    setSelectedSlot(null);
    setSlots([]);
    setBookingResult(null);
    setBookingDialog(true);
  };

  const handleBooking = () => {
    if (selectedStation) {
      openBookingWizard(selectedStation);
    }
  };

  const handleConfirmBooking = async (
    isUsingSub: boolean,
    price: number | null,
    paymentMethodParam: number | null
  ) => {
    if (!selectedStation || !selectedVehicle || !bookingDate || !selectedSlot) {
      toast.error(t("driver.booking.errorValidation"));
      return;
    }

    setIsBooking(true);

    if (isUsingSub) {
      try {
        const response = await axios.post(
          "http://localhost:5194/api/v1/slot-reservations",
          {
            stationId: selectedStation,
            batteryModelId: selectedVehicle.compatibleBatteryModelId,
            slotDate: formatDateForApi(bookingDate),
            slotStartTime: selectedSlot.slotStartTime,
            slotEndTime: selectedSlot.slotEndTime,
            vehicleId: selectedVehicle.id
          },
          { withCredentials: true }
        );
        toast.success(t("driver.booking.success"));
        setBookingResult(response.data);
        setBookingStep(5);
      } catch (error: any) {
        console.error("Lỗi khi đặt lịch bằng gói:", error);

        const backendErrorMessage =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          error?.message ||
          t("driver.booking.errorGeneric");

        toast.error(backendErrorMessage);
      } finally {
        setIsBooking(false);
      }

    } else {
      if (price === null || price <= 0) {
        toast.error("Không thể xác định giá đổi pin. Vui lòng chọn lại xe.");
        setIsBooking(false);
        return;
      }
      const methodToUse = paymentMethodParam;
      if (methodToUse === null) {
        toast.error("Vui lòng chọn phương thức thanh toán.");
        setIsBooking(false);
        return;
      }

      try {
        const response = await axios.post(
          "http://localhost:5194/api/v1/payments/create-pay-per-swap-reservation",
          {
            stationId: selectedStation,
            batteryModelId: selectedVehicle.compatibleBatteryModelId,
            slotDate: formatDateForApi(bookingDate),
            slotStartTime: selectedSlot.slotStartTime,
            vehicleId: selectedVehicle.id,
            slotEndTime: selectedSlot.slotEndTime,
            amount: price,
            paymentMethod: methodToUse // 0=VNPay, 1=Cash
          },
          { withCredentials: true }
        );

        const result = response.data;

        if (!result.success) {
          toast.error(result.message || "Không thể tạo đặt lịch.");
          setIsBooking(false);
          return;
        }

        if (methodToUse === 0) {
          if (result.paymentUrl) {
            toast.loading("Đang chuyển hướng đến cổng thanh toán...");
            window.location.href = result.paymentUrl;
          } else {
            console.error("Failed to get VNPay URL:", result);
            toast.error(result.message || "Không thể tạo link thanh toán VNPay.");
            setIsBooking(false);
          }
        } else {
          if (result.qrCode) {
            toast.success(result.message || "Đặt lịch thanh toán tiền mặt thành công!");
            setBookingResult(result);
            setBookingStep(5);
            setIsBooking(false);
          } else {
            console.error("Failed to create Cash reservation:", result);
            toast.error(result.message || "Không thể tạo lịch hẹn tiền mặt.");
            setIsBooking(false);
          }
        }
      } catch (error: any) {
        console.error("Lỗi khi gọi API tạo thanh toán:", error);

        const backendErrorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error?.message ||
          error?.response?.data?.errors?.Amount?.[0] ||
          error?.message ||
          "Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.";

        toast.error(backendErrorMessage);
        setIsBooking(false);
      }
    }
  };

  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("map")}
                      isActive={activeSection === "map"}
                      className="h-[60px]"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t("driver.findStations")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("subscription")}
                      isActive={activeSection === "subscription"}
                      className="h-[60px]"
                    >
                      <Pen className="w-4 h-4" />
                      Đăng ký gói
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("my-payments")}
                      isActive={activeSection === "my-payments"}
                      className="h-[60px]"
                    >
                      <CreditCardIcon className="w-4 h-4" />
                      <span>Hóa đơn chờ</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
                      onClick={() => { setActiveSection("swap"); }}
                      isActive={activeSection === "swap"}
                      className="h-[60px]"
                    >
                      <Battery className="w-4 h-4" />
                      <span>Lịch đã đặt</span>
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
                      onClick={() => setActiveSection("complaints")}
                      isActive={activeSection === "complaints"}
                      className="h-[60px]"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Khiếu nại của tôi</span>
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
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center p-2 space-x-2 min-w-0 bg-gray-100">
              <Avatar className="shrink-0">
                <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
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
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="flex justify-between items-center h-16 px-4">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-orange-600">
                  {activeSection === "map" && t("driver.findStations")}
                  {activeSection === "mycar" && t("driver.mycar")}
                  {activeSection === "my-payments" && "Hóa đơn chờ"}
                  {activeSection === "subscription" && "Đăng ký gói"}
                  {activeSection === "swap" && t("driver.swap")}
                  {activeSection === "history" && t("driver.history")}
                  {activeSection === "complaints" && "Khiếu nại của tôi"}
                  {activeSection === "profile" && t("driver.profile")}
                  {activeSection === "support" && t("driver.support")}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Button variant="ghost" size="icon" onClick={handleNavigateToHome}>
                  <Home className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            {activeSection === "map" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1">
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
            )}
            {activeSection === "mycar" && (
              <div className="space-y-6">
                <div>
                  <MyVehicle
                    vehicles={vehicles}
                    onRefresh={handleRefreshVehicles}
                  />
                </div>
              </div>
            )}
            {activeSection === "my-payments" && (
              <MyPaymentsPage />
            )}
            {activeSection === "subscription" && (
              <div className="space-y-6">
                <div>
                  <SubscriptionPlansPage />
                </div>
              </div>
            )}
            {activeSection === "swap" && (
              <div className="space-y-6">
                <SwapStatus
                  onQRDialog={() => setQrDialog(true)}
                  onNavigateToBooking={() => setActiveSection("map")}
                />
              </div>
            )}

            {activeSection === "history" && (
              <div className="space-y-6">
                <SwapHistory />
              </div>
            )}

            {activeSection === "complaints" && (
              <div className="space-y-6">
                <ComplaintsList />
              </div>
            )}

            {activeSection === "profile" && (
              <div>
                <DriverProfile />
                <SubscriptionStatus
                  subscriptionInfoList={subscriptionInfoList}
                  onRefresh={handleRefreshSubscriptions}
                />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      <BookingWizard
        isOpen={bookingDialog}
        onClose={() => setBookingDialog(false)}
        stations={stations}
        vehicles={vehicles}
        slots={slots}
        bookingStep={bookingStep}
        selectedStation={selectedStation}
        selectedVehicle={selectedVehicle}
        bookingDate={bookingDate}
        selectedSlot={selectedSlot}
        bookingResult={bookingResult}
        isLoadingSlots={isLoadingSlots}
        isBooking={isBooking}
        onStepChange={setBookingStep}
        onVehicleSelect={setSelectedVehicle}
        onDateChange={setBookingDate}
        onSlotSelect={setSelectedSlot}
        onConfirm={handleConfirmBooking}
        onQRDialog={() => setQrDialog(true)}
        subscriptionInfoList={subscriptionInfoList}
      />

      <QRCodeDialog
        isOpen={qrDialog}
        onClose={() => setQrDialog(false)}
        bookingResult={bookingResult}
      />
    </SidebarProvider>
  );
}