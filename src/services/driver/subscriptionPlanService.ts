import axios from "axios";


export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  maxSwapsPerMonth: number | null; 
  benefits: string;
  batteryModelName: string;
  isActive: boolean;
}

const API_BASE_URL = "http://localhost:5194"; 

class SubscriptionPlanService {

  async getActivePlans(): Promise<SubscriptionPlan[]> {
    try {
     
      const response = await axios.get(`${API_BASE_URL}/api/v1/subscription-plans`, {
        params: {
          isActive: true, 
        },
       
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách gói cước:", error);
      return []; 
    }
  }
}

export const subscriptionPlanService = new SubscriptionPlanService();

