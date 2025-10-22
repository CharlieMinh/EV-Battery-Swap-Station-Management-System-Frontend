import api from '../configs/axios';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price?: number;
  currency?: string;
  billingPeriod?: string; // 'per_swap', 'monthly', 'custom'
  features?: string[];
  isPopular?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // API fields
  monthlyPrice?: number;
  maxSwapsPerMonth?: number;
  requiresContract?: boolean;
  requiresDeposit?: boolean;
  depositAmount?: number;
  benefits?: string;
  refundPolicy?: string;
  batteryModel?: {
    id: string;
    name: string;
    voltage: number;
    capacityWh: number;
  };
  billingCycleDays?: number;
}

export interface SubscriptionPlanPricing {
  id: string;
  subscriptionPlanId: string;
  price: number;
  currency: string;
  billingPeriod: string;
  discountPercentage?: number;
  isActive: boolean;
  validFrom: string;
  validTo?: string;
}

export interface SubscriptionPlansResponse {
  items?: SubscriptionPlan[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  // Fallback for different API response formats
  data?: SubscriptionPlan[];
  plans?: SubscriptionPlan[];
}

// API trả về mảng trực tiếp, không phải object
export type SubscriptionPlansApiResponse = SubscriptionPlan[] | SubscriptionPlansResponse;

// Get all subscription plans
export const getSubscriptionPlans = async (
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<SubscriptionPlansApiResponse> => {
  try {
    const response = await api.get('/api/v1/subscription-plans', {
      params: {
        pageNumber,
        pageSize
      }
    });
    console.log('Phản hồi API subscription plans:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Get subscription plan by ID
export const getSubscriptionPlanById = async (id: string): Promise<SubscriptionPlan> => {
  try {
    const response = await api.get(`/api/v1/subscription-plans/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    throw error;
  }
};

// Get subscription plan pricing by ID
export const getSubscriptionPlanPricing = async (id: string): Promise<SubscriptionPlanPricing> => {
  try {
    const response = await api.get(`/api/v1/subscription-plans/${id}/pricing`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plan pricing:', error);
    throw error;
  }
};

// Get all subscription plans with their pricing
export const getSubscriptionPlansWithPricing = async (): Promise<(SubscriptionPlan & { pricing: SubscriptionPlanPricing })[]> => {
  try {
    const plansResponse = await getSubscriptionPlans(1, 100); // Get all plans
    console.log('Phản hồi API cho các gói cước:', plansResponse); // Debug log
    
    // Handle different API response formats - API trả về mảng trực tiếp
    let plans: SubscriptionPlan[] = [];
    if (Array.isArray(plansResponse)) {
      plans = plansResponse;
    } else {
      plans = plansResponse?.items || plansResponse?.data || plansResponse?.plans || [];
    }
    console.log('Danh sách gói cước được xử lý:', plans);
    
    const plansWithPricing = await Promise.all(
      plans.map(async (plan) => {
        try {
          // Tạo pricing data từ API data
          const pricing: SubscriptionPlanPricing = {
            id: `pricing-${plan.id}`,
            subscriptionPlanId: plan.id,
            price: plan.monthlyPrice || plan.price || 0,
            currency: plan.currency || 'VND',
            billingPeriod: plan.billingPeriod || (plan.monthlyPrice ? 'monthly' : 'per_swap'),
            isActive: plan.isActive || true,
            validFrom: plan.createdAt || new Date().toISOString()
          };
          
          // Sử dụng benefits từ API data
          let features: string[] = [];
          if (plan.benefits) {
            // Chuyển đổi benefits string thành array
            features = plan.benefits
              .split('\n')
              .map(benefit => benefit.trim())
              .filter(benefit => benefit.length > 0)
              .map(benefit => benefit.replace(/^[•\-\*]\s*/, '')); // Loại bỏ bullet points
          } else {
            // Fallback features nếu không có benefits
            features = [
              plan.maxSwapsPerMonth ? `Tối đa ${plan.maxSwapsPerMonth} lần thay/tháng` : 'Thay pin không giới hạn',
              plan.requiresDeposit ? `Yêu cầu cọc ${plan.depositAmount?.toLocaleString('vi-VN')} VND` : 'Không cần cọc',
              'Truy cập tất cả các trạm',
              'Bao gồm ứng dụng di động'
            ];
          }
          
          return { 
            ...plan, 
            pricing,
            features,
            isPopular: plan.name.toLowerCase().includes('premium') || 
                      plan.name.toLowerCase().includes('vip') ||
                      plan.name.toLowerCase().includes('unlimited') || 
                      plan.name.toLowerCase().includes('không giới hạn')
          };
        } catch (error) {
          console.warn(`Could not process plan ${plan.id}:`, error);
          return { ...plan, pricing: null };
        }
      })
    );
    return plansWithPricing.filter(plan => plan.pricing !== null);
  } catch (error) {
    console.error('Error fetching subscription plans with pricing:', error);
    
    // Fallback data khi API không hoạt động
    console.log('Sử dụng dữ liệu fallback...');
    return [
      {
        id: 'fallback-1',
        name: 'Trả Theo Lần Thay',
        description: 'Hoàn hảo cho người dùng thỉnh thoảng',
        price: 25,
        currency: 'USD',
        billingPeriod: 'per_swap',
        features: [
          'Không cam kết hàng tháng',
          'Chỉ trả khi thay pin',
          'Truy cập tất cả các trạm',
          'Bao gồm ứng dụng di động'
        ],
        isPopular: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pricing: {
          id: 'fallback-pricing-1',
          subscriptionPlanId: 'fallback-1',
          price: 25,
          currency: 'USD',
          billingPeriod: 'per_swap',
          isActive: true,
          validFrom: new Date().toISOString()
        }
      },
      {
        id: 'fallback-2',
        name: 'Không Giới Hạn Hàng Tháng',
        description: 'Tốt nhất cho người đi làm thường xuyên',
        price: 149,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: [
          'Thay pin không giới hạn',
          'Đặt chỗ ưu tiên',
          'Hỗ trợ khách hàng 24/7',
          'Giảm giá 10% phụ kiện'
        ],
        isPopular: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pricing: {
          id: 'fallback-pricing-2',
          subscriptionPlanId: 'fallback-2',
          price: 149,
          currency: 'USD',
          billingPeriod: 'monthly',
          isActive: true,
          validFrom: new Date().toISOString()
        }
      },
      {
        id: 'fallback-3',
        name: 'Doanh Nghiệp',
        description: 'Cho đội xe và doanh nghiệp',
        price: 0,
        currency: 'USD',
        billingPeriod: 'custom',
        features: [
          'Giảm giá theo số lượng',
          'Quản lý tài khoản chuyên dụng',
          'Giải pháp thanh toán tùy chỉnh',
          'Truy cập trạm ưu tiên'
        ],
        isPopular: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pricing: {
          id: 'fallback-pricing-3',
          subscriptionPlanId: 'fallback-3',
          price: 0,
          currency: 'USD',
          billingPeriod: 'custom',
          isActive: true,
          validFrom: new Date().toISOString()
        }
      }
    ];
  }
};
