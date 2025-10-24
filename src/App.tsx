import React, { useEffect, useState } from "react";
import { LanguageProvider } from "./components/LanguageContext";
import { Homepage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgotPassword } from "./components/ForgotPassword";
import { DriverPortalPage } from "./components/DriverDashboard";
import { StaffPortalPage } from "./components/StaffDashBoard";
import { AdminDashboardPage } from "./components/AdminDashboard";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import MapView from "./components/map/MapView";
import api from "./configs/axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export type UserRole = "Driver" | "Staff" | "Admin" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  stationId?: number | string;
}

// Wrapper component to use navigate in ForgotPassword
function ForgotPasswordWrapper() {
  const navigate = useNavigate();
  return <ForgotPassword onBackToLogin={() => navigate("/login")} />;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/v1/Auth/me", {
          withCredentials: true,
        });
        console.log('🔍 User from /me:', response.data);
        setCurrentUser(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Không có JWT trong cookie → user chưa đăng nhập → KHÔNG PHẢI lỗi nặng
          console.warn("Chưa đăng nhập (401). Bỏ qua, set user = null.");
          setCurrentUser(null);
        } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
          // Backend không chạy hoặc không kết nối được
          console.warn("Backend không khả dụng. Chạy ứng dụng ở chế độ offline.");
          setCurrentUser(null);
        } else {
          console.error("Lỗi khác khi gọi /me:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("API call timeout. Setting loading to false.");
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    fetchUser();

    return () => clearTimeout(timeout);
  }, []);
  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleRegister = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/Auth/logout", {}, { withCredentials: true }); // Xóa cookie trên backend
    } catch { }
    setCurrentUser(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải ứng dụng...</p>
      </div>
    </div>
  );
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<Homepage user={currentUser} onLogout={handleLogout} />}
          />
          <Route
            path="/login"
            element={
              <LoginPage
                onLogin={handleLogin}
                onRegister={() => { }}
                onBackToHome={() => { }}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterPage
                onRegister={handleRegister}
                onBackToHome={() => { }}
                onBackToLogin={() => { }}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordWrapper />} />
          <Route
            path="/driver"
            element={
              currentUser?.role === "Driver" ? (
                <DriverPortalPage user={currentUser} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/staff"
            element={
              currentUser?.role === "Staff" ? (
                <StaffPortalPage user={currentUser} onLogout={handleLogout} />
              ) : (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-orange-600 mb-4">Chưa đăng nhập</h1>
                    <p className="text-gray-600 mb-4">Bạn cần đăng nhập với tài khoản Staff để truy cập trang này</p>
                    <a href="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg">
                      Đăng nhập
                    </a>
                  </div>
                </div>
              )
            }
          />
          <Route
            path="/admin"
            element={
              currentUser?.role === "Admin" ? (
                <AdminDashboardPage
                  user={currentUser}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/map" element={<MapView />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
