import React, { useState } from "react";
import { LanguageProvider } from "./components/LanguageContext";
import { Homepage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ForgetPassword } from "./components/ForgetPassword";
import { DriverPortalPage } from "./components/DriverDashboard";
import { StaffPortalPage } from "./components/StaffDashBoard";
import { AdminDashboardPage } from "./components/AdminDashboard";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MapView from "./components/map/MapView";

export type UserRole = "Driver" | "Staff" | "Admin" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  stationId?: number;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleRegister = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
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
          <Route
            path="/forgot-password"
            element={<ForgetPassword />}
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
          // Fallback: Nếu không khớp với bất kỳ route nào, chuyển hướng về
          trang chủ
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
