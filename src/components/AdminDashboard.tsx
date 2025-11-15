import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  BarChart3,
  MapPin,
  Battery,
  Users,
  UserCheck,
  Bell,
  LogOut,
  Zap,
  DollarSign,
  Package,
  UserCircle,
  MessageCircle,
} from "lucide-react";
import { User } from "../App";

// Import admin components
import { AdminOverview } from "../components/admin/AdminOverview";
import { StationManagement } from "../components/admin/StationManagement";
import { BatteryFleetManagement } from "../components/admin/BatteryFleetManagement";
import { CustomerManagement } from "../components/admin/CustomerManagement";
import { StaffManagement } from "../components/admin/StaffManagement";
import { AlertsManagement } from "../components/admin/AlertsManagement";
import AddUser from "./admin/AddUser";
import { RequestForStation } from "./admin/RequestForStation";

import {
  fetchActiveStations,
  getTotalCompletedSwaps,
} from "@/services/admin/stationService";
import { fetchTotalCustomers } from "@/services/admin/customerAdminService";
import { getTotalRevenue } from "@/services/admin/payment";
import {
  fetchNotifications,
  markMultipleAsRead,
  Notification,
} from "@/services/admin/notifications";
import { fetchBatteryRequests } from "@/services/admin/batteryService";
import UserProfile from "./admin/UserProfile";
import ComplaintsOfCustomer from "./admin/ComplaintsOfCustomer";
import { SubscriptionPlansPage } from "./driver/SubscriptionPlansPage";

interface AdminDashboardPageProps {
  user: User;
  onLogout: () => void;
}

interface BatteryRequest {
  id: string;
  stationId: string;
  stationName: string;
  quantity: number;
  status: number;
  batteryModelName: string;
  updatedAt: string;
}

