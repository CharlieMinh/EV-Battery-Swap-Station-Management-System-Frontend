import React, { useEffect, useState } from "react";
import { LanguageProvider } from "./components/LanguageContext";
import { Homepage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgotPassword } from "./components/ForgotPassword";
import { DriverPortalPage } from "./components/DriverDashboard";
import { StaffPortalPage } from "./components/StaffDashBoard";
import { AdminDashboardPage } from "./components/AdminDashboard";
import { PricingPage } from "./components/PricingPage";
import { PaymentPage } from "./components/PaymentPage";
import { PaymentCallback } from "./components/PaymentCallback";
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
  stationId?: number;
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
        setCurrentUser(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          // Không có JWT trong cookie → user chưa đăng nhập → KHÔNG PHẢI lỗi nặng
          console.warn("Chưa đăng nhập (401). Bỏ qua, set user = null.");
          setCurrentUser(null);
        } else {
          console.error("Lỗi khác khi gọi /me:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
    } catch {}
    setCurrentUser(null);
  };

  if (loading) return <p>Loading...</p>; // chờ xác thực xong mới render
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
                onRegister={() => {}}
                onBackToHome={() => {}}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterPage
                onRegister={handleRegister}
                onBackToHome={() => {}}
                onBackToLogin={() => {}}
              />
            }
          />
          <Route path="/forgot-password" element={<ForgotPasswordWrapper />} />
          <Route
            path="/pricing"
            element={<PricingPage user={currentUser} onLogout={handleLogout} />}
          />
          <Route
            path="/payment"
            element={<PaymentPage />}
          />
          <Route
            path="/payment/callback"
            element={<PaymentCallback />}
          />
          <Route
            path="/payment/return"
            element={<PaymentCallback />}
          />
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
                <Navigate to="/login" />
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
