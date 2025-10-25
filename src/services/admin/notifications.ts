import api from "@/configs/axios";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: number;
  relatedEntityId?: string;
  mergedIds?: string[]; // thêm để hỗ trợ gộp nhiều id
}

export interface NotificationResponse {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
}

export async function fetchNotifications(page: number, pageSize: number): Promise<NotificationResponse> {
  const res = await api.get("/api/notifications", { params: { page, pageSize } });
  const data = res.data as NotificationResponse;

  // Gộp thông báo trùng message
  const grouped: Record<string, Notification> = {};
  data.items.forEach((item) => {
    if (!grouped[item.message]) {
      grouped[item.message] = { ...item, mergedIds: [item.id] };
    } else {
      grouped[item.message].mergedIds!.push(item.id);
    }
  });

  const mergedItems = Object.values(grouped).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { ...data, items: mergedItems };
}

export async function getUnreadCount(page: number, pageSize: number): Promise<number> {
  const res = await api.get("/api/notifications", { params: { page, pageSize } });
  const data = res.data as NotificationResponse;
  return data.items.filter((n) => !n.isRead).length;
}

export async function markAsRead(id: string): Promise<void> {
  await api.post(`/api/notifications/${id}/mark-as-read`);
}

export async function markMultipleAsRead(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => api.post(`/api/notifications/${id}/mark-as-read`)));
}