export function AdminDashboardPage({
  user,
  onLogout,
}: AdminDashboardPageProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("overview");

  const navigationItems = [
    { id: "overview", label: t("admin.overview"), icon: BarChart3 },
    { id: "stations", label: t("admin.stations"), icon: MapPin },
    { id: "batteries", label: t("admin.batteries"), icon: Battery },
    {
      id: "subcription-plans",
      label: t("admin.subscriptionPlans"),
      icon: DollarSign,
    },
    { id: "customers", label: t("admin.customers"), icon: Users },
    { id: "staff", label: t("admin.staff"), icon: UserCheck },
    { id: "add-account", label: t("admin.addUser"), icon: Zap },
    { id: "request-history", label: t("admin.requestHistory"), icon: Package },
    { id: "complaint", label: t("admin.complaints"), icon: MessageCircle },
    { id: "profile", label: t("admin.personalInfo"), icon: UserCircle },
  ];

  // Notification states
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [batteryRequests, setBatteryRequests] = useState<BatteryRequest[]>([]);

  const alerts = [
    {
      id: "1",
      type: "critical" as const,
      message: "Station B1 battery health below 50%",
      time: "2 min ago",
      station: "Downtown Hub",
    },
    {
      id: "2",
      type: "warning" as const,
      message: "High demand predicted for 6-8 PM",
      time: "15 min ago",
      station: "All Stations",
    },
    {
      id: "3",
      type: "info" as const,
      message: "Monthly revenue target achieved",
      time: "1 hour ago",
      station: "System",
    },
    {
      id: "4",
      type: "critical" as const,
      message: "Payment gateway timeout errors",
      time: "2 hours ago",
      station: "All Stations",
    },
  ];

  // KPI states
  const [activeStations, setActiveStations] = useState<number | null>(null);
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null);
  const [totalSwaps, setTotalSwaps] = useState<number | null>(null);

  useEffect(() => {
    async function loadActive() {
      try {
        const count = await fetchActiveStations(1, 20);
        setActiveStations(count);
      } catch (error) {
        console.log("Failed to load active stations", error);
      }
    }
    loadActive();
  }, []);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const count = await fetchTotalCustomers(1, 20);
        setTotalCustomers(count);
      } catch (error) {
        console.log("Failed to load customers", error);
      }
    }
    loadCustomers();
  }, []);

  useEffect(() => {
    async function loadSwaps() {
      try {
        const total = await getTotalCompletedSwaps();
        setTotalSwaps(total);
      } catch (error) {
        console.error(error);
      }
    }
    loadSwaps();
  }, []);

  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  useEffect(() => {
    async function loadTotals() {
      try {
        const total = await getTotalRevenue({ page: 1, pageSize: 20 });
        console.log(total);
        setTotalRevenue(total);
      } catch (error) {
        console.error(error);
      }
    }
    loadTotals();
  }, []);

  // Load battery requests
  useEffect(() => {
    async function loadBatteryRequests() {
      try {
        const requests = await fetchBatteryRequests();
        setBatteryRequests(requests);
      } catch (error) {
        console.error("Error loading battery requests:", error);
      }
    }
    loadBatteryRequests();
  }, []);

  // Load notifications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchNotifications(1, 10);
        setNotifications(data.items);

        // Count unread
        const unread = data.items.filter((n: Notification) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchData();
  }, []);

  // Format notification message với thông tin từ battery request
  const formatNotificationMessage = (
    notification: Notification,
    totalQuantity?: number
  ): string => {
    if (notification.type !== 2 || !notification.relatedEntityId) {
      return notification.message;
    }

    const batteryRequest = batteryRequests.find(
      (req) => req.id === notification.relatedEntityId
    );

    if (!batteryRequest) {
      return notification.message;
    }

    const quantity = totalQuantity || batteryRequest.quantity;

    // Format message theo status
    if (batteryRequest.status === 1) {
      return `Nhân viên trạm ${batteryRequest.stationName} đã xác nhận đủ ${quantity} pin được gửi tới`;
    } else if (batteryRequest.status === 2) {
      return `Nhân viên trạm ${batteryRequest.stationName} đã từ chối ${quantity} pin`;
    } else {
      return `Yêu cầu gửi ${quantity} pin đến ${batteryRequest.stationName} đang chờ xử lý`;
    }
  };

  // Gộp notifications theo thời gian và status
  const groupNotificationsByTime = (
    notifications: Notification[]
  ): Notification[] => {
    const grouped: Record<
      string,
      Notification & {
        totalQuantity?: number;
        stationName?: string;
        status?: number;
      }
    > = {};

    notifications.forEach((item) => {
      const batteryReq = batteryRequests.find(
        (r) => r.id === item.relatedEntityId
      );

      if (!batteryReq) return;

      // Sử dụng updatedAt của battery request để gộp (khi staff confirm/reject)
      const updatedAtSecond = new Date(batteryReq.updatedAt);
      updatedAtSecond.setMilliseconds(0);

      // Key gộp: thời gian + trạm + status (để gộp đúng các request cùng trạm, cùng status, cùng thời điểm)
      const timeKey = `${updatedAtSecond.toISOString()}-${
        batteryReq.stationId
      }-${batteryReq.status}`;

      if (!grouped[timeKey]) {
        // Tạo nhóm mới
        grouped[timeKey] = {
          ...item,
          mergedIds: [item.id],
          totalQuantity: batteryReq.quantity,
          stationName: batteryReq.stationName,
          status: batteryReq.status,
          createdAt: batteryReq.updatedAt, // Dùng updatedAt để sort đúng
        };
      } else {
        // Gộp vào nhóm đã có
        grouped[timeKey].mergedIds = [
          ...(grouped[timeKey].mergedIds || []),
          item.id,
        ];

        // Cộng dồn số lượng pin
        if (grouped[timeKey].totalQuantity !== undefined) {
          grouped[timeKey].totalQuantity! += batteryReq.quantity;
        }
      }
    });

    return Object.values(grouped)
      .map((n) => {
        if (
          n.type === 2 &&
          n.totalQuantity &&
          n.stationName &&
          n.status !== undefined
        ) {
          if (n.status === 1) {
            return {
              ...n,
              message: `Nhân viên trạm ${n.stationName} đã xác nhận đủ ${n.totalQuantity} pin được gửi tới`,
            };
          } else if (n.status === 2) {
            return {
              ...n,
              message: `Nhân viên trạm ${n.stationName} đã từ chối ${n.totalQuantity} pin`,
            };
          } else {
            return {
              ...n,
              message: `Yêu cầu gửi ${n.totalQuantity} pin đến ${n.stationName} đang chờ xử lý`,
            };
          }
        }
        return n;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  };

  // Handle mark as read
  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const idsToMark = notification.mergedIds || [notification.id];
      await markMultipleAsRead(idsToMark);

      setNotifications((prev) =>
        prev.map((n) => (idsToMark.includes(n.id) ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-slate-50 flex w-full">
        <Sidebar className="bg-white text-slate-900 border-r border-slate-200 shadow-2xl">
          <SidebarHeader className="p-5 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-100">
                <img
                  src="src/assets/logoEV2.png"
                  alt="FPTFAST Logo"
                  className="w-11 h-10 rounded-xl"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-wide">
                  FPTFAST
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  {t("admin.adminControl")}
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 py-4">
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveSection(item.id)}
                          isActive={activeSection === item.id}
                          className="h-12 rounded-2xl bg-white/5 text-sm font-medium text-slate-800 transition hover:bg-white/70 hover:text-slate-900 data-[active=true]:bg-white data-[active=true]:text-slate-900 data-[active=true]:shadow-xl"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="px-4 pb-4">
            <div className="flex items-center p-3 space-x-3 min-w-0 bg-white rounded-2xl border border-white shadow-sm">
              <Avatar className="shrink-0">
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate uppercase tracking-wide">
                  {t("role.admin")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-transparent">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-40 shadow-sm">
            <div className="flex justify-between items-center h-16 px-6">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-orange-600">
                  {activeSection === "overview" && t("admin.overview")}
                  {activeSection === "stations" && t("admin.stations")}
                  {activeSection === "batteries" && t("admin.batteries")}
                  {activeSection === "subcription-plans" && t("admin.subscriptionPlans")}
                  {activeSection === "customers" && t("admin.customers")}
                  {activeSection === "staff" && t("admin.staff")}
                  {activeSection === "add-account" && t("admin.addUser")}
                  {activeSection === "request-history" && t("admin.sendBatteryRequestHistory")}
                  {activeSection === "complaint" && t("admin.complaints")}
                  {activeSection === "profile" && t("admin.personalInfo")}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <LanguageSwitcher />

                {/* Notification Bell */}
                <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white flex items-center justify-center">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-80 p-2">
                    <h3 className="text-sm font-semibold text-orange-600 mb-2">
                      {t("admin.notifications")}
                    </h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        {t("admin.noNotifications")}
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {groupNotificationsByTime(notifications).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleMarkAsRead(n)}
                            className={`p-2 rounded-lg cursor-pointer mb-1 ${
                              n.isRead
                                ? "bg-gray-100 hover:bg-gray-200"
                                : "bg-orange-100 hover:bg-orange-200"
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {n.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(n.createdAt).toLocaleString("vi-VN")}
                            </p>
                            {n.mergedIds && n.mergedIds.length > 1 && (
                              <p className="text-xs text-orange-600 mt-1">
                                {t("admin.mergedNotifications").replace("{count}", String(n.mergedIds.length))}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </header>

          {/* System Overview KPIs */}
          {/* System Overview KPIs — chỉ hiển thị khi KHÔNG phải trang UserProfile */}
          {activeSection !== "profile" && (
            <>
              <section className="mx-6 mt-6">
                <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-pink-500 to-amber-500 text-white p-6 md:p-8 shadow-xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-white/80">
                      {t("admin.dashboardTitle")}
                    </p>
                    <p className="text-3xl font-semibold mt-1">
                      {t("admin.greetingHello").replace("{name}", user.name)}
                    </p>
                    <p className="text-sm text-white/80 mt-2 max-w-xl">
                      {t("admin.dashboardDesc")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-white text-orange-600 hover:bg-white/90 shadow-lg"
                      onClick={() => setActiveSection("stations")}
                    >
                      {t("admin.viewActiveStations")}
                    </Button>
                    <Button
                      className="bg-white text-orange-600 hover:bg-white/90 shadow-lg"
                      onClick={() => setActiveSection("request-history")}
                    >
                      {t("admin.recentRequests")}
                    </Button>
                  </div>
                </div>
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 m-6 mt-4">
                <Card className="border-0 shadow-md rounded-2xl bg-white/90">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-600">
                        VND
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {t("admin.totalRevenue")}
                    </p>
                    <p className="text-3xl font-semibold mt-2">
                      {totalRevenue?.toLocaleString("vi-VN")}₫
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md rounded-2xl bg-white/90">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-sky-100 rounded-2xl text-sky-600">
                        <Battery className="w-5 h-5" />
                      </div>
                      <Badge className="bg-sky-50 text-sky-600">
                        {t("admin.totalSwaps")}
                      </Badge>
                    </div>
                    <p className="text-3xl font-semibold">
                      {totalSwaps ?? "..."}
                    </p>

                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md rounded-2xl bg-white/90">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <Badge className="bg-purple-50 text-purple-600">
                        {t("admin.activeStations")}
                      </Badge>
                    </div>
                    <p className="text-3xl font-semibold">
                      {activeStations !== null ? activeStations : "…"}
                    </p>

                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md rounded-2xl bg-white/90">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-rose-100 rounded-2xl text-rose-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <Badge className="bg-rose-50 text-rose-600">
                        {t("admin.customers")}
                      </Badge>
                    </div>
                    <p className="text-3xl font-semibold">
                      {totalCustomers !== null ? totalCustomers : "..."}
                    </p>

                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 p-6">
            {activeSection === "overview" && <AdminOverview />}

            {activeSection === "stations" && <StationManagement />}

            {activeSection === "batteries" && <BatteryFleetManagement />}

            {activeSection === "subcription-plans" && <SubscriptionPlansPage />}

            {activeSection === "customers" && <CustomerManagement />}

            {activeSection === "staff" && <StaffManagement />}

            {activeSection === "alerts" && <AlertsManagement alerts={alerts} />}

            {activeSection === "add-account" && <AddUser />}

            {activeSection === "request-history" && <RequestForStation />}

            {activeSection === "complaint" && <ComplaintsOfCustomer />}

            {activeSection === "profile" && <UserProfile />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
