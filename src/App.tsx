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
  // useEffect(() => {
  //   const savedUser = localStorage.getItem("currentUser");
  //   const token = localStorage.getItem("authToken");

  //   if (token) {
  //     api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  //   }

  //   if (savedUser) {
  //     setCurrentUser(JSON.parse(savedUser));
  //   }
  // }, []);

  // const handleLogin = (user: User) => {
  //   setCurrentUser(user);
  // };

  // const handleRegister = (user: User) => {
  //   setCurrentUser(user);
  // };

  // const handleLogout = () => {
  //   setCurrentUser(null);
  // };
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/v1/Auth/me", {
          withCredentials: true, // gửi cookie JWT
        });
        setCurrentUser(response.data);
      } catch (error) {
        setCurrentUser(null);
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
          // Fallback: Nếu không khớp với bất kỳ route nào, chuyển hướng về
          trang chủ
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
