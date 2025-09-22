import React, { useState } from "react";
import { LanguageProvider } from "./components/LanguageContext";
import { Homepage } from "./components/HomePage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { DriverPortalPage } from "./components/DriverDashboard";
import { StaffPortalPage } from "./components/StaffDashboard";
import { AdminDashboardPage } from "./components/AdminDashboard";

export type UserRole = "driver" | "staff" | "admin" | null;
export type AppView = "homepage" | "login" | "register" | "portal";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>("homepage");

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView("portal");
  };

  const handleRegister = (user: User) => {
    setCurrentUser(user);
    setCurrentView("portal");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("homepage");
  };

  const handleGetStarted = () => {
    setCurrentView("login");
  };

  const handleShowLogin = () => {
    setCurrentView("login");
  };

  const handleShowRegister = () => {
    setCurrentView("register");
  };

  const handleBackToHome = () => {
    setCurrentView("homepage");
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
  };

  return (
    <LanguageProvider>
      {/* Show user portal if logged in */}
      {currentUser && currentView === "portal" ? (
        (() => {
          switch (currentUser.role) {
            case "driver":
              return (
                <DriverPortalPage user={currentUser} onLogout={handleLogout} />
              );
            case "staff":
              return (
                <StaffPortalPage user={currentUser} onLogout={handleLogout} />
              );
            case "admin":
              return (
                <AdminDashboardPage
                  user={currentUser}
                  onLogout={handleLogout}
                />
              );
            default:
              return (
                <LoginPage
                  onLogin={handleLogin}
                  onBackToHome={handleBackToHome}
                />
              );
          }
        })()
      ) : currentView === "register" ? (
        /* Show register screen */
        <RegisterPage
          onRegister={handleRegister}
          onBackToLogin={handleBackToLogin}
          onBackToHome={handleBackToHome}
        />
      ) : currentView === "login" ? (
        /* Show login screen */
        <LoginPage
          onLogin={handleLogin}
          onRegister={handleShowRegister}
          onBackToHome={handleBackToHome}
        />
      ) : (
        /* Show homepage by default */
        <Homepage onGetStarted={handleGetStarted} onLogin={handleShowLogin} />
      )}
    </LanguageProvider>
  );
}
