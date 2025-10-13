import axios, { AxiosError } from 'axios';

// Base API URL
const API_BASE_URL = 'http://localhost:5194/api/v1/Auth';


// Interfaces for API requests and responses
export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  maskedEmail?: string;
  expiresAt?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  tempToken?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  errors?: Record<string, string[]>;
  message?: string;
}

// API service class
export class PasswordResetService {
  private static instance: PasswordResetService;
  private axiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): PasswordResetService {
    if (!PasswordResetService.instance) {
      PasswordResetService.instance = new PasswordResetService();
    }
    return PasswordResetService.instance;
  }

  /**
   * Request password reset OTP
   */
  async requestPasswordReset(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      console.log('Sending forgot password request:', request);
      const response = await this.axiosInstance.post<ForgotPasswordResponse>('/forgot-password', request);
      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorData = axiosError.response?.data;
      
      console.error('Forgot password error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: errorData
      });
      
      // Handle specific error cases
      if (errorData?.error?.code === 'USER_NOT_FOUND' || errorData?.message?.includes('không tồn tại')) {
        throw {
          type: 'EMAIL_NOT_FOUND',
          message: errorData.message || 'Email không tồn tại trong hệ thống'
        };
      }
      
      if (errorData?.error?.code === 'RATE_LIMIT_EXCEEDED' || errorData?.message?.includes('quá nhiều lần')) {
        throw {
          type: 'RATE_LIMIT',
          message: errorData.message || 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.'
        };
      }

      // Handle validation errors
      if (errorData?.errors) {
        const validationErrors = Object.values(errorData.errors).flat();
        throw {
          type: 'VALIDATION_ERROR',
          message: validationErrors[0] || 'Dữ liệu không hợp lệ'
        };
      }

      throw {
        type: 'NETWORK_ERROR',
        message: 'Không thể kết nối đến server. Vui lòng thử lại.'
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      console.log('Sending verify OTP request:', { ...request, otp: '***' });
      const response = await this.axiosInstance.post<VerifyOtpResponse>('/verify-otp', request);
      console.log('Verify OTP response:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorData = axiosError.response?.data;
      
      console.error('Verify OTP error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: errorData
      });
      
      if (errorData?.error?.code === 'INVALID_OTP' || errorData?.message?.includes('OTP')) {
        throw {
          type: 'INVALID_OTP',
          message: errorData.message || 'Mã OTP không đúng hoặc đã hết hạn'
        };
      }

      if (errorData?.errors) {
        const validationErrors = Object.values(errorData.errors).flat();
        throw {
          type: 'VALIDATION_ERROR',
          message: validationErrors[0] || 'Dữ liệu không hợp lệ'
        };
      }

      throw {
        type: 'NETWORK_ERROR',
        message: 'Không thể kết nối đến server. Vui lòng thử lại.'
      };
    }
  }

  /**
   * Reset password with verified OTP
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      console.log('Sending reset password request:', { ...request, newPassword: '***', confirmPassword: '***' });
      const response = await this.axiosInstance.post<ResetPasswordResponse>('/reset-password', request);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const errorData = axiosError.response?.data;
      
      console.error('Reset password error details:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: errorData,
        request: { ...request, newPassword: '***', confirmPassword: '***' }
      });
      
      if (errorData?.error?.code === 'INVALID_OTP' || errorData?.message?.includes('OTP')) {
        throw {
          type: 'INVALID_OTP',
          message: errorData.message || 'Mã OTP không đúng hoặc đã hết hạn'
        };
      }

      if (errorData?.errors) {
        const validationErrors = Object.values(errorData.errors).flat();
        throw {
          type: 'VALIDATION_ERROR',
          message: validationErrors[0] || 'Dữ liệu không hợp lệ'
        };
      }

      // Handle 400 Bad Request with detailed message
      if (axiosError.response?.status === 400) {
        throw {
          type: 'VALIDATION_ERROR',
          message: errorData?.message || errorData?.error?.message || 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
        };
      }

      throw {
        type: 'NETWORK_ERROR',
        message: 'Không thể kết nối đến server. Vui lòng thử lại.'
      };
    }
  }
}

// Utility functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validateOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ cái in hoa');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ cái thường');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  const maskedUsername = `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}`;
  return `${maskedUsername}@${domain}`;
};

// Export singleton instance
export const passwordResetService = PasswordResetService.getInstance();