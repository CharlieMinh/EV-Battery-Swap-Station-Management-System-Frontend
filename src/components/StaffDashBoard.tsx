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
} from "lucide-react";
import { User } from "../App";
import staffApi, { Battery, Booking, Transaction, DailyStats } from "../services/staffApi";
import ProfileSection from "./staff/ProfileSection";

// Import staff components
import { StaffDashboard } from "./staff/StaffDashboard";
import { QueueManagement } from "./staff/QueueManagement";
import { BatteryInventory } from "./staff/BatteryInventory";
import { TransactionManagement } from "./staff/TransactionManagement";
import { SwapProcessDialog } from "./staff/SwapProcessDialog";
import { InspectionDialog } from "./staff/InspectionDialog";
import { POSDialog } from "./staff/POSDialog";

interface StaffPortalPageProps {
  user: User;
  onLogout: () => void;
}

export function StaffPortalPage({ user, onLogout }: StaffPortalPageProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("queue");
  const [selectedBattery, setSelectedBattery] = useState<string | null>(null);
  const [swapDialog, setSwapDialog] = useState(false);
  const [inspectionDialog, setInspectionDialog] = useState(false);
  const [posDialog, setPosDialog] = useState(false);
  
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
      const data = await staffApi.getQueue(user.stationId || 1);
      setBookings(data);
    } catch (error) {
      console.error('Error fetching queue bookings:', error);
      setError('Failed to load queue bookings');
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
      if (user.stationId) {
        await Promise.all([
          fetchBatteryInventory(),
          fetchQueueBookings(),
          fetchRecentTransactions()
        ]);
      } else {
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
        } catch (error) {
          console.error('Error getting staff profile:', error);
          setError('Unable to load station information');
        }
      }
    };
    loadInitialData();
  }, [user.stationId, user.id]);

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
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("queue")}
                      isActive={activeSection === "queue"}
                      className="h-[50px]"
                    >
                      <Clipboard className="w-4 h-4" />
                      <span>{t("staff.queueManagement")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("inventory")}
                      isActive={activeSection === "inventory"}
                      className="h-[50px]"
                    >
                      <Package className="w-4 h-4" />
                      <span>{t("staff.inventory")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("profile")}
                      isActive={activeSection === "profile"}
                      className="h-[50px]"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Thông Tin Cá Nhân</span>
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
                  {activeSection === "queue" && t("staff.queueManagement")}
                  {activeSection === "inventory" && t("staff.inventory")}
                  {activeSection === "transactions" && t("staff.transactions")}
                  {activeSection === "reports" && t("staff.reports")}
                  {activeSection === "profile" && "Thông Tin Cá Nhân"}
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
            {activeSection === "queue" && (
              <div className="space-y-6">
                <QueueManagement
                  bookings={bookings}
                  onStartSwap={() => setSwapDialog(true)}
                />
              </div>
            )}

            {activeSection === "inventory" && (
              <BatteryInventory
                batteries={batteries}
                selectedBattery={selectedBattery}
                onBatterySelect={setSelectedBattery}
                onNewInspection={() => setInspectionDialog(true)}
              />
            )}

            {activeSection === "transactions" && (
              <div className="space-y-6">
                <TransactionManagement
                  recentTransactions={recentTransactions}
                />
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
        onPOSDialog={() => setPosDialog(true)}
      />

      <InspectionDialog
        isOpen={inspectionDialog}
        onClose={() => setInspectionDialog(false)}
      />

      <POSDialog isOpen={posDialog} onClose={() => setPosDialog(false)} />
    </SidebarProvider>
  );
}
