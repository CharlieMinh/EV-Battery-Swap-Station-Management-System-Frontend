import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../configs/axios';

interface GoogleLoginButtonProps {
  onSuccess?: (response: { token: string; role: string; name: string }) => void;
  onError?: (error: any) => void;
}

// Định nghĩa type cho Google API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google && googleButtonRef.current) {
        // Lấy Client ID từ environment variable hoặc dùng giá trị mặc định
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '289474717245-ct0v1be2bqt09v9km4kbv9mbqa8199gl.apps.googleusercontent.com';
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%',
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Google ID Token received:', response.credential);

      // Gọi API backend để xác thực
      const result = await axios.post('/api/v1/auth/google-login', {
        idToken: response.credential,
      });

      const { token, role, name } = result.data;

      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ name, role }));

      console.log('Login successful:', { name, role });

      // Gọi callback nếu có
      if (onSuccess) {
        onSuccess({ token, role, name });
      }

      // Điều hướng theo role
      switch (role.toLowerCase()) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'staff':
          navigate('/staff/dashboard');
          break;
        case 'driver':
        default:
          navigate('/driver/dashboard');
          break;
      }
    } catch (error: any) {
      console.error('Google login failed:', error);
      
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Đăng nhập Google thất bại. Vui lòng thử lại.';

      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  };

  return (
    <div className="w-full">
      <div ref={googleButtonRef} className="w-full"></div>
    </div>
  );
};

export default GoogleLoginButton;
