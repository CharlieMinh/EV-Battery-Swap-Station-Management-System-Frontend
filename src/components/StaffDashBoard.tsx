// src/pages/StaffDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UserCircle,
  ClipboardList,
  CreditCard,
  Warehouse,
  BarChart2,
  LogOut,
  Save,
  Bell,
  BadgeCheck, // tab Xác nhận thanh toán
  Package,
  MessageCircle, // icon cho tab Khiếu nại
  UserPlus, // 🔹 icon cho tab Tạo khách hàng (Driver)
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
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
import CashPaymentManagement from "./staff/CashPaymentManagement";
import RequestBattery from "../components/staff/RequestBattery";
import SendRequestList from "./staff/SendRequestList";

// 🔹 TÁCH RIÊNG:
// - StaffAddDriver: màn tạo khách hàng (Driver)
// - StaffCustomerManagement: màn quản lý khách hàng của trạm
import StaffAddDriver from "./staff/StaffAddDriver";
import StaffCustomerManagement from "./staff/StaffCustomerManagement";
import Revenue from "./staff/Revenue";

import logo from "../assets/LogoEV2.png";
import { getMe, type UserMe } from "../services/staff/staffApi";
import { getCurrentUser } from "../services/authApi";
import {
  fetchNotifications,
  getUnreadCount,
  markMultipleAsRead,
  Notification,
} from "@/services/admin/notifications";
import {
  fetchBatteryRequests,
  BatteryRequest,
} from "@/services/admin/batteryService";
import { useLanguage } from "./LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import ComplaintsOfCustomer from "./admin/ComplaintsOfCustomer";
import { toast } from "react-toastify";
import { formatRelativeTime } from "../utils/dateTimeUtils";

type TabKey =
  | "profile"
  | "queue"
  | "transactions"
  | "inventory"
  | "requests"
  | "send-requests"
  | "approvals"
  | "complaint"
  // 🔹 TAB TẠO KHÁCH HÀNG (Driver)
  | "staff-add-driver"
  // 🔹 TAB QUẢN LÝ KHÁCH HÀNG (Driver)
  | "staff-customers"
  // 🔹 TAB DOANH THU
  | "revenue";

const STATION_OVERRIDE_KEY = "staffStationIdOverride";

interface StaffDashboardPageProps {
  user: { name?: string; email: string };
  onLogout: () => void;
}

