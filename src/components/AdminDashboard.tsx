import React, { useState } from "react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useLanguage } from "../components/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import {
  BarChart3,
  MapPin,
  Battery,
  Users,
  UserCheck,
  Brain,
  Bell,
  LogOut,
  Zap,
  DollarSign,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";
import { User } from "../App";

// Import admin components
import { AdminOverview } from "../components/admin/AdminOverview";
import { StationManagement } from "../components/admin/StationManagement";
import { BatteryFleetManagement } from "../components/admin/BatteryFleetManagement";
import { CustomerManagement } from "../components/admin/CustomerManagement";
import { StaffManagement } from "../components/admin/StaffManagement";
import { AIInsights } from "../components/admin/AIInsights";
import { AlertsManagement } from "../components/admin/AlertsManagement";

interface AdminDashboardPageProps {
  user: User;
  onLogout: () => void;
}

export function AdminDashboardPage({
  user,
  onLogout,
}: AdminDashboardPageProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("overview");
  const [selectedTimeframe, setSelectedTimeframe] = useState("30");
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");

  // Mock data
  const revenueData = [
    { month: "Jan", revenue: 45000, swaps: 1800, growth: 5.2 },
    { month: "Feb", revenue: 52000, swaps: 2080, growth: 15.6 },
    { month: "Mar", revenue: 48000, swaps: 1920, growth: -7.7 },
    { month: "Apr", revenue: 61000, swaps: 2440, growth: 27.1 },
    { month: "May", revenue: 58000, swaps: 2320, growth: -4.9 },
    { month: "Jun", revenue: 67000, swaps: 2680, growth: 15.5 },
  ];

  const stationPerformance = [
    {
      name: "Downtown Hub",
      swaps: 456,
      revenue: 11400,
      utilization: 85,
      status: "active" as const,
    },
    {
      name: "Mall Station",
      swaps: 389,
      revenue: 9725,
      utilization: 78,
      status: "active" as const,
    },
    {
      name: "Airport Terminal",
      swaps: 234,
      revenue: 7020,
      utilization: 45,
      status: "maintenance" as const,
    },
    {
      name: "Highway Rest Stop",
      swaps: 567,
      revenue: 17010,
      utilization: 92,
      status: "active" as const,
    },
    {
      name: "University Campus",
      swaps: 298,
      revenue: 7450,
      utilization: 67,
      status: "active" as const,
    },
  ];

  const batteryHealth = [
    { range: "90-100%", count: 145, color: "#22c55e" },
    { range: "70-89%", count: 87, color: "#f59e0b" },
    { range: "50-69%", count: 23, color: "#ef4444" },
    { range: "Below 50%", count: 8, color: "#991b1b" },
  ];

  const demandForecast = [
    { time: "6AM", predicted: 12, actual: 10, confidence: 85 },
    { time: "9AM", predicted: 45, actual: 43, confidence: 92 },
    { time: "12PM", predicted: 67, actual: 71, confidence: 88 },
    { time: "3PM", predicted: 89, actual: 85, confidence: 90 },
    { time: "6PM", predicted: 134, actual: 128, confidence: 94 },
    { time: "9PM", predicted: 78, actual: 82, confidence: 87 },
  ];

  const customers = [
    {
      id: "1",
      name: "Alex Chen",
      email: "alex@email.com",
      plan: "Monthly Unlimited",
      status: "active" as const,
      swaps: 23,
      revenue: 149,
    },
    {
      id: "2",
      name: "Sarah Kim",
      email: "sarah@email.com",
      plan: "Pay Per Swap",
      status: "active" as const,
      swaps: 8,
      revenue: 200,
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@email.com",
      plan: "Enterprise",
      status: "active" as const,
      swaps: 156,
      revenue: 2400,
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily@email.com",
      plan: "Monthly Unlimited",
      status: "suspended" as const,
      swaps: 45,
      revenue: 597,
    },
  ];

  const staff = [
    {
      id: "1",
      name: "John Smith",
      role: "Station Manager",
      station: "Downtown Hub",
      performance: 95,
      status: "active" as const,
    },
    {
      id: "2",
      name: "Lisa Wang",
      role: "Technician",
      station: "Mall Station",
      performance: 88,
      status: "active" as const,
    },
    {
      id: "3",
      name: "Carlos Rodriguez",
      role: "Supervisor",
      station: "Airport Terminal",
      performance: 92,
      status: "on-leave" as const,
    },
    {
      id: "4",
      name: "Amy Foster",
      role: "Technician",
      station: "Highway Rest Stop",
      performance: 97,
      status: "active" as const,
    },
  ];

  const alerts = [
    {
      id: "1",
      type: "critical" as const,
      message: "Station B1 battery health below 50%",
      time: "2 min ago",
      station: "Downtown Hub",
    },
    {
      id: "2",
      type: "warning" as const,
      message: "High demand predicted for 6-8 PM",
      time: "15 min ago",
      station: "All Stations",
    },
    {
      id: "3",
      type: "info" as const,
      message: "Monthly revenue target achieved",
      time: "1 hour ago",
      station: "System",
    },
    {
      id: "4",
      type: "critical" as const,
      message: "Payment gateway timeout errors",
      time: "2 hours ago",
      station: "All Stations",
    },
  ];

  const kpiData = {
    totalRevenue: 267000,
    totalSwaps: 12847,
    activeStations: 24,
    totalCustomers: 8547,
    avgSwapTime: 2.8,
    systemUptime: 99.9,
    customerSatisfaction: 4.8,
    batteryEfficiency: 94.2,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="bg-orange-500 flex items-center p-2">
              <div className="inline-flex items-center justify-center w-8 h-8 mr-3">
                <img
                  src="src/assets/logoEV2.png "
                  alt="FPTFAST Logo"
                  className="w-10 h-9 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg text-white font-semibold">
                  F P T F A S T
                </span>
                <span className="text-sm font-medium text-gray-100">Admin</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("overview")}
                      isActive={activeSection === "overview"}
                      className="h-[50px]"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{t("admin.overview")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("stations")}
                      isActive={activeSection === "stations"}
                      className="h-[50px]"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t("admin.stations")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("batteries")}
                      isActive={activeSection === "batteries"}
                      className="h-[50px]"
                    >
                      <Battery className="w-4 h-4" />
                      <span>{t("admin.batteries")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("customers")}
                      isActive={activeSection === "customers"}
                      className="h-[50px]"
                    >
                      <Users className="w-4 h-4" />
                      <span>{t("admin.customers")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("staff")}
                      isActive={activeSection === "staff"}
                      className="h-[50px]"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{t("admin.staff")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("ai-insights")}
                      isActive={activeSection === "ai-insights"}
                      className="h-[50px]"
                    >
                      <Brain className="w-4 h-4" />
                      <span>{t("admin.aiInsights")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("alerts")}
                      isActive={activeSection === "alerts"}
                      className="h-[50px]"
                    >
                      <Bell className="w-4 h-4" />
                      <span>{t("admin.alerts")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center p-2 space-x-2 min-w-0 bg-gray-100 rounded">
              <Avatar className="shrink-0">
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={onLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          {/* Header */}
          <header className="bg-gray-50 border-b border-gray-200 sticky top-0 z-40">
            <div className="flex justify-between items-center h-16 px-4">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-orange-600">
                  {activeSection === "overview" && t("admin.overview")}
                  {activeSection === "stations" && t("admin.stations")}
                  {activeSection === "batteries" && t("admin.batteries")}
                  {activeSection === "customers" && t("admin.customers")}
                  {activeSection === "staff" && t("admin.staff")}
                  {activeSection === "ai-insights" && t("admin.aiInsights")}
                  {activeSection === "alerts" && t("admin.alerts")}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 text-white flex items-center justify-center">
                    3
                  </Badge>
                </Button>
              </div>
            </div>
          </header>

          {/* System Overview KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 m-6 mb-8">
            <Card>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.totalRevenue")}
                    </p>
                    <p className="text-2xl font-bold">
                      ${kpiData.totalRevenue.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+12.5%</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.totalSwaps")}
                    </p>
                    <p className="text-2xl font-bold">
                      {kpiData.totalSwaps.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+8.3%</span>
                    </div>
                  </div>
                  <Battery className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.activeStations")}
                    </p>
                    <p className="text-2xl font-bold">
                      {kpiData.activeStations}
                    </p>
                    <div className="flex items-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">
                        {t("admin.allOnline")}
                      </span>
                    </div>
                  </div>
                  <MapPin className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">
                      {t("admin.customers")}
                    </p>
                    <p className="text-2xl font-bold">
                      {kpiData.totalCustomers.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">
                        +156 {t("admin.newCustomers")}
                      </span>
                    </div>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {activeSection === "overview" && (
              <AdminOverview
                revenueData={revenueData}
                batteryHealth={batteryHealth}
                kpiData={kpiData}
              />
            )}

            {activeSection === "stations" && (
              <StationManagement stationPerformance={stationPerformance} />
            )}

            {activeSection === "batteries" && (
              <BatteryFleetManagement
                selectedTimeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
              />
            )}

            {activeSection === "customers" && (
              <CustomerManagement
                customers={customers}
                searchQuery={customerSearchQuery}
                onSearchChange={setCustomerSearchQuery}
              />
            )}

            {activeSection === "staff" && <StaffManagement staff={staff} />}

            {activeSection === "ai-insights" && (
              <AIInsights demandForecast={demandForecast} />
            )}

            {activeSection === "alerts" && <AlertsManagement alerts={alerts} />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
