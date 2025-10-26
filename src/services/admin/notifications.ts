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

export async function fetchNotifications(
  page: number,
  pageSize: number
): Promise<NotificationResponse> {
  const res = await api.get("/api/notifications", { params: { page, pageSize } });
  const data = res.data as NotificationResponse;

  // Gộp theo thời gian (đến từng giây)
  const grouped: Record<string, Notification> = {};

  data.items.forEach((item) => {
    // Làm tròn createdAt đến từng giây (loại bỏ phần mili)
    const createdAtSecond = new Date(item.createdAt);
    createdAtSecond.setMilliseconds(0);
    const timeKey = createdAtSecond.toISOString();

    // Dùng thời gian làm khóa gộp (bỏ message)
    if (!grouped[timeKey]) {
      grouped[timeKey] = { ...item, mergedIds: [item.id] };
    } else {
      grouped[timeKey].mergedIds!.push(item.id);

      // Nếu muốn gộp nội dung message lại cho hiển thị, có thể nối thêm
      grouped[timeKey].message += `\n${item.message}`;
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

  // Gộp thông báo theo thời gian (đến từng giây)
  const grouped: Record<string, Notification> = {};

  data.items.forEach((item) => {
    const createdAtSecond = new Date(item.createdAt);
    createdAtSecond.setMilliseconds(0); // làm tròn đến từng giây
    const timeKey = createdAtSecond.toISOString();

    if (!grouped[timeKey]) {
      grouped[timeKey] = { ...item };
    } else {
      // Nếu trong cùng khung thời gian mà có bất kỳ thông báo chưa đọc => cả nhóm coi như chưa đọc
      grouped[timeKey].isRead = grouped[timeKey].isRead && item.isRead;
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

export async function fetchRequest() {
    
}
