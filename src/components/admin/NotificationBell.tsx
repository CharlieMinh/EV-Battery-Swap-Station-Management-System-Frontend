// NotificationBell.tsx
import React, { useEffect, useState } from "react";
import { Bell, Package, CheckCircle, XCircle, Clock, Eye, Loader2 } from "lucide-react";
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
import {
  getStockRequestById,
  StockRequest,
} from "@/services/admin/requestPin";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useLanguage } from "../LanguageContext";
import { formatRelativeTime } from "../../utils/dateTimeUtils";
import { useNavigate } from "react-router-dom";

// Type definitions
export type NotificationWithDetails = NotificationData & {
  relatedRequestIds: string[];
};

// Utility functions
const getBatteryRequestsByIds = (
  requests: BatteryRequest[],
  ids: string[]
): BatteryRequest[] => {
  return requests.filter((req) => ids.includes(req.id));
};

const getStockRequestsByIds = (
  requests: StockRequest[],
  ids: string[]
): StockRequest[] => {
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
  // Sử dụng util chung để đảm bảo timezone và relative time nhất quán
  return formatRelativeTime(dateString);
};

// Component: Notification Item
interface NotificationItemProps {
  notification: NotificationData;
  batteryRequests: BatteryRequest[];
  stockRequests: StockRequest[];
  onMarkAsRead: (notification: NotificationData) => void;
  onViewDetail: (notification: NotificationData) => void;
}

