import axios from "axios";

// Interface này khớp với DTO backend (dựa trên các file trước)
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  maxSwapsPerMonth: number | null; // null có nghĩa là không giới hạn
  benefits: string; // Đây là một chuỗi, ví dụ: "✓ Lợi ích 1\n✓ Lợi ích 2"
  batteryModelName: string;
  isActive: boolean;
}

// ✅ THÊM: Định nghĩa Base URL của Backend
const API_BASE_URL = "http://localhost:5194"; 

class SubscriptionPlanService {
  /**
   * Lấy tất cả các gói subscription đang được kích hoạt (public)
   */
  async getActivePlans(): Promise<SubscriptionPlan[]> {
    try {
      // ✅ SỬA LẠI: Dùng URL đầy đủ
      const response = await axios.get(`${API_BASE_URL}/api/v1/subscription-plans`, {
        params: {
          isActive: true, // Chỉ lấy các gói đang active
        },
        // Không cần withCredentials: true vì đây là API public
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách gói cước:", error);
      return []; // Trả về mảng rỗng nếu lỗi
    }
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();

