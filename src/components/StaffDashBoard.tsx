import React, { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Package,
  DollarSign,
  FileText,
  LogOut,
  User as UserIcon,
  Bell,
  Inbox,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { User } from "../App";
import { StaffDashboard } from "./staff/StaffDashboard";
import { QueueManagement } from "./staff/QueueManagement";
import { InventoryManagement } from "./staff/InventoryManagement";
import { ProfileManagement } from "./staff/ProfileManagement";
import { TransactionManagement } from "./staff/TransactionManagement";
import { RevenueTracking } from "./staff/RevenueTracking";
import { BatteryConditionCheck } from "./staff/BatteryConditionCheck";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import staffApi, {
  Battery,
  Booking,
  Transaction,
  DailyStats,
} from "../services/staffApi";
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
  fetchNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  Notification,
} from "@/services/admin/notifications";
import RequestBattery from "./staff/RequestBattery";

interface StaffPortalPageProps {
  user: User;
  onLogout: () => void;
}

export function StaffPortalPage({ user, onLogout }: StaffPortalPageProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("profile");
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    totalSwaps: 0,
    revenue: 0,
    avgSwapTime: 0,
    customerRating: 0,
    lowBatteryAlerts: 0,
    maintenanceNeeded: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        if (user.stationId) {
          const stats = await staffApi.getDailyStats(
            user.id,
            user.stationId.toString()
          );
          setDailyStats(stats);
        }
      } catch (error) {
        console.error("Error fetching daily stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDailyStats();
  }, [user.id, user.stationId]);

  const menuItems = [
    {
      id: "profile",
      label: "Thông tin cá nhân",
      icon: UserIcon,
    },
    {
      id: "queue",
      label: "Quản lý hàng chờ",
      icon: ClipboardList,
    },
    {
      id: "inventory",
      label: "Quản lý pin",
      icon: Package,
    },
    {
      id: "transaction",
      label: "Quản lý giao dịch",
      icon: FileText,
    },
    {
      id: "revenue",
      label: "Theo dõi doanh thu",
      icon: DollarSign,
    },
    {
      id: "battery-request",
      label: "Yêu cầu nhập pin",
      icon: Inbox, // Sử dụng icon Inbox để phân biệt với Quản lý pin
    },
  ];

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchNotifications(1, 10);
        setNotifications(data.items);
        const count = await getUnreadCount(1, 10);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchData();
  }, []);

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const idsToMark = notification.mergedIds?.length
        ? notification.mergedIds
        : [notification.id];
      await markMultipleAsRead(idsToMark);

      // Cập nhật local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.message === notification.message ? { ...n, isRead: true } : n
        )
      );

      // Giảm số lượng unread
      setUnreadCount((prev) => Math.max(prev - idsToMark.length, 0));

      // 👉 Đóng popover & chuyển sang tab "Yêu cầu nhập pin"
      setNotifOpen(false);
      setActiveSection("battery-request");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "profile":
        return (
          <ProfileManagement
            userId={user.id}
            stationId={user.stationId?.toString()}
          />
        );
      case "queue":
        return (
          <QueueManagement
            stationId={user.stationId?.toString() || ""}
            userId={user.id}
          />
        );
      case "inventory":
        return <InventoryManagement stationId={user.stationId?.toString()} />;
      case "transaction":
        return <TransactionManagement recentTransactions={[]} />;
      case "revenue":
        return <RevenueTracking stationId={Number(user.stationId) || 1} />;
      case "battery-request":
        return <RequestBattery />;
      default:
        return <StaffDashboard dailyStats={dailyStats} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="bg-orange-500 flex items-center p-2">
              <div className="inline-flex items-center justify-center w-8 h-8 mr-3">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg text-white font-semibold">
                  Staff Portal
                </span>
                <span className="text-sm font-medium text-gray-100">
                  EVBSS Staff
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.id)}
                        isActive={activeSection === item.id}
                        className="h-[50px]"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center p-2 space-x-2 min-w-0 bg-gray-100 rounded">
              <Avatar className="shrink-0">
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
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
                  {menuItems.find((i) => i.id === activeSection)?.label}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
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
                        {notifications.map((n) => (
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
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-300"
                >
                  Trạm #{user.stationId}
                </Badge>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">{renderContent()}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
