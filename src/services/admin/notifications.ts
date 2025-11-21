import api from "@/configs/axios";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: number;
  relatedEntityId?: string;
  mergedIds?: string[]; // notification IDs đã gộp
  relatedEntityIds?: string[]; // request IDs từ các notification đã gộp
}

export interface NotificationResponse {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
}

export async function fetchNotifications(
  page: number,
  pageSize: number
): Promise<NotificationResponse> {
  const res = await api.get("/api/notifications", { params: { page, pageSize } });
  const data = res.data as NotificationResponse;

  // Gộp theo type + thời gian (đến từng giây)
  // Key: `${type}-${timeKey}` để gộp các notification cùng loại và cùng thời gian
  const grouped: Record<string, Notification & { relatedEntityIds: string[] }> = {};

  data.items.forEach((item) => {
    // Làm tròn createdAt đến từng giây (loại bỏ phần mili)
    const createdAtSecond = new Date(item.createdAt);
    createdAtSecond.setMilliseconds(0);
    const timeKey = createdAtSecond.toISOString();
    
    // Key gộp: type + thời gian (để gộp các notification cùng loại và cùng thời gian)
    const groupKey = `${item.type}-${timeKey}`;

    if (!grouped[groupKey]) {
      grouped[groupKey] = { 
        ...item, 
        mergedIds: [item.id],
        relatedEntityIds: item.relatedEntityId ? [item.relatedEntityId] : []
      };
    } else {
      // Gộp notification IDs
      grouped[groupKey].mergedIds!.push(item.id);
      
      // Gộp relatedEntityIds (request IDs) để lấy tất cả requests liên quan
      if (item.relatedEntityId && !grouped[groupKey].relatedEntityIds.includes(item.relatedEntityId)) {
        grouped[groupKey].relatedEntityIds.push(item.relatedEntityId);
      }
    }
  });

  // Sắp xếp mới nhất lên đầu
  const mergedItems = Object.values(grouped).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { ...data, items: mergedItems };
}

export async function getUnreadCount(page: number, pageSize: number): Promise<number> {
  const res = await api.get("/api/notifications", { params: { page, pageSize } });
  const data = res.data as NotificationResponse;

  // Gộp thông báo theo type + thời gian (đến từng giây) - giống với fetchNotifications
  const grouped: Record<string, Notification> = {};

  data.items.forEach((item) => {
    const createdAtSecond = new Date(item.createdAt);
    createdAtSecond.setMilliseconds(0); // làm tròn đến từng giây
    const timeKey = createdAtSecond.toISOString();
    
    // Key gộp: type + thời gian (để gộp các notification cùng loại và cùng thời gian)
    const groupKey = `${item.type}-${timeKey}`;

    if (!grouped[groupKey]) {
      grouped[groupKey] = { ...item };
    } else {
      // Nếu trong cùng khung thời gian và cùng type mà có bất kỳ thông báo chưa đọc => cả nhóm coi như chưa đọc
      grouped[groupKey].isRead = grouped[groupKey].isRead && item.isRead;
    }
  });

  // Đếm số nhóm chưa đọc
  const unreadCount = Object.values(grouped).filter((n) => !n.isRead).length;
  return unreadCount;
}


export async function markAsRead(id: string): Promise<void> {
  await api.post(`/api/notifications/${id}/mark-as-read`);
}

export async function markMultipleAsRead(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => api.post(`/api/notifications/${id}/mark-as-read`)));
}

