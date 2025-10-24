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
import { useLocation } from "react-router-dom";

// Import driver components
import { StationMap } from "../components/driver/StationMap";
import { StationList } from "../components/driver/StationList";
import { SubscriptionPlansPage } from "../components/driver/SubscriptionPlansPage";
import { BookingWizard } from "../components/driver/BookingWizard";
import { QRCodeDialog } from "../components/driver/QRCodeDialog";
import { SwapStatus } from "../components/driver/SwapStatus";
import { SubscriptionStatus } from "../components/driver/SubscriptionStatus";
import { SwapHistory } from "../components/driver/SwapHistory";
import { DriverProfile } from "../components/driver/DriverProfile";
import { DriverSupport } from "../components/driver/DriverSupport";
import { MyVehicle } from "../components/driver/MyVehicle";
import { data } from "react-router-dom";
import { toast } from "react-toastify";
import { showError, showSuccess } from "./ui/alert";

interface DriverPortalPageProps {
  user: User;
  onLogout: () => void;
}

export function DriverPortalPage({ user, onLogout }: DriverPortalPageProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("swap");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  // const [bookingStep, setBookingStep] = useState(1);
  // const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  // const [selectedTime, setSelectedTime] = useState<string>("");
  // const [bookingDialog, setBookingDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [profileName, setProfileName] = useState<string>(user.name);
  const [profileEmail, setProfileEmail] = useState<string>(user.email);
  const [profilePhone, setProfilePhone] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  const [swapHistory, setSwapHistory] = useState<any>(null);
  const [recentSwaps, setRecentSwaps] = useState<Swap[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [subscriptionUsage, setSubscriptionUsage] =
    useState<SubscriptionUsage | null>(null);

  const [stations, setStations] = useState<Station[] | null>(null);
  // const [slots, setSlots] = useState<Slot[] | null>(null);
  // const [bookingDate, setBookingDate] = useState<Date | null>(null);
  // const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null); // Sửa: Dùng object Vehicle, không dùng string
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date()); // Sửa: Khởi tạo giá trị mặc định
  const [slots, setSlots] = useState<Slot[]>([]); // Sửa: Khởi tạo là mảng rỗng
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null); // Sửa: Đổi tên từ selectedTime
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [name, setName] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState<any>(null);

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

  interface UserData {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
    role: string;
    createdAt: string;
    lastLogin: string;
  }

  interface SubscriptionInfo {
    id: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
    isBlocked: boolean;
    subscriptionPlan: {
      name: string;
    };
  }
  interface MonthlyUsage {
    year: number;
    month: number;
    swapCount: number;
  }
  interface SubscriptionUsage {
    monthlyUsage: MonthlyUsage[];
  }



  useEffect(() => {
    async function fetchSwapHistory() {
      try {
        let url;
        if (showAll) {
          url = "http://localhost:5194/api/v1/swaps/history?page=1&pageSize=50";
        } else {
          url = "http://localhost:5194/api/v1/swaps/history?page=1&pageSize=3";
        }

        const response = await axios.get(url, { withCredentials: true });
        setSwapHistory(response.data);
        setRecentSwaps(response.data.transactions);

      } catch (error) {
        console.error("Lỗi khi lấy lịch sử đổi pin:", error);
      }
    }

    fetchSwapHistory();
  }, [showAll]);
  useEffect(() => {
    const initialSectionFromHomePage = location.state.initialSection;
    if (initialSectionFromHomePage) {
      setActiveSection(initialSectionFromHomePage);
    }
  }, [location.state]);
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const infoResponse = await axios.get(
          "http://localhost:5194/api/v1/subscriptions/mine",
          { withCredentials: true }
        );
        const usageResponse = await axios.get(
          "http://localhost:5194/api/v1/subscriptions/mine/usage",
          { withCredentials: true }
        );
        setSubscriptionInfo(infoResponse.data);
        setSubscriptionUsage(usageResponse.data);
        console.log("DATA 1:", infoResponse.data);
        console.log("DATA 2:", infoResponse.data);
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    };
    fetchSubscriptionData();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5194/api/v1/vehicles", {
          withCredentials: true,
        });
        setVehicles(res.data);
      } catch (err) {
        console.error("Fetch failed:", err);
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
      } catch (error) { }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefreshVehicles = async () => {
    try {
      const res = await axios.get("http://localhost:5194/api/v1/vehicles", {
        withCredentials: true,
      });
      setVehicles(res.data);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5194/api/v1/slot-reservations/available-slots",
        {
          params: {
            stationId: selectedStation,
            date: formatDateForApi(bookingDate!),
            batteryModelId: selectedVehicle?.compatibleBatteryModelId,
          },
          withCredentials: true,
        }
      );
      setSlots(res.data);
    } catch (error) {
      console.log("Thất bại khi lấy slot");
    }
  };
  const showCancelReservation = () => {
    setShowCancelPrompt(true);
  }
  const hideCancelReservation = () => {
    setShowCancelPrompt(false);
  }
  const handleCancelReservation = async (note: string) => {
    setIsCancelling(true); // Bật trạng thái loading
    try {
      // Gọi API DELETE đến server
      await axios.delete(
        `http://localhost:5194/api/v1/slot-reservations/${activeReservation.id}`,
        {
          // Body của request DELETE phải được đặt trong thuộc tính `data` của config
          data: {
            reason: 0,
            note: note
          },
          withCredentials: true,
        }
      );

      // Xử lý khi thành công
      toast.success(t("driver.cancelBooking.success"));
      setActiveReservation(null);
      setShowCancelPrompt(false);

    } catch (error) {
      console.error("Lỗi khi hủy lịch hẹn:", error);
      toast.error(t("driver.cancelBooking.error"));
    } finally {
      setIsCancelling(false); // Tắt trạng thái loading
    }
  };
  const handleUpdateProfile = async (name: string, phone: string) => {
    try {
      await axios.put(`http://localhost:5194/api/v1/Users/${userData?.id}`, {
        "name": name,
        "phoneNumber": phone
      }, { withCredentials: true }
      )
      showSuccess("Cập nhật thông tin thành công !");
      fetchProfile();
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.error?.message;
      if (backendErrorMessage) {
        showError("Không thể cập nhật thông tin ! Vui lòng thử lại sau", backendErrorMessage);
      } else {
        showError("Không thể cập nhật thông tin ! Vui lòng thử lại sau", "Invalid Error");
      }

    }
  }
  useEffect(() => {
    // Chỉ gọi API khi dialog đang mở và đã có đủ 3 thông tin
    if (bookingDialog && selectedStation && selectedVehicle && bookingDate) {
      fetchAvailableSlots();
    }
  }, [bookingDialog, selectedStation, selectedVehicle, bookingDate]); // Móc thần kỳ: Chạy lại khi 1 trong các giá trị này thay đổi

  const handleBooking = () => {
    if (selectedStation) {
      // Reset lại toàn bộ state của wizard về giá trị ban đầu
      setBookingStep(1);
      setSelectedVehicle(null);
      setBookingDate(new Date());
      setSelectedSlot(null);
      setSlots([]);
      setBookingResult(null);

      // Mở dialog
      setBookingDialog(true);
    }
  };

  const getReservation = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5194/api/v1/slot-reservations/mine",
        {
          params: { status: "Pending" },
          withCredentials: true,
        }
      );
      if (response.data && response.data.length > 0) {
        setActiveReservation(response.data[0]);
      }
    } catch (error) {
      console.error(t("driver.booking.errorFetchReservation"), error);
    }
  }
  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5194/api/v1/auth/me", {
        withCredentials: true,
      });
      console.log("User data:", res.data);
      setUserData(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };
  const handleConfirmBooking = async () => {
    if (!selectedStation || !selectedVehicle || !bookingDate || !selectedSlot) {
      toast.error(t("driver.booking.errorValidation")); // Dùng toast cho cả lỗi validation
      return;
    }

    setIsBooking(true);
    try {
      const response = await axios.post(
        "http://localhost:5194/api/v1/slot-reservations",
        {
          stationId: selectedStation,
          batteryModelId: selectedVehicle.compatibleBatteryModelId,
          slotDate: formatDateForApi(bookingDate), // Sử dụng hàm format ngày tháng
          slotStartTime: selectedSlot.slotStartTime,
          slotEndTime: selectedSlot.slotEndTime,
        },
        { withCredentials: true }
      );

      // ✅ KHI THÀNH CÔNG:
      toast.success(t("driver.booking.success"));

      setBookingResult(response.data);
      setActiveReservation(response.data);
      setBookingStep(5);

    } catch (error: any) { // ✅ KHI THẤT BẠI: Xử lý lỗi chi tiết hơn ở đây

      console.error(t("driver.booking.errorConfirm"), error); // Giữ lại log để debug

      // Cố gắng lấy message từ backend
      const backendErrorMessage = error?.response?.data?.error?.message;

      if (backendErrorMessage) {
        // Nếu có message từ backend, hiển thị nó
        toast.error(backendErrorMessage);
      } else {
        // Nếu không có, hiển thị lỗi chung chung
        toast.error(t("driver.booking.errorGeneric"));
      }

    } finally {
      setIsBooking(false);
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
                      <MapPin className="w-4 h-4" />
                      Đăng ký gói
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
                      onClick={() => { setActiveSection("swap"); getReservation(); }}

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
                  {activeSection === "map" && t("driver.findStations")}
                  {activeSection === "mycar" && t("driver.mycar")}
                  {activeSection === "subscription" && "Đăng ký gói"}
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
            {activeSection === "map" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1">
                  {/* <StationMap stations={stations} />*/}
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
            {activeSection === "subscription" && (
              <div className="space-y-6">
                <div>
                  <SubscriptionPlansPage
                  />
                </div>
              </div>
            )}
            {activeSection === "swap" && (
              <div className="space-y-6">
                <SwapStatus
                  showCancelPrompt={showCancelPrompt}
                  activeReservation={activeReservation}
                  onQRDialog={() => setQrDialog(true)}
                  onNavigateToBooking={() => setActiveSection("map")}
                  onCancelReservation={handleCancelReservation}
                  onShowCancelReservation={showCancelReservation}
                  onHideCancelReservation={hideCancelReservation}
                  isCancelling={isCancelling}
                />
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
              <div>
                <DriverProfile
                  userData={userData}
                  submitUpdateProfile={handleUpdateProfile}
                />
                <SubscriptionStatus
                  subscriptionInfo={subscriptionInfo}
                  subscriptionUsage={subscriptionUsage}
                />
              </div>
            )}

            {activeSection === "support" && <DriverSupport />}
          </main>
        </SidebarInset>
      </div>

      {/* Dialogs */}
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
      />

      <QRCodeDialog
        isOpen={qrDialog}
        onClose={() => setQrDialog(false)}
        bookingResult={bookingResult}
      />
    </SidebarProvider>
  );
}
