import React, { useState, useEffect } from "react";
import axios from "axios";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
// import { Badge } from "../components/ui/badge"; // Dòng này có vẻ không dùng, có thể xóa nếu không cần
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
  // Zap, // Dòng này có vẻ không dùng, có thể xóa nếu không cần
  Bell,
  HeadphonesIcon,
  Car,
  Pen,
} from "lucide-react";
import { User } from "../App";
import { useLocation, useNavigate } from "react-router-dom";

// Import driver components
// import { StationMap } from "../components/driver/StationMap"; // Dòng này có vẻ không dùng, có thể xóa nếu không cần
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
import { toast } from "react-toastify";
import { showError, showSuccess } from "./ui/alert";

interface DriverDashboardProps {
  user: User;
  onLogout: () => void;
}

// Interface này giữ nguyên
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
}

// Các interface này giữ nguyên
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


export function DriverDashboard({ user, onLogout }: DriverDashboardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("swap");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [qrDialog, setQrDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // const [profileName, setProfileName] = useState<string>(user.name); // Có vẻ không dùng
  // const [profileEmail, setProfileEmail] = useState<string>(user.email); // Có vẻ không dùng
  // const [profilePhone, setProfilePhone] = useState<string>(""); // Có vẻ không dùng
  const [showAll, setShowAll] = useState(false);

  const [swapHistory, setSwapHistory] = useState<any>(null);
  const [recentSwaps, setRecentSwaps] = useState<Swap[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriptionInfoList, setSubscriptionInfoList] = useState<SubscriptionInfo[]>([]);
  const [stations, setStations] = useState<Station[] | null>(null);

  // Booking states
  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false); // Giữ lại state này
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  // const [name, setName] = useState<any>(null); // Có vẻ không dùng
  // const [phoneNumber, setPhoneNumber] = useState<any>(null); // Có vẻ không dùng

  // (useEffect fetchSwapHistory không đổi)
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

  // (useEffect xử lý navigate từ map không đổi)
  useEffect(() => {
    const state = location.state as { initialSection?: string, preSelectedStationId?: string };
    if (state && state.initialSection) {
      setActiveSection(state.initialSection);
    }
    if (state && state.preSelectedStationId) {
      openBookingWizard(state.preSelectedStationId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // (useEffect fetchSubscriptionData không đổi)
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

  // (useEffect fetchData (lấy xe) không đổi)
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

  // (useEffect fetchStations không đổi)
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

  // (useEffect fetchProfile không đổi)
  useEffect(() => {
    fetchProfile();
  }, []);

  // (handleRefreshVehicles không đổi)
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


  // (fetchAvailableSlots không đổi)
  const fetchAvailableSlots = async () => {
    // Chỉ fetch khi có đủ thông tin cần thiết
    if (!selectedStation || !selectedVehicle || !bookingDate) return;

    setIsLoadingSlots(true); // Bật loading trước khi gọi API
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
      setSlots([]); // Set rỗng nếu lỗi
    } finally {
      setIsLoadingSlots(false); // Tắt loading sau khi gọi xong (kể cả lỗi)
    }
  };

  // (show/hide/handleCancelReservation không đổi)
  const showCancelReservation = () => setShowCancelPrompt(true);
  const hideCancelReservation = () => setShowCancelPrompt(false);
  const handleCancelReservation = async (note: string) => {
    if (!activeReservation) return; // Thêm kiểm tra phòng trường hợp null
    setIsCancelling(true);
    try {
      await axios.delete(
        `http://localhost:5194/api/v1/slot-reservations/${activeReservation.id}`,
        {
          data: { reason: 0, note: note },
          withCredentials: true,
        }
      );
      toast.success(t("driver.cancelBooking.success"));
      setActiveReservation(null);
      setShowCancelPrompt(false);
    } catch (error) {
      console.error("Lỗi khi hủy lịch hẹn:", error);
      toast.error(t("driver.cancelBooking.error"));
    } finally {
      setIsCancelling(false);
    }
  };

  // (handleUpdateProfile không đổi)
  const handleUpdateProfile = async (name: string, phone: string) => {
    if (!userData?.id) return; // Thêm kiểm tra phòng trường hợp null
    try {
      await axios.put(`http://localhost:5194/api/v1/Users/${userData.id}`, {
        "name": name,
        "phoneNumber": phone
      }, { withCredentials: true }
      );
      showSuccess("Cập nhật thông tin thành công !");
      fetchProfile(); // Fetch lại profile sau khi update
    } catch (error: any) {
      const backendErrorMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
      if (backendErrorMessage) {
        showError("Không thể cập nhật thông tin ! Vui lòng thử lại sau", backendErrorMessage);
      } else {
        showError("Không thể cập nhật thông tin ! Vui lòng thử lại sau", "Lỗi không xác định");
      }
    }
  };

  // (useEffect fetchAvailableSlots không đổi)
  useEffect(() => {
    if (bookingDialog && selectedStation && selectedVehicle && bookingDate) {
      fetchAvailableSlots();
    }
  }, [bookingDialog, selectedStation, selectedVehicle, bookingDate]); // Giữ nguyên dependencies

  // (openBookingWizard không đổi)
  const openBookingWizard = (stationId: string) => {
    setSelectedStation(stationId);
    setBookingStep(1);
    setSelectedVehicle(null); // Reset xe đã chọn
    setBookingDate(new Date()); // Reset ngày về hôm nay
    setSelectedSlot(null); // Reset slot đã chọn
    setSlots([]); // Xóa danh sách slot cũ
    setBookingResult(null); // Reset kết quả booking cũ
    setBookingDialog(true);
  };

  // (handleBooking không đổi)
  const handleBooking = () => {
    if (selectedStation) {
      openBookingWizard(selectedStation);
    }
  };

  // (getReservation không đổi)
  const getReservation = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5194/api/v1/slot-reservations/mine",
        {
          params: { status: "Pending" }, // Chỉ lấy các lịch hẹn đang chờ
          withCredentials: true,
        }
      );
      if (response.data && response.data.length > 0) {
        setActiveReservation(response.data[0]); // Lấy lịch hẹn đầu tiên nếu có
      } else {
        setActiveReservation(null); // Không có lịch hẹn nào đang chờ
      }
    } catch (error) {
      console.error(t("driver.booking.errorFetchReservation"), error);
    }
  };

  // (fetchProfile không đổi)
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

  // ✅ SỬA LẠI HÀM NÀY: Thêm paymentMethodParam và sử dụng nó
  // ✅ SỬA LẠI HÀM NÀY: Đảo ngược logic if/else cho methodToUse
  const handleConfirmBooking = async (
    isUsingSub: boolean,
    price: number | null,
    paymentMethodParam: number | null // Tham số này đã đúng
  ) => {
    // 1. Validation cơ bản (giữ nguyên)
    if (!selectedStation || !selectedVehicle || !bookingDate || !selectedSlot) {
      toast.error(t("driver.booking.errorValidation"));
      return;
    }

    setIsBooking(true); // Bật loading

    if (isUsingSub) {
      // --- LUỒNG 1: DÙNG GÓI (MIỄN PHÍ) ---
      // (Giữ nguyên)
      try {
        const response = await axios.post(
          "http://localhost:5194/api/v1/slot-reservations",
          {
            stationId: selectedStation,
            batteryModelId: selectedVehicle.compatibleBatteryModelId,
            slotDate: formatDateForApi(bookingDate),
            slotStartTime: selectedSlot.slotStartTime,
            slotEndTime: selectedSlot.slotEndTime,
          },
          { withCredentials: true }
        );
        toast.success(t("driver.booking.success")); // Dùng toast.success
        setBookingResult(response.data);
        setActiveReservation(response.data);
        setBookingStep(5);
      } catch (error: any) {
        console.error("Lỗi khi đặt lịch bằng gói:", error);
        const backendErrorMessage = error?.response?.data?.error?.message || error?.response?.data?.message;
        toast.error(backendErrorMessage || t("driver.booking.errorGeneric")); // Dùng toast.error
      } finally {
        setIsBooking(false);
      }

    } else {
      // --- LUỒNG 2: ĐẶT LẺ (TRẢ TIỀN NGAY) ---

      // 2a. Validation giá (giữ nguyên)
      if (price === null || price <= 0) {
        toast.error("Không thể xác định giá đổi pin. Vui lòng chọn lại xe.");
        setIsBooking(false);
        return;
      }

      // 2b. Lấy phương thức (giữ nguyên)
      const methodToUse = paymentMethodParam;

      // 2c. Kiểm tra null (giữ nguyên)
      if (methodToUse === null) {
        toast.error("Vui lòng chọn phương thức thanh toán.");
        setIsBooking(false);
        return;
      }

      try {
        // Gọi API (giữ nguyên)
        const response = await axios.post(
          "http://localhost:5194/api/v1/payments/create-pay-per-swap-reservation",
          {
            stationId: selectedStation,
            batteryModelId: selectedVehicle.compatibleBatteryModelId,
            slotDate: formatDateForApi(bookingDate),
            slotStartTime: selectedSlot.slotStartTime,
            slotEndTime: selectedSlot.slotEndTime,
            amount: price,
            paymentMethod: methodToUse // Gửi 0 (VNPay) hoặc 1 (Cash)
          },
          { withCredentials: true }
        );

        const result = response.data;

        // 2d. ✅ SỬA LẠI LOGIC IF/ELSE Ở ĐÂY (Đảo ngược điều kiện)
        if (methodToUse === 0) { // Xử lý cho VNPay (giá trị 0 từ backend enum)
          if (result.success && result.paymentUrl) {
            toast.loading("Đang chuyển hướng đến cổng thanh toán...");
            console.log("Redirecting to VNPay URL:", result.paymentUrl);
            window.location.href = result.paymentUrl; // Chuyển hướng
            // Không setIsBooking(false) vì trang sẽ chuyển hướng
          } else {
            console.error("Failed to get VNPay URL or Success is false:", result);
            toast.error(result.message || "Không thể tạo link thanh toán VNPay.");
            setIsBooking(false); // Tắt loading nếu lỗi
          }
        } else { // Xử lý cho Cash (methodToUse === 1 từ backend enum)
          if (result.success && result.qrCode) {
            // Đảm bảo dùng toast.success cho thành công
            toast.success(result.message || "Đặt lịch thanh toán tiền mặt thành công!");
            setBookingResult(result);
            setActiveReservation(result);
            setBookingStep(5);
            getReservation();
            setIsBooking(false); // Tắt loading khi thành công
          } else {
            console.error("Failed to create Cash reservation or Success is false:", result);
            toast.error(result.message || "Không thể tạo lịch hẹn tiền mặt.");
            setIsBooking(false); // Tắt loading nếu lỗi
          }
        }
      } catch (error: any) {
        // Xử lý lỗi catch (giữ nguyên)
        console.error("Lỗi khi gọi API tạo thanh toán:", error);
        const backendErrorMessage = error?.response?.data?.message || error?.response?.data?.errors?.Amount?.[0];
        toast.error(backendErrorMessage || "Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.");
        setIsBooking(false);
      }
      // Không cần finally
    }
  };

  // (formatDateForApi không đổi)
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        {/* Sidebar (Giữ nguyên) */}
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
                      onClick={() => { setActiveSection("swap"); getReservation(); }} // Gọi getReservation khi chuyển qua tab swap
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

        {/* Sidebar Inset (Giữ nguyên) */}
        <SidebarInset>
          {/* Header (Giữ nguyên) */}
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

          {/* Main Content (Giữ nguyên cấu trúc) */}
          <main className="flex-1 p-6">
            {activeSection === "map" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1">
                  {/* <StationMap stations={stations} /> */}
                  <StationList
                    stations={stations}
                    selectedStation={selectedStation}
                    searchQuery={searchQuery}
                    onStationSelect={setSelectedStation}
                    onSearchChange={setSearchQuery}
                    onBooking={handleBooking} // Gọi hàm handleBooking đã sửa
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
                  <SubscriptionPlansPage />
                </div>
              </div>
            )}
            {activeSection === "swap" && (
              <div className="space-y-6">
                <SwapStatus
                  showCancelPrompt={showCancelPrompt}
                  activeReservation={activeReservation}
                  onQRDialog={() => setQrDialog(true)}
                  onNavigateToBooking={() => setActiveSection("map")} // Chuyển sang tab map khi cần đặt mới
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
                {/* Sửa lại cách truyền prop, chỉ lấy sub active đầu tiên (nếu có) */}
                <SubscriptionStatus
                  subscriptionInfo={subscriptionInfoList.find(s => s.isActive) || null}
                  currentMonthSwapCount={subscriptionInfoList.find(s => s.isActive)?.currentMonthSwapCount}
                />
              </div>
            )}
            {activeSection === "support" && <DriverSupport />}
          </main>
        </SidebarInset>
      </div>

      {/* Dialogs (Giữ nguyên cách gọi, props đã tự khớp) */}
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
        isLoadingSlots={isLoadingSlots} // Truyền state loading slot
        isBooking={isBooking}
        onStepChange={setBookingStep}
        onVehicleSelect={setSelectedVehicle} // Truyền hàm set state gốc
        onDateChange={setBookingDate}
        onSlotSelect={setSelectedSlot}
        onConfirm={handleConfirmBooking} // Truyền hàm confirm đã sửa
        onQRDialog={() => setQrDialog(true)}
        subscriptionInfoList={subscriptionInfoList} // Truyền danh sách sub
      />

      <QRCodeDialog
        isOpen={qrDialog}
        onClose={() => setQrDialog(false)}
        bookingResult={bookingResult} // Truyền kết quả booking (có thể là null)
      />
    </SidebarProvider>
  );
}