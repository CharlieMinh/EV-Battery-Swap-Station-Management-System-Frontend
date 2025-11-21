import React, { useEffect, useState } from "react";
import { Bell, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import {
    fetchNotifications,
    markMultipleAsRead,
    getUnreadCount,
    Notification as NotificationData,
} from "@/services/admin/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useLanguage } from "../LanguageContext";
import { formatRelativeTime } from "../../utils/dateTimeUtils";

interface NotificationItemProps {
    notification: NotificationData;
    onMarkAsRead: (notification: NotificationData) => void;
    onViewDetail: (notification: NotificationData) => void;
    t: (key: string) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onMarkAsRead,
    onViewDetail,
    t,
}) => {
    const getNotificationIcon = (type: number) => {
        return AlertCircle;
    };

    const getNotificationColor = (type: number) => {
        return "text-orange-600";
    };

    const NotificationIcon = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    return (
        <div
            className={`p-3 rounded-lg mb-2 border transition-colors cursor-pointer ${notification.isRead
                    ? "bg-gray-50 hover:bg-gray-100 border-gray-200"
                    : "bg-orange-50 hover:bg-orange-100 border-orange-200"
                }`}
            onClick={(e) => {
                if (!(e.target as HTMLElement).closest('button')) {
                    onViewDetail(notification);
                }
            }}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                    <NotificationIcon className={`w-5 h-5 ${iconColor}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm text-gray-900 flex-1">
                            {notification.message}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatRelativeTime(notification.createdAt)}
                        </span>
                    </div>

                    {!notification.isRead && (
                        <div className="flex justify-end mt-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(notification);
                                }}
                            >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t("driver.notifications.markAsRead")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface DriverNotificationBellProps {
    onNavigate?: (section: string) => void;
}

export const DriverNotificationBell: React.FC<DriverNotificationBellProps> = ({
    onNavigate,
}) => {
    const { t } = useLanguage();
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadNotificationData = async () => {
        setLoading(true);
        try {
            const [notifData, unread] = await Promise.all([
                fetchNotifications(1, 50),
                getUnreadCount(1, 50),
            ]);

            setNotifications(notifData.items);
            setUnreadCount(unread);
        } catch (error) {
            console.error("Error loading notification data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotificationData();

        const interval = setInterval(loadNotificationData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsRead = async (notification: NotificationData) => {
        try {
            const idsToMark = notification.mergedIds || [notification.id];
            await markMultipleAsRead(idsToMark);

            setNotifications((prev) =>
                prev.map((n) => (idsToMark.includes(n.id) ? { ...n, isRead: true } : n))
            );

            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleViewDetail = (notification: NotificationData) => {
        setNotifOpen(false);

        if (!notification.isRead) {
            handleMarkAsRead(notification);
        }

        if (onNavigate) {
            onNavigate("complaints");
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
                <div className="p-4 border-b bg-orange-50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{t("driver.notifications.title")}</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium border border-orange-200">
                                {unreadCount} {t("driver.notifications.unread")}
                            </span>
                        )}
                    </div>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                                <p className="text-gray-600 text-sm">{t("driver.notifications.loading")}</p>
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">{t("driver.notifications.noNotifications")}</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
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
