// NotificationBell.tsx
import React, { useEffect, useState } from "react";
import { Bell, Package, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import {
  fetchNotifications,
  markMultipleAsRead,
  getUnreadCount,
  Notification as NotificationData,
} from "@/services/admin/notifications";
import {
  fetchBatteryRequests,
  BatteryRequest,
} from "@/services/admin/batteryService";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useLanguage } from "../LanguageContext";

// Type definitions
export type NotificationWithDetails = NotificationData & {
  relatedRequestIds: string[];
};

// Utility functions
const getRequestsByIds = (
  requests: BatteryRequest[],
  ids: string[]
): BatteryRequest[] => {
  return requests.filter((req) => ids.includes(req.id));
};

const getStatusInfo = (status: number, t: (key: string) => string) => {
  const statusMap = {
    0: {
      label: t("admin.pending"),
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: Clock,
    },
    1: {
      label: t("admin.confirmed"),
      color: "bg-green-100 text-green-800 border-green-300",
      icon: CheckCircle,
    },
    2: {
      label: t("admin.rejected"),
      color: "bg-red-100 text-red-800 border-red-300",
      icon: XCircle,
    },
  };
  return (
    statusMap[status as keyof typeof statusMap] || {
      label: t("admin.unknown"),
      color: "bg-gray-100 text-gray-800 border-gray-300",
      icon: Clock,
    }
  );
};

const formatTimeAgo = (dateString: string, t: (key: string) => string): string => {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );

  if (seconds < 60) return t("admin.justNow");
  if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t("admin.minutesAgo")}`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t("admin.hoursAgo")}`;
  return `${Math.floor(seconds / 86400)} ${t("admin.daysAgo")}`;
};

// Component: Notification Item
interface NotificationItemProps {
  notification: NotificationData;
  requests: BatteryRequest[];
  onMarkAsRead: (notification: NotificationData) => void;
  onViewDetail: (notification: NotificationData) => void;
}

const NotificationItem: React.FC<NotificationItemProps & { t: (key: string) => string }> = ({
  notification,
  requests,
  onMarkAsRead,
  onViewDetail,
  t,
}) => {
  // Lấy relatedRequestIds từ mergedIds hoặc relatedEntityId
  const relatedRequestIds =
    (notification.mergedIds
      ?.map((id) => requests.find((r) => r.id === id)?.id)
      .filter(Boolean) as string[]) ||
    (notification.relatedEntityId ? [notification.relatedEntityId] : []);

  const relatedRequests = getRequestsByIds(requests, relatedRequestIds);

  // Group by station
  const stationGroups = relatedRequests.reduce((acc, req) => {
    if (!acc[req.stationId]) {
      acc[req.stationId] = {
        stationName: req.stationName,
        requests: [],
      };
    }
    acc[req.stationId].requests.push(req);
    return acc;
  }, {} as Record<string, { stationName: string; requests: BatteryRequest[] }>);

  const totalQuantity = relatedRequests.reduce(
    (sum, req) => sum + req.quantity,
    0
  );
  const totalBatteryTypes = relatedRequests.length;

  return (
    <div
      className={`p-3 rounded-lg mb-2 border transition-colors ${
        notification.isRead
          ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
          : "bg-orange-50 hover:bg-orange-100 border-orange-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Package className="w-5 h-5 text-orange-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-gray-900">
              {t("admin.requestSend")} {totalQuantity} {t("admin.batteryUnit")} ({totalBatteryTypes} {t("admin.types")})
            </p>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatTimeAgo(notification.createdAt, t)}
            </span>
          </div>

          {/* Station and Request Details */}
          {Object.values(stationGroups).map((group, idx) => (
            <div key={idx} className="mb-2 last:mb-0">
              <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                <span className="font-medium">📍 {group.stationName}</span>
              </p>

              <div className="flex flex-wrap gap-1.5">
                {group.requests.map((req) => {
                  const statusInfo = getStatusInfo(req.status, t);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={req.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">
                        {req.batteryModelName
                          .replace("Battery Pack", "")
                          .trim()}
                      </span>
                      <span className="font-semibold">×{req.quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail(notification);
              }}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              {t("admin.viewDetails")}
            </button>

            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification);
                }}
                className="text-xs text-gray-600 hover:text-gray-700 font-medium"
              >
                {t("admin.markAsRead")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component: NotificationBell
interface NotificationBellProps {
  onViewDetail: (notification: NotificationWithDetails) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onViewDetail,
}) => {
  const { t } = useLanguage();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [requests, setRequests] = useState<BatteryRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notification data
  const loadNotificationData = async () => {
    try {
      setLoading(true);
      const [notifData, requestData, unread] = await Promise.all([
        fetchNotifications(1, 100), // fetchNotifications đã gộp thông báo trong service
        fetchBatteryRequests(),
        getUnreadCount(1, 100), // sử dụng hàm getUnreadCount có sẵn
      ]);

      setNotifications(notifData.items);
      setRequests(requestData);
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error loading notification data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotificationData();

    // Refresh every 30 seconds
    const interval = setInterval(loadNotificationData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle mark as read
  const handleMarkAsRead = async (notification: NotificationData) => {
    try {
      // Sử dụng mergedIds nếu có, nếu không thì dùng id đơn
      const idsToMark = notification.mergedIds || [notification.id];
      await markMultipleAsRead(idsToMark);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (idsToMark.includes(n.id) ? { ...n, isRead: true } : n))
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle view detail
  const handleViewDetail = (notification: NotificationData) => {
    setNotifOpen(false);

    // Tạo NotificationWithDetails từ notification
    const notificationWithDetails: NotificationWithDetails = {
      ...notification,
      relatedRequestIds:
        (notification.mergedIds
          ?.map((id) => requests.find((r) => r.id === id)?.id)
          .filter(Boolean) as string[]) ||
        (notification.relatedEntityId ? [notification.relatedEntityId] : []),
    };

    onViewDetail(notificationWithDetails);

    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification);
    }
  };

  return (
    <Popover open={notifOpen} onOpenChange={setNotifOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white flex items-center justify-center p-0 border-0">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b bg-orange-50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{t("admin.notifications")}</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium border border-orange-200">
                {unreadCount} {t("admin.unread")}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[500px] overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {t("admin.loading")}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">{t("admin.noNotifications")}</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                requests={requests}
                onMarkAsRead={handleMarkAsRead}
                onViewDetail={handleViewDetail}
                t={t}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