const NotificationItem: React.FC<NotificationItemProps & { t: (key: string) => string }> = ({
  notification,
  batteryRequests,
  stockRequests,
  onMarkAsRead,
  onViewDetail,
  t,
}) => {
  // Lấy relatedEntityIds từ notification đã gộp
  // Notification type 4 = StockRequestCreated (Staff gửi yêu cầu nhập pin)
  // Notification type 2 = BulkRequestConfirmed, type 3 = BulkRequestRejected (Admin xác nhận/từ chối)
  const relatedEntityIds = notification.relatedEntityIds || 
    (notification.relatedEntityId ? [notification.relatedEntityId] : []);

  // Xác định loại request dựa vào notification type
  const isStockRequest = notification.type === 4; // StockRequestCreated
  const isBatteryRequest = notification.type === 2 || notification.type === 3; // BulkRequestConfirmed/Rejected

  // Lấy requests tương ứng
  const relatedBatteryRequests = isBatteryRequest 
    ? getBatteryRequestsByIds(batteryRequests, relatedEntityIds)
    : [];
  const relatedStockRequests = isStockRequest
    ? getStockRequestsByIds(stockRequests, relatedEntityIds)
    : [];

  // Gộp tất cả requests để hiển thị
  const allRequests = [...relatedBatteryRequests, ...relatedStockRequests];

  // Group by station
  const stationGroups = allRequests.reduce((acc, req) => {
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
  }, {} as Record<string, { stationName: string; requests: (BatteryRequest | StockRequest)[] }>);

  const totalQuantity = allRequests.reduce(
    (sum, req) => sum + req.quantity,
    0
  );
  const totalBatteryTypes = allRequests.length;

  // Xác định icon và title dựa vào notification type
  const getNotificationInfo = () => {
    if (isStockRequest) {
      return {
        icon: Package,
        title: t("admin.stockRequestCreated"),
        color: "text-blue-600",
      };
    } else if (notification.type === 2) {
      return {
        icon: CheckCircle,
        title: t("admin.bulkRequestConfirmed"),
        color: "text-green-600",
      };
    } else if (notification.type === 3) {
      return {
        icon: XCircle,
        title: t("admin.bulkRequestRejected"),
        color: "text-red-600",
      };
    }
    return {
      icon: Package,
      title: t("admin.requestSend"),
      color: "text-orange-600",
    };
  };

  const notificationInfo = getNotificationInfo();
  const NotificationIcon = notificationInfo.icon;

  return (
    <div
      className={`p-3 rounded-lg mb-2 border transition-colors cursor-pointer ${
        notification.isRead
          ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
          : "bg-orange-50 hover:bg-orange-100 border-orange-200"
      }`}
      onClick={(e) => {
        // Nếu click vào notification (không phải button), navigate
        if (!(e.target as HTMLElement).closest('button')) {
          onViewDetail(notification);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <NotificationIcon className={`w-5 h-5 ${notificationInfo.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-0.5">
                {notificationInfo.title}
              </p>
              <p className="text-xs text-gray-600">
                {totalQuantity} {t("admin.batteryUnit")} ({totalBatteryTypes} {t("admin.types")})
              </p>
            </div>
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
                  // Xử lý status cho cả BatteryRequest và StockRequest
                  let statusInfo;
                  if ('status' in req && typeof req.status === 'number') {
                    // BatteryRequest với status number (0, 1, 2)
                    statusInfo = getStatusInfo(req.status, t);
                  } else if ('status' in req && typeof req.status === 'string') {
                    // StockRequest với status string ("PendingAdminReview", "Approved", "Rejected")
                    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
                      "PendingAdminReview": {
                        label: t("admin.pending"),
                        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                        icon: Clock,
                      },
                      "Approved": {
                        label: t("admin.confirmed"),
                        color: "bg-green-100 text-green-800 border-green-300",
                        icon: CheckCircle,
                      },
                      "Rejected": {
                        label: t("admin.rejected"),
                        color: "bg-red-100 text-red-800 border-red-300",
                        icon: XCircle,
                      },
                    };
                    statusInfo = statusMap[req.status] || {
                      label: t("admin.unknown"),
                      color: "bg-gray-100 text-gray-800 border-gray-300",
                      icon: Clock,
                    };
                  } else {
                    statusInfo = {
                      label: t("admin.pending"),
                      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
                      icon: Clock,
                    };
                  }
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
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [batteryRequests, setBatteryRequests] = useState<BatteryRequest[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notification data
  const loadNotificationData = async () => {
    try {
      setLoading(true);
      const [notifData, batteryRequestData, unread] = await Promise.all([
        fetchNotifications(1, 100), // fetchNotifications đã gộp thông báo trong service
        fetchBatteryRequests(),
        getUnreadCount(1, 100), // sử dụng hàm getUnreadCount có sẵn
      ]);

      // Lấy tất cả relatedEntityIds từ notifications có type 4 (StockRequestCreated)
      const stockRequestIds = new Set<string>();
      notifData.items.forEach((notif) => {
        if (notif.type === 4 && notif.relatedEntityIds) {
          notif.relatedEntityIds.forEach((id) => stockRequestIds.add(id));
        } else if (notif.type === 4 && notif.relatedEntityId) {
          stockRequestIds.add(notif.relatedEntityId);
        }
      });

      // Fetch stock requests theo ID (nếu có)
      const stockRequestPromises = Array.from(stockRequestIds).map((id) =>
        getStockRequestById(id).catch(() => null)
      );
      const stockRequestResults = await Promise.all(stockRequestPromises);
      const stockRequestData = stockRequestResults.filter(
        (req): req is StockRequest => req !== null
      );

      setNotifications(notifData.items);
      setBatteryRequests(batteryRequestData);
      setStockRequests(stockRequestData);
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

    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification);
    }

    // Navigate dựa vào notification type
    if (notification.type === 4) {
      // StockRequestCreated (Staff gửi yêu cầu nhập pin) → Navigate to "Pin" (Battery management)
      navigate("/admin", { state: { initialSection: "batteries" } });
    } else if (notification.type === 2 || notification.type === 3) {
      // BulkRequestConfirmed/Rejected (Admin xác nhận/từ chối) → Navigate to "Lịch sử gửi pin"
      navigate("/admin", { state: { initialSection: "request-history" } });
    } else {
      // Fallback: use old callback
      const notificationWithDetails: NotificationWithDetails = {
        ...notification,
        relatedRequestIds: notification.relatedEntityIds || 
          (notification.relatedEntityId ? [notification.relatedEntityId] : []),
      };
      onViewDetail(notificationWithDetails);
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
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                <p className="text-gray-600 text-sm">{t("admin.loading")}</p>
              </div>
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
                batteryRequests={batteryRequests}
                stockRequests={stockRequests}
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
