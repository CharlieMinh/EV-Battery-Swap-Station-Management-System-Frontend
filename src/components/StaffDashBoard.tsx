// src/pages/StaffDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  UserCircle,
  ClipboardList,
  CreditCard,
  Warehouse,
  BarChart2,
  LogOut,
  Save,
  Bell,
  BadgeCheck, // tab Xác nhận gói
  Package,
  MessageCircle, // icon cho tab Yêu cầu nhập pin
} from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { LanguageSwitcher } from "./LanguageSwitcher";
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

import ProfileManagement from "./staff/ProfileManagement";
import QueueManagement from "./staff/QueueManagement";
import Transactions from "./staff/Transactions";
import InventoryManagement from "./staff/InventoryManagement";
import Revenue from "./staff/Revenue";
import CashPaymentManagement from "./staff/CashPaymentManagement";
import RequestBattery from "../components/staff/RequestBattery";

import logo from "../assets/LogoEV2.png";
import { getMe, type UserMe } from "../services/staff/staffApi";
import {
  fetchNotifications,
  getUnreadCount,
  markMultipleAsRead,
  Notification,
} from "@/services/admin/notifications";
import { useLanguage } from "./LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import ComplaintsOfCustomer from "./admin/ComplaintsOfCustomer";
import { toast } from "react-toastify";
import SendRequestList from "./staff/SendRequestList";

type TabKey =
  | "profile"
  | "queue"
  | "transactions"
  | "inventory"
  | "requests"
  | "send-requests"
  | "revenue"
  | "approvals"
  | "complaint";

const STATION_OVERRIDE_KEY = "staffStationIdOverride";

interface StaffDashboardPageProps {
  user: { name?: string; email: string };
  onLogout: () => void;
}

