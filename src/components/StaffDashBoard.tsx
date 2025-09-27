import React, { useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageContext";
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
} from "./ui/sidebar";
import {
  Clipboard,
  Package,
  Receipt,
  BarChart3,
  LogOut,
  Zap,
  Bell,
} from "lucide-react";
import { User } from "../App";

// Import staff components
import { StaffDashboard } from "./staff/StaffDashboard";
import { QueueManagement } from "./staff/QueueManagement";
import { BatteryInventory } from "./staff/BatteryInventory";
import { TransactionManagement } from "./staff/TransactionManagement";
import { SwapProcessDialog } from "./staff/SwapProcessDialog";
import { InspectionDialog } from "./staff/InspectionDialog";
import { POSDialog } from "./staff/POSDialog";

interface StaffPortalPageProps {
  user: User;
  onLogout: () => void;
}

export function StaffPortalPage({ user, onLogout }: StaffPortalPageProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("queue");
  const [selectedBattery, setSelectedBattery] = useState<string | null>(null);
  const [swapDialog, setSwapDialog] = useState(false);
  const [inspectionDialog, setInspectionDialog] = useState(false);
  const [posDialog, setPosDialog] = useState(false);

  const batteries = [
    {
      id: "1",
      slot: "A1",
      status: "full" as const,
      health: 95,
      voltage: 400,
      cycles: 1250,
      lastSwap: "10 min ago",
      model: "TM3-75kWh",
      temperature: 25,
    },
    {
      id: "2",
      slot: "A2",
      status: "charging" as const,
      health: 92,
      voltage: 380,
      cycles: 1180,
      lastSwap: "2 hours ago",
      model: "TM3-75kWh",
      temperature: 28,
    },
    {
      id: "3",
      slot: "A3",
      status: "full" as const,
      health: 88,
      voltage: 395,
      cycles: 1650,
      lastSwap: "1 hour ago",
      model: "BMW-80kWh",
      temperature: 24,
    },
    {
      id: "4",
      slot: "B1",
      status: "maintenance" as const,
      health: 65,
      voltage: 320,
      cycles: 2800,
      lastSwap: "1 day ago",
      model: "TM3-75kWh",
      temperature: 35,
    },
    {
      id: "5",
      slot: "B2",
      status: "charging" as const,
      health: 90,
      voltage: 370,
      cycles: 1420,
      lastSwap: "30 min ago",
      model: "BMW-80kWh",
      temperature: 26,
    },
    {
      id: "6",
      slot: "B3",
      status: "full" as const,
      health: 96,
      voltage: 398,
      cycles: 980,
      lastSwap: "5 min ago",
      model: "BMW-80kWh",
      temperature: 23,
    },
  ];

  const bookings = [
    {
      id: "1",
      customer: "Alex Chen",
      vehicle: "Tesla Model 3",
      time: "15:30",
      code: "SW-2024-001",
      status: "pending" as const,
    },
    {
      id: "2",
      customer: "Sarah Kim",
      vehicle: "BMW iX3",
      time: "16:00",
      code: "SW-2024-002",
      status: "in-progress" as const,
    },
    {
      id: "3",
      customer: "Mike Johnson",
      vehicle: "Nissan Leaf",
      time: "16:30",
      code: "SW-2024-003",
      status: "confirmed" as const,
    },
    {
      id: "4",
      customer: "Emily Davis",
      vehicle: "Tesla Model Y",
      time: "17:00",
      code: "SW-2024-004",
      status: "confirmed" as const,
    },
  ];

  const recentTransactions = [
    {
      id: "1",
      customer: "Alex Chen",
      vehicle: "Tesla Model 3",
      time: "14:32",
      batteryOut: "A1",
      batteryIn: "B2",
      amount: 25,
      paymentMethod: "subscription" as const,
    },
    {
      id: "2",
      customer: "Sarah Kim",
      vehicle: "BMW iX3",
      time: "14:15",
      batteryOut: "A3",
      batteryIn: "B1",
      amount: 25,
      paymentMethod: "card" as const,
    },
    {
      id: "3",
      customer: "Mike Johnson",
      vehicle: "Nissan Leaf",
      time: "13:58",
      batteryOut: "B3",
      batteryIn: "A2",
      amount: 25,
      paymentMethod: "cash" as const,
    },
  ];

  const dailyStats = {
    totalSwaps: 47,
    revenue: 1175,
    avgSwapTime: 2.8,
    customerRating: 4.8,
    lowBatteryAlerts: 3,
    maintenanceNeeded: 1,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center p-2">
              <div className="inline-flex items-center justify-center w-8 h-8 mr-3">
                <img
                  src="src/assets/logoEV2.png "
                  alt="FPTFAST Logo"
                  className="w-10 h-9 rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold">F P T F A S T</span>
                <span className="text-sm font-medium text-gray-500">Staff</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("queue")}
                      isActive={activeSection === "queue"}
                    >
                      <Clipboard className="w-4 h-4" />
                      <span>{t("staff.queueManagement")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("inventory")}
                      isActive={activeSection === "inventory"}
                    >
                      <Package className="w-4 h-4" />
                      <span>{t("staff.inventory")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("transactions")}
                      isActive={activeSection === "transactions"}
                    >
                      <Receipt className="w-4 h-4" />
                      <span>{t("staff.transactions")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveSection("reports")}
                      isActive={activeSection === "reports"}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>{t("staff.reports")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center p-2 space-x-2 min-w-0">
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
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="flex justify-between items-center h-16 px-4">
              <div className="flex items-center space-x-2">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-gray-900">
                  {activeSection === "queue" && t("staff.queueManagement")}
                  {activeSection === "inventory" && t("staff.inventory")}
                  {activeSection === "transactions" && t("staff.transactions")}
                  {activeSection === "reports" && t("staff.reports")}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <Button variant="ghost" size="icon">
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Dashboard KPIs */}
          <StaffDashboard dailyStats={dailyStats} />

          {/* Main Content */}
          <main className="flex-1 p-6">
            {activeSection === "queue" && (
              <div className="space-y-6">
                <QueueManagement
                  bookings={bookings}
                  onStartSwap={() => setSwapDialog(true)}
                />
              </div>
            )}

            {activeSection === "inventory" && (
              <BatteryInventory
                batteries={batteries}
                selectedBattery={selectedBattery}
                onBatterySelect={setSelectedBattery}
                onNewInspection={() => setInspectionDialog(true)}
              />
            )}

            {activeSection === "transactions" && (
              <div className="space-y-6">
                <TransactionManagement
                  recentTransactions={recentTransactions}
                />
              </div>
            )}

            {activeSection === "reports" && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("staff.reportsComingSoon")}
                  </h3>
                  <p className="text-gray-600">
                    {t("staff.reportsComingSoonDesc")}
                  </p>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Dialogs */}
      <SwapProcessDialog
        isOpen={swapDialog}
        onClose={() => setSwapDialog(false)}
        onPOSDialog={() => setPosDialog(true)}
      />

      <InspectionDialog
        isOpen={inspectionDialog}
        onClose={() => setInspectionDialog(false)}
      />

      <POSDialog isOpen={posDialog} onClose={() => setPosDialog(false)} />
    </SidebarProvider>
  );
}
