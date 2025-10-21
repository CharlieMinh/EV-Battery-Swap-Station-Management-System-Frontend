import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
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
} from "./ui/sidebar";
import {
  Clipboard,
  Package,
  Receipt,
  BarChart3,
  LogOut,
  Zap,
  Bell,
  User as UserIcon,
  DollarSign,
  Battery as BatteryIcon,
} from "lucide-react";
import { User } from "../App";
import staffApi, { Battery, Booking, Transaction, DailyStats } from "../services/staffApi";
import ProfileSection from "./staff/ProfileSection";

// Import staff components
import { StaffDashboard } from "./staff/StaffDashboard";
import { TransactionManagement } from "./staff/TransactionManagement";
import { RevenueTracking } from "./staff/RevenueTracking";
import { SwapProcessDialog } from "./staff/SwapProcessDialog";
import { POSDialog } from "./staff/POSDialog";
import { BatteryConditionCheck } from "./staff/BatteryConditionCheck";
import { StaffQueueManagement } from "./staff/StaffQueueManagement";
import { StaffInventoryMonitoring } from "./staff/StaffInventory";

interface StaffPortalPageProps {
  user: User;
  onLogout: () => void;
}

export function StaffPortalPage({ user, onLogout }: StaffPortalPageProps) {
  const { t } = useLanguage();
  
  // Debug log
  console.log('StaffPortalPage rendered with user:', user);
  const [activeSection, setActiveSection] = useState("queue-pro");
  const [selectedBattery, setSelectedBattery] = useState<string | null>(null);
  const [swapDialog, setSwapDialog] = useState(false);
  const [posDialog, setPosDialog] = useState(false);
  const [batteryCheckDialog, setBatteryCheckDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // State for API data
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalSwaps: 0,
    revenue: 0,
    avgSwapTime: 0,
    customerRating: 0,
    lowBatteryAlerts: 0,
    maintenanceNeeded: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);

  // API Functions
  const fetchBatteryInventory = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getBatteries(user.stationId || 1);
      setBatteries(data);
    } catch (error) {
      console.error('Error fetching battery inventory:', error);
      setError('Failed to load battery inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueBookings = async () => {
    try {
      setLoading(true);
      console.log('StaffDashBoard: Fetching real bookings from API...');
      const data = await staffApi.getQueue(user.stationId || 1);
      console.log('StaffDashBoard: Real bookings fetched:', data);
      setBookings(data);
    } catch (error) {
      console.error('Error fetching queue bookings:', error);
      setError('Failed to load queue bookings');
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getTransactions(user.stationId || 1, 10);
      setRecentTransactions(data);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      setError('Failed to load recent transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const data = await staffApi.getDailyStats(user.stationId || 1);
      setDailyStats(data);
      setStatsLoaded(true);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      setError('Failed to load daily statistics');
      setStatsLoaded(true);
    }
  };

  // Load daily stats immediately
  useEffect(() => {
    fetchDailyStats();
  }, []);

  // Load other data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('StaffDashBoard: Initializing user session...');
        const sessionData = await staffApi.initializeUserSession();
        console.log('StaffDashBoard: Session initialized:', sessionData);
        
        // Update user object with session data
        user.id = sessionData.user.id;
        user.name = sessionData.user.name;
        user.email = sessionData.user.email;
        user.role = sessionData.user.role;
        user.stationId = typeof sessionData.stationId === 'string' ? parseInt(sessionData.stationId) : sessionData.stationId;
        
        console.log('StaffDashBoard: User updated with session data:', user);
        
        // Load all data after session is initialized
        await Promise.all([
          fetchBatteryInventory(),
          fetchQueueBookings(),
          fetchRecentTransactions()
        ]);
        
      } catch (error) {
        console.error('StaffDashBoard: Error initializing session:', error);
        setError('Unable to initialize user session');
        
        // Fallback: try to get staff profile if user.id exists
        if (user.id && user.id !== 'undefined') {
          try {
            const profile = await staffApi.getStaffProfile(user.id);
            if (profile.stationId) {
              user.stationId = profile.stationId;
              await Promise.all([
                fetchBatteryInventory(),
                fetchQueueBookings(),
                fetchRecentTransactions()
              ]);
            }
          } catch (profileError) {
            console.error('StaffDashBoard: Error getting staff profile:', profileError);
            setError('Unable to load station information');
          }
        }
      }
    };
    loadInitialData();
  }, []);

  // Fallback if user is not properly loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-orange-600 mb-4">Đang tải...</h1>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="bg-orange-500 flex items-center p-2">
              <div className="inline-flex items-center justify-center w-8 h-8 mr-3">
                <img
                  src="src/assets/logoEV2.png "
                  alt="FPTFAST Logo"
                  className="w-10 h-9 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg text-white font-semibold">
                  F P T F A S T
                </span>
                <span className="text-sm font-medium text-gray-100">Staff</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Thông Tin Cá Nhân - Đầu tiên */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("profile")}
                      isActive={activeSection === "profile"}
                      className="h-[50px]"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{t("staff.personalInformation")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Quản Lý Hàng Chờ - Tính năng chính */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("queue-pro")}
                      isActive={activeSection === "queue-pro"}
                      className="h-[50px]"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Quản lý hàng chờ</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Giám sát kho pin */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("inventory-monitoring")}
                      isActive={activeSection === "inventory-monitoring"}
                      className="h-[50px]"
                    >
                      <BatteryIcon className="w-4 h-4" />
                      <span>Kho pin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Giao Dịch */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("transactions")}
                      isActive={activeSection === "transactions"}
                      className="h-[50px]"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>{t("staff.transactions")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Thu Ngân */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("revenue")}
                      isActive={activeSection === "revenue"}
                      className="h-[50px]"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>{t("staff.cashier")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {/* Báo Cáo */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("reports")}
                      isActive={activeSection === "reports"}
                      className="h-[50px]"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{t("staff.reports")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center p-2 space-x-2 min-w-0 bg-gray-100 rounded">
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
          <header className="bg-gray-50 border-b border-gray-200 sticky top-0 z-40">
            <div className="flex justify-between items-center h-16 px-4">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-orange-600">
                  {activeSection === "transactions" && t("staff.transactions")}
                  {activeSection === "revenue" && t("staff.cashier")}
                  {activeSection === "reports" && t("staff.reports")}
                  {activeSection === "queue-pro" && "Quản lý hàng chờ"}
                  {activeSection === "inventory-monitoring" && "Kho pin"}
                  {activeSection === "profile" && t("staff.personalInformation")}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white flex items-center justify-center rounded-full">
                    3
                  </span>
                </Button>
              </div>
            </div>
          </header>

          {/* Dashboard KPIs */}
          {activeSection !== "profile" && <StaffDashboard dailyStats={dailyStats} />}

          {/* Main Content */}
          <main className="flex-1 p-6">

            {activeSection === "transactions" && (
              <div className="space-y-6">
                <TransactionManagement
                  recentTransactions={recentTransactions}
                />
              </div>
            )}

            {activeSection === "revenue" && (
              <div className="space-y-6">
                <RevenueTracking stationId={user.stationId || 1} />
              </div>
            )}

            {activeSection === "reports" && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("staff.reportsComingSoon")}
                  </h3>
                  <p className="text-gray-600">
                    {t("staff.reportsComingSoonDesc")}
                  </p>
                </div>
              </div>
            )}

            {activeSection === "queue-pro" && (
              <StaffQueueManagement 
                bookings={bookings}
                onRefreshBookings={() => {
                  console.log('Refreshing bookings...');
                  fetchQueueBookings();
                }}
              />
            )}

            {activeSection === "inventory-monitoring" && (
              <StaffInventoryMonitoring 
                stationId={user.stationId?.toString() || "station-001"}
                stationName={user.name || "Trạm của bạn"}
              />
            )}


            {activeSection === "profile" && (
              <ProfileSection user={user} dailyStats={dailyStats} />
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Dialogs */}
      <SwapProcessDialog
        isOpen={swapDialog}
        onClose={() => setSwapDialog(false)}
        onSwapConfirmed={() => {
          // Cập nhật trạng thái booking thành swap-confirmed
          if (selectedBooking) {
            const updatedBookings = bookings.map(b => 
              b.id === selectedBooking.id 
                ? { ...b, status: 1 } // 1 = CheckedIn (swap confirmed)
                : b
            );
            setBookings(updatedBookings);
          }
          setSwapDialog(false);
        }}
      />


      <POSDialog isOpen={posDialog} onClose={() => setPosDialog(false)} />

      <BatteryConditionCheck
        isOpen={batteryCheckDialog}
        onClose={() => setBatteryCheckDialog(false)}
        onApprove={(inspectionData) => {
          console.log('Battery approved:', inspectionData);
          setBatteryCheckDialog(false);
          
          // Cập nhật trạng thái booking thành ready-to-swap sau khi chấp nhận thay pin
          if (selectedBooking) {
            const updatedBookings = bookings.map(b => 
              b.id === selectedBooking.id 
                ? { ...b, status: 1 } // 1 = CheckedIn (ready to swap)
                : b
            );
            setBookings(updatedBookings);
          }
        }}
        onReject={(reason) => {
          console.log('Battery rejected:', reason);
          setBatteryCheckDialog(false);
          // Có thể thêm logic để từ chối booking
        }}
        customerInfo={selectedBooking ? {
          name: selectedBooking.customer || 'Unknown Customer',
          vehicle: selectedBooking.vehicle || 'Unknown Vehicle',
          bookingCode: selectedBooking.code || selectedBooking.id
        } : undefined}
      />

    </SidebarProvider>
  );
}