export default function StaffDashboard({
  user,
  onLogout,
}: StaffDashboardPageProps) {
  const [active, setActive] = useState<TabKey>("queue");
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [overrideInput, setOverrideInput] = useState(
    localStorage.getItem(STATION_OVERRIDE_KEY) || ""
  );

  const { t } = useLanguage(); // (chưa dùng nhưng giữ nguyên logic cũ)
  const [activeSection, setActiveSection] = useState("profile"); // (chưa dùng nhưng giữ nguyên)

  const toastOpts = {
    position: "top-right" as const,
    autoClose: 2200,
    closeOnClick: true,
  };

  // ✅ Mỗi hành động chỉ hiện 1 toast (toastId)
  const TOAST_ID = {
    loadMe: "sd-loadMe",
    logout: "sd-logout",
    saveOverride: "sd-saveOverride",
    clearOverride: "sd-clearOverride",
    notifFetch: "sd-notifFetch",
    notifMark: "sd-notifMark",
  } as const;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMe();
        setMe(data);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.";
        setErr("Không thể tải thông tin người dùng. Vui lòng đăng nhập lại.");
        toast.error(msg, { ...toastOpts, toastId: TOAST_ID.loadMe });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem(STATION_OVERRIDE_KEY);
    onLogout();
    toast.info("Đã đăng xuất.", { ...toastOpts, toastId: TOAST_ID.logout });
  };

  const stationIdFromMe = me?.stationId || null;
  const stationIdOverride = localStorage.getItem(STATION_OVERRIDE_KEY);
  const stationId = stationIdFromMe ?? stationIdOverride ?? null;

  const menu = useMemo(
    () => [
      { key: "profile", label: "Thông tin cá nhân", icon: UserCircle },
      { key: "queue", label: "Quản lý hàng chờ", icon: ClipboardList },
      // { key: "transactions", label: "Giao dịch", icon: CreditCard }, // Tạm thời ẩn
      { key: "inventory", label: "Kho pin", icon: Warehouse },
      { key: "requests", label: "Yêu cầu nhận pin", icon: Package },
      { key: "send-requests", label: "Yêu cầu nhập pin", icon: Package },
      { key: "revenue", label: "Doanh thu", icon: BarChart2 },
      { key: "approvals", label: "Xác nhận thanh toán", icon: BadgeCheck },
      { key: "complaint", label: "Khiếu nại và phản hồi", icon: MessageCircle },
    ],
    []
  ) as { key: TabKey; label: string; icon: any }[];

  const saveOverride = () => {
    const v = overrideInput.trim();
    if (!v) {
      toast.warning("Vui lòng nhập StationId hợp lệ.", {
        ...toastOpts,
        toastId: TOAST_ID.saveOverride,
      });
      return;
    }
    localStorage.setItem(STATION_OVERRIDE_KEY, v);
    toast.success("Đã lưu StationId, các tab sẽ dùng giá trị này.", {
      ...toastOpts,
      toastId: TOAST_ID.saveOverride,
    });
  };

  const clearOverride = () => {
    localStorage.removeItem(STATION_OVERRIDE_KEY);
    setOverrideInput("");
    toast.info("Đã xoá StationId nhập tay.", {
      ...toastOpts,
      toastId: TOAST_ID.clearOverride,
    });
  };

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
      } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tải thông báo.";
        toast.error(msg, { ...toastOpts, toastId: TOAST_ID.notifFetch });
      }
    };
    fetchData();
  }, []); // giữ nguyên logic

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const idsToMark = notification.mergedIds?.length
        ? notification.mergedIds
        : [notification.id];
      await markMultipleAsRead(idsToMark);
      setNotifications((prev) =>
        prev.map((n) =>
          n.message === notification.message ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(prev - idsToMark.length, 0));
      setNotifOpen(false);
      setActiveSection("battery-request");
      toast.success("Đã đánh dấu đã đọc.", {
        ...toastOpts,
        toastId: TOAST_ID.notifMark,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể đánh dấu đã đọc.";
      toast.error(msg, { ...toastOpts, toastId: TOAST_ID.notifMark });
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
                  src={logo}
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
                  {menu.map((m) => (
                    <SidebarMenuItem key={m.key}>
                      <SidebarMenuButton
                        onClick={() => setActive(m.key)}
                        isActive={active === m.key}
                        className="h-[50px]"
                      >
                        <m.icon className="w-4 h-4" />
                        <span>{m.label}</span>
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
                  {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={logout}
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
                  {menu.find((m) => m.key === active)?.label ||
                    "Bảng điều khiển"}
                </h1>
              </div>

              {/* ✅ Sửa lỗi câu className ở đây */}
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
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {loading && (
              <div className="rounded-2xl bg-white shadow-lg p-5 text-sm text-gray-500">
                Đang tải…
              </div>
            )}

            {!loading && err && (
              <div className="rounded-2xl bg-white shadow-lg p-5 text-sm text-rose-600">
                {err}
              </div>
            )}

            {!loading && !err && me?.role === "Staff" && !stationIdFromMe && (
              <div className="rounded-2xl border bg-white shadow-lg p-5 mb-6">
                <div className="text-amber-700 text-lg font-semibold mb-2">
                  Không xác định được <b>stationId</b>.
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  /auth/me chưa trả về stationId. Nhập thủ công để tiếp tục:
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[260px]">
                    <label className="text-xs block mb-1">StationId</label>
                    <input
                      value={overrideInput}
                      onChange={(e) => setOverrideInput(e.target.value)}
                      placeholder="VD: 8B3E423D-7EB1-4559-B6FE-2974CC64ABDE"
                      className="border rounded px-3 py-2 w-full"
                    />
                  </div>
                  <button
                    onClick={saveOverride}
                    className="inline-flex items-center gap-2 bg-black text-white rounded px-3 py-2"
                  >
                    <Save className="h-4 w-4" /> Lưu StationId
                  </button>
                  {stationIdOverride && (
                    <button
                      onClick={clearOverride}
                      className="border rounded px-3 py-2"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            )}

            {!loading && !err && (
              <>
                {active === "profile" && <ProfileManagement />}
                {active === "queue" && (
                  <QueueManagement stationId={stationId || ""} />
                )}
                {/* {active === "transactions" && <Transactions />} */}{" "}
                {/* Tạm thời ẩn */}
                {active === "inventory" && (
                  <InventoryManagement stationId={String(stationId)} />
                )}
                {active === "requests" && <RequestBattery />}
                {active === "send-requests" && <SendRequestList />}
                {active === "revenue" && <Revenue />}
                {active === "approvals" && <CashPaymentManagement />}
                {active === "complaint" && <ComplaintsOfCustomer />}
              </>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