export default function StaffDashboard({
  user,
  onLogout,
}: StaffDashboardPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState<TabKey>("queue");
  
  // Set active tab từ navigation state
  useEffect(() => {
    if (location.state?.initialSection) {
      setActive(location.state.initialSection as TabKey);
    }
  }, [location.state]);
  const [me, setMe] = useState<UserMe | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
        const msg = e?.response?.data?.message || e?.message || t("staff.dashboard.toastLoadMeError");
        setErr(t("staff.dashboard.errLoadMe"));
        toast.error(msg, { ...toastOpts, toastId: TOAST_ID.loadMe });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch current user data với avatar từ auth/me
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await getCurrentUser();
        setCurrentUser(data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem(STATION_OVERRIDE_KEY);
    onLogout();
  };

  const stationIdFromMe = me?.stationId || null;
  const stationIdOverride = localStorage.getItem(STATION_OVERRIDE_KEY);
  const stationId = stationIdFromMe ?? stationIdOverride ?? null;

  const menu = useMemo(
    () => [
      { key: "queue", label: t("staff.dashboard.menu.queue"), icon: ClipboardList },
      // 🔹 TAB TẠO KHÁCH HÀNG (Driver) RIÊNG
      {
        key: "staff-add-driver",
        label: t("staff.dashboard.menu.addDriver"),
        icon: UserPlus,
      },
      // 🔹 TAB QUẢN LÝ KHÁCH HÀNG (Driver)
      {
        key: "staff-customers",
        label: t("staff.dashboard.menu.customers"),
        icon: ClipboardList,
      },
      // { key: "transactions", label: "Giao dịch", icon: CreditCard }, // Tạm thời ẩn
      { key: "inventory", label: t("staff.dashboard.menu.inventory"), icon: Warehouse },
      { key: "requests", label: t("staff.dashboard.menu.requests"), icon: Package },
      { key: "send-requests", label: t("staff.dashboard.menu.sendRequests"), icon: Package },
      { key: "approvals", label: t("staff.dashboard.menu.approvals"), icon: BadgeCheck },
      { key: "revenue", label: t("staff.revenue.title"), icon: BarChart2 },
      { key: "complaint", label: t("staff.dashboard.menu.complaint"), icon: MessageCircle },
      { key: "profile", label: t("staff.dashboard.menu.profile"), icon: UserCircle },
    ],
    [t]
  ) as { key: TabKey; label: string; icon: any }[];

  const saveOverride = () => {
    const v = overrideInput.trim();
    if (!v) {
      toast.warning(t("staff.dashboard.toastStationIdRequired"), {
        ...toastOpts,
        toastId: TOAST_ID.saveOverride,
      });
      return;
    }
    localStorage.setItem(STATION_OVERRIDE_KEY, v);
    toast.success(t("staff.dashboard.toastStationIdSaved"), {
      ...toastOpts,
      toastId: TOAST_ID.saveOverride,
    });
  };

  const clearOverride = () => {
    localStorage.removeItem(STATION_OVERRIDE_KEY);
    setOverrideInput("");
    toast.info(t("staff.dashboard.toastStationIdCleared"), {
      ...toastOpts,
      toastId: TOAST_ID.clearOverride,
    });
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [batteryRequests, setBatteryRequests] = useState<BatteryRequest[]>([]);

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
          t("staff.dashboard.toastLoadNotificationsError");
        toast.error(msg, { ...toastOpts, toastId: TOAST_ID.notifFetch });
      }
    };
    fetchData();
  }, []); // giữ nguyên logic

  // Load danh sách yêu cầu nhận pin (bulk-create-requests) cho staff để hiển thị chi tiết (model + số lượng)
  useEffect(() => {
    const loadBatteryRequests = async () => {
      try {
        const data = await fetchBatteryRequests();
        setBatteryRequests(data);
      } catch (error) {
        console.error("Error loading battery requests for staff bell:", error);
      }
    };
    loadBatteryRequests();
  }, []);

  // Reload battery requests khi mở popover để đảm bảo có dữ liệu mới nhất
  useEffect(() => {
    if (notifOpen) {
      const loadBatteryRequests = async () => {
        try {
          const data = await fetchBatteryRequests();
          setBatteryRequests(data);
        } catch (error) {
          console.error("Error reloading battery requests for staff bell:", error);
        }
      };
      loadBatteryRequests();
    }
  }, [notifOpen]);

  const getNotificationInfo = (n: Notification) => {
    // Đồng bộ kiểu hiển thị giống bên admin (dùng các key admin.* luôn cho tiện)
    if (n.type === 1) {
      // BulkRequestCreated (Admin tạo yêu cầu gửi pin cho staff)
      return {
        icon: Package,
        title: t("admin.bulkRequestCreated"),
        color: "text-blue-600",
      };
    }
    if (n.type === 2) {
      // BulkRequestConfirmed (Admin xác nhận và gửi pin cho staff)
      return {
        icon: CheckCircle,
        title: t("admin.bulkRequestConfirmed"),
        color: "text-green-600",
      };
    }
    if (n.type === 3) {
      // BulkRequestRejected (Admin từ chối yêu cầu)
      return {
        icon: XCircle,
        title: t("admin.bulkRequestRejected"),
        color: "text-red-600",
      };
    }
    if (n.type === 4) {
      // StockRequestCreated (staff gửi yêu cầu nhập pin)
      return {
        icon: Package,
        title: t("admin.stockRequestCreated"),
        color: "text-blue-600",
      };
    }
    if (n.type === 5) {
      // StockRequestApproved
      return {
        icon: CheckCircle,
        title: t("admin.bulkRequestConfirmed"),
        color: "text-green-600",
      };
    }
    if (n.type === 6) {
      // StockRequestRejected
      return {
        icon: XCircle,
        title: t("admin.bulkRequestRejected"),
        color: "text-red-600",
      };
    }
    return {
      icon: Bell,
      title: t("admin.notifications"),
      color: "text-slate-600",
    };
  };

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      const idsToMark = notification.mergedIds?.length
        ? notification.mergedIds
        : [notification.id];

      await markMultipleAsRead(idsToMark);

      setNotifications((prev) =>
        prev.map((n) =>
          idsToMark.includes(n.id) ? { ...n, isRead: true } : n
        )
      );

      setUnreadCount((prev) => Math.max(prev - idsToMark.length, 0));

      // Đóng popover và chuyển sang tab "Yêu cầu nhận pin"
      setNotifOpen(false);
      setActive("requests");

      toast.success(t("staff.dashboard.toastMarkReadSuccess"), {
        ...toastOpts,
        toastId: TOAST_ID.notifMark,
      });
    } catch (error: any) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          t("staff.dashboard.toastMarkReadError");
        toast.error(msg, { ...toastOpts, toastId: TOAST_ID.notifMark });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-slate-50 flex w-full">
        <Sidebar className="bg-white text-slate-900 border-r border-slate-200 shadow-2xl w-80">
          <SidebarHeader className="p-5 border-b border-slate-200">
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-100">
                <img
                  src={logo}
                  alt="FPTFAST Logo"
                  className="w-11 h-10 rounded-xl"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-wide">
                  FPTFAST
                </span>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  Staff
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 py-4">
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {menu.map((m) => (
                    <SidebarMenuItem key={m.key}>
                      <SidebarMenuButton
                        onClick={() => setActive(m.key)}
                        isActive={active === m.key}
                        className="h-12 rounded-2xl bg-white/5 text-sm font-medium text-slate-800 transition hover:bg-white/70 hover:text-slate-900 data-[active=true]:bg-white data-[active=true]:text-slate-900 data-[active=true]:shadow-xl"
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
          <SidebarFooter className="px-4 pb-4">
            <div className="flex items-center p-3 space-x-3 min-w-0 bg-white rounded-2xl border border-white shadow-sm">
              <Avatar className="shrink-0">
                <AvatarImage
                  src={
                    currentUser?.profilePictureUrl
                      ? `${currentUser.profilePictureUrl}?v=${Date.now()}`
                      : me?.avatarUrl || me?.profilePictureUrl
                      ? `${me.avatarUrl || me.profilePictureUrl}?v=${Date.now()}`
                      : undefined
                  }
                  alt={currentUser?.name || user.name || user.email}
                />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-slate-500 truncate uppercase tracking-wide">
                  Staff
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-orange-100 sticky top-0 z-40 shadow-sm">
            <div className="flex justify-between items-center h-16 px-6">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-orange-600">
                  {menu.find((m) => m.key === active)?.label ||
                    "Bảng điều khiển"}
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
                      {t("staff.dashboard.notificationsTitle")}
                    </h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        {t("admin.noNotifications")}
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((n) => {
                          const info = getNotificationInfo(n);
                          const Icon = info.icon;

                          // Lấy tất cả relatedEntityIds giống bên admin (gộp nhiều request cùng lúc)
                          const relatedIds =
                            n.relatedEntityIds && n.relatedEntityIds.length > 0
                              ? n.relatedEntityIds
                              : n.relatedEntityId
                              ? [n.relatedEntityId]
                              : [];

                          // Xác định loại request dựa vào notification type
                          // Type 1 = BulkRequestCreated (Admin tạo yêu cầu gửi pin cho staff)
                          // Type 2, 3 = BulkRequestConfirmed/Rejected (Admin xác nhận/từ chối)
                          // Type 4 = StockRequest (Staff gửi yêu cầu nhập pin)
                          const isBatteryRequest = n.type === 1 || n.type === 2 || n.type === 3;
                          
                          // Tìm các battery request tương ứng với notification
                          // Đảm bảo lấy đầy đủ tất cả các loại pin từ relatedIds
                          const relatedRequests = isBatteryRequest
                            ? batteryRequests.filter((br) =>
                                relatedIds.includes(br.id)
                              )
                            : [];

                          // Debug: Kiểm tra xem có thiếu request nào không
                          if (isBatteryRequest && relatedIds.length > 0 && relatedRequests.length < relatedIds.length) {
                            const missingIds = relatedIds.filter(id => !batteryRequests.some(br => br.id === id));
                            if (missingIds.length > 0) {
                              console.warn(`Missing battery requests for notification ${n.id}:`, missingIds);
                            }
                          }

                          // Group theo station
                          const stationGroups = relatedRequests.reduce((acc, req) => {
                            const stationId = req.stationId;
                            const stationName = req.stationName;
                            
                            if (!acc[stationId]) {
                              acc[stationId] = {
                                stationName,
                                requests: [],
                              };
                            }
                            acc[stationId].requests.push(req);
                            return acc;
                          }, {} as Record<string, { stationName: string; requests: BatteryRequest[] }>);

                          const totalQuantity = relatedRequests.reduce(
                            (sum, req) => sum + req.quantity,
                            0
                          );
                          const totalTypes = relatedRequests.length;

                          // Lấy tên người gửi (lấy từ request đầu tiên, vì cùng một admin gửi)
                          // Nếu không có request, parse từ message
                          let senderName: string | null = null;
                          if (relatedRequests.length > 0) {
                            senderName = relatedRequests[0].requestedByAdminName;
                          } else {
                            // Parse từ message: 
                            // "✅ Admin EVBSS Admin 1 đã duyệt..." 
                            // "New bulk create request for 4 batteries from admin EVBSS Admin 1 is awaiting confirmation."
                            const adminMatch = n.message.match(/Admin\s+([^đã\s]+(?:\s+[^đã\s]+)*)/i) || 
                                              n.message.match(/from admin\s+([^is]+?)(?:\s+is|\s+đã|$)/i);
                            if (adminMatch && adminMatch[1]) {
                              senderName = adminMatch[1].trim();
                            }
                          }

                          // Title chỉ hiển thị tên người gửi (theo yêu cầu)
                          const displayTitle = senderName || info.title;

                          return (
                            <div
                              key={n.id}
                              onClick={() => handleMarkAsRead(n)}
                              className={`p-3 rounded-lg cursor-pointer mb-2 border transition-colors ${
                                n.isRead
                                  ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
                                  : "bg-orange-50 hover:bg-orange-100 border-orange-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 shrink-0">
                                  <Icon
                                    className={`w-5 h-5 ${info.color}`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {/* Title với tên người gửi */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 mb-0.5">
                                        {displayTitle}
                                      </p>
                                      {relatedRequests.length > 0 && (
                                        <p className="text-xs text-gray-600">
                                          {totalQuantity} {t("admin.batteryUnit")} ({totalTypes} {t("admin.types")})
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                      {formatRelativeTime(n.createdAt)}
                                    </span>
                                  </div>

                                  {/* Chi tiết từng loại pin - group theo station giống bên admin */}
                                  {relatedRequests.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                      {Object.values(stationGroups).map((group, idx) => (
                                        <div key={idx} className="mb-2 last:mb-0">
                                          <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                                            <span className="font-medium">📍 {group.stationName}</span>
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {group.requests.map((req) => (
                                              <div
                                                key={req.id}
                                                className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-md border border-gray-200 hover:border-orange-300 transition-colors"
                                              >
                                                <Package className="w-4 h-4 text-orange-500 shrink-0" />
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-xs font-semibold text-gray-900">
                                                    {req.batteryModelName
                                                      .replace("Battery Pack", "")
                                                      .trim()}
                                                  </span>
                                                  <span className="text-xs font-bold text-orange-600">
                                                    ×{req.quantity}
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Fallback: nếu không map được battery request thì hiển thị message gốc */}
                                  {relatedRequests.length === 0 && (
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {n.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                {t("staff.dashboard.loading")}
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
                {active === "approvals" && <CashPaymentManagement />}
                {active === "revenue" && <Revenue role="Staff" stationId={stationId} />}
                {active === "complaint" && <ComplaintsOfCustomer />}
                {/* 🔹 TAB TẠO KHÁCH HÀNG (Driver) RIÊNG */}
                {active === "staff-add-driver" && <StaffAddDriver />}
                {/* 🔹 TAB QUẢN LÝ KHÁCH HÀNG (Driver) */}
                {active === "staff-customers" && <StaffCustomerManagement />}
              </>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
