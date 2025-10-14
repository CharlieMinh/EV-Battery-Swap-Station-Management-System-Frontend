import axios from '../configs/axios';

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

/**
 * API cho đăng nhập bằng Google
 */
export const googleLogin = async (idToken: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>('/api/v1/auth/google-login', {
    idToken,
  });
  return response.data;
};

/**
 * API cho đăng nhập thông thường
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>('/api/v1/auth/login', data);
  return response.data;
};

/**
 * API cho đăng ký
 */
export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>('/api/v1/auth/register', data);
  return response.data;
};

/**
 * API cho đăng xuất
 */
export const logout = async (): Promise<void> => {
  await axios.post('/api/v1/auth/logout');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * API lấy thông tin user hiện tại
 */
export const getCurrentUser = async (): Promise<any> => {
  const response = await axios.get('/api/v1/auth/me');
  return response.data;
};

/**
 * Kiểm tra xem user đã đăng nhập chưa
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

/**
 * Lấy token từ localStorage
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Lấy thông tin user từ localStorage
 */
export const getUserInfo = (): { name: string; role: string } | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};
