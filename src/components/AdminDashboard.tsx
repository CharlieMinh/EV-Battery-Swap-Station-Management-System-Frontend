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

  // Notification states
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [batteryRequests, setBatteryRequests] = useState<BatteryRequest[]>([]);

  // Mock data
  const revenueData = [
    { month: "Jan", revenue: 45_000, swaps: 1800, growth: 5.2 },
    { month: "Feb", revenue: 52_000, swaps: 2080, growth: 15.6 },
    { month: "Mar", revenue: 48_000, swaps: 1920, growth: -7.7 },
    { month: "Apr", revenue: 61_000, swaps: 2440, growth: 27.1 },
    { month: "May", revenue: 58_000, swaps: 2320, growth: -4.9 },
    { month: "Jun", revenue: 67_000, swaps: 2680, growth: 15.5 },
  ];

  const batteryHealth = [
    { range: "90-100%", count: 145, color: "#22c55e" },
    { range: "70-89%", count: 87, color: "#f59e0b" },
    { range: "50-69%", count: 23, color: "#ef4444" },
    { range: "Below 50%", count: 8, color: "#991b1b" },
  ];

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

  const kpiData = {
    totalRevenue: 267000,
    totalSwaps: 12847,
    activeStations: 24,
    totalCustomers: 8547,
    avgSwapTime: 2.8,
    systemUptime: 99.9,
    customerSatisfaction: 4.8,
    batteryEfficiency: 94.2,
  };

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
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="bg-orange-500 flex items-center p-2">
              <div className="inline-flex items-center justify-center w-8 h-8 mr-3">
                <img
                  src="src/assets/logoEV2.png"
                  alt="FPTFAST Logo"
                  className="w-10 h-9 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg text-white font-semibold">
                  F P T F A S T
                </span>
                <span className="text-sm font-medium text-gray-100">Admin</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("overview")}
                      isActive={activeSection === "overview"}
                      className="h-[50px]"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{t("admin.overview")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("stations")}
                      isActive={activeSection === "stations"}
                      className="h-[50px]"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t("admin.stations")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("batteries")}
                      isActive={activeSection === "batteries"}
                      className="h-[50px]"
                    >
                      <Battery className="w-4 h-4" />
                      <span>{t("admin.batteries")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("customers")}
                      isActive={activeSection === "customers"}
                      className="h-[50px]"
                    >
                      <Users className="w-4 h-4" />
                      <span>{t("admin.customers")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("staff")}
                      isActive={activeSection === "staff"}
                      className="h-[50px]"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{t("admin.staff")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("add-account")}
                      isActive={activeSection === "add-account"}
                      className="h-[50px]"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Thêm người dùng</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("request-history")}
                      isActive={activeSection === "request-history"}
                      className="h-[50px]"
                    >
                      <Package className="w-4 h-4" />
                      <span>Lịch sử yêu cầu</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("complaint")}
                      isActive={activeSection === "complaint"}
                      className="h-[50px]"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Phản hồi và khiếu nại</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("profile")}
                      isActive={activeSection === "profile"}
                      className="h-[50px]"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span>Thông tin cá nhân</span>
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
                  {activeSection === "overview" && t("admin.overview")}
                  {activeSection === "stations" && t("admin.stations")}
                  {activeSection === "batteries" && t("admin.batteries")}
                  {activeSection === "customers" && t("admin.customers")}
                  {activeSection === "staff" && t("admin.staff")}
                  {activeSection === "add-account" && "Thêm người dùng"}
                  {activeSection === "request-history" &&
                    "Lịch sử yêu cầu gửi pin"}
                  {activeSection === "complaint" && "Phản hồi và khiếu nại"}
                  {activeSection === "profile" && "Thông tin cá nhân"}
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
                      Thông báo
                    </h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        Không có thông báo nào
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
                                Gộp {n.mergedIds.length} thông báo
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 m-6 mb-0">
            <Card className="border border-orange-200 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.totalRevenue")}
                    </p>
                    <p className="text-2xl font-bold">
                      {totalRevenue?.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                  {/* Thay biểu tượng bằng chữ VND */}
                  <span className="text-green-500 font-semibold text-lg">
                    VND
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.totalSwaps")}
                    </p>
                    <p className="text-2xl font-bold">{totalSwaps}</p>
                  </div>
                  <Battery className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.activeStations")}
                    </p>
                    <p className="text-2xl font-bold">
                      {activeStations !== null ? activeStations : "…"}
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.customers")}
                    </p>
                    <p className="text-2xl font-bold">
                      {totalCustomers !== null ? totalCustomers : "..."}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {activeSection === "overview" && (
              <AdminOverview batteryHealth={batteryHealth} kpiData={kpiData} />
            )}

            {activeSection === "stations" && <StationManagement />}

            {activeSection === "batteries" && <BatteryFleetManagement />}

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
