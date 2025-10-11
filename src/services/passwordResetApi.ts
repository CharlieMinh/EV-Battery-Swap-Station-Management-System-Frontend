import api from '../configs/axios';

// ====== INTERFACES ======

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  maskedEmail?: string;
  expiresAt?: string;
  requestId?: string; // Để track request
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  tempToken?: string;
  remainingAttempts?: number; // Số lần thử còn lại
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: string;
  maxRequests: number;
}

// ====== API CONFIGURATION ======

const API_ENDPOINTS = {
  FORGOT_PASSWORD: '/v1/Auth/forgot-password',
  VERIFY_OTP: '/v1/Auth/verify-otp', 
  RESET_PASSWORD: '/v1/Auth/reset-password'
} as const;

const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;

// ====== UTILITY FUNCTIONS ======

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async <T>(
  requestFn: () => Promise<T>, 
  maxRetries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;
      
      // Không retry cho lỗi client (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Retry với exponential backoff
      if (attempt < maxRetries) {
        await delay(Math.pow(2, attempt) * 1000); // 2s, 4s, 8s
      }
    }
  }
  
  throw lastError;
};

const handleApiError = (error: any): ApiError => {
  if (error.response?.data) {
    return error.response.data;
  }
  
  return {
    error: {
      code: 'NETWORK_ERROR',
      message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
      details: error.message
    }
  };
};

// ====== MAIN API ======

export const passwordResetApi = {
  // Bước 1: Yêu cầu OTP
  forgotPassword: async (request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    try {
      const response = await retryRequest(async () => {
        return await api.post<ForgotPasswordResponse>(
          API_ENDPOINTS.FORGOT_PASSWORD, 
          {
            email: request.email.trim().toLowerCase()
          },
          {
            timeout: REQUEST_TIMEOUT,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw handleApiError(error);
    }
  },

  // Bước 2: Xác thực OTP
  verifyOtp: async (request: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    try {
      const response = await api.post<VerifyOtpResponse>(
        API_ENDPOINTS.VERIFY_OTP,
        {
          email: request.email.trim().toLowerCase(),
          otp: request.otp.trim()
        },
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      throw handleApiError(error);
    }
  },

  // Bước 3: Đặt lại mật khẩu
  resetPassword: async (request: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    try {
      const response = await api.post<ResetPasswordResponse>(
        API_ENDPOINTS.RESET_PASSWORD,
        {
          email: request.email.trim().toLowerCase(),
          otp: request.otp.trim(),
          newPassword: request.newPassword,
          confirmPassword: request.confirmPassword
        },
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw handleApiError(error);
    }
  },

  // ====== UTILITY METHODS ======

  // Kiểm tra email format
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Kiểm tra OTP format
  validateOtp: (otp: string): boolean => {
    return /^\d{6}$/.test(otp);
  },

  // Kiểm tra độ mạnh mật khẩu
  validatePassword: (password: string) => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    return {
      isValid: Object.values(checks).every(Boolean),
      checks
    };
  },

  // Mask email để hiển thị
  maskEmail: (email: string): string => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  },

  // Format thời gian countdown
  formatCountdown: (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // Kiểm tra rate limit từ response headers
  getRateLimitInfo: (response: any): RateLimitInfo | null => {
    const headers = response.headers;
    if (headers['x-ratelimit-remaining']) {
      return {
        remaining: parseInt(headers['x-ratelimit-remaining']),
        resetTime: headers['x-ratelimit-reset'] || '',
        maxRequests: parseInt(headers['x-ratelimit-limit']) || 3
      };
    }
    return null;
  }
};

// Export default
export default passwordResetApi;