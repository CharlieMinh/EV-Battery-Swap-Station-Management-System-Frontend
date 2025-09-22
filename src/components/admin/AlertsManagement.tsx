import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Bell,
  Filter,
  Settings,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  message: string;
  time: string;
  station: string;
}

interface AlertsManagementProps {
  alerts: Alert[];
}

export function AlertsManagement({ alerts }: AlertsManagementProps) {
  const { t } = useLanguage();

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "info":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("admin.systemAlerts")}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> {t("admin.filter")}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" /> {t("admin.settings")}
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-gray-500">{t("admin.criticalAlerts")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">5</p>
            <p className="text-sm text-gray-500">{t("admin.warningAlerts")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-gray-500">{t("admin.infoAlerts")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">94.2%</p>
            <p className="text-sm text-gray-500">{t("admin.systemHealth")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.activeAlerts")}</CardTitle>
          <CardDescription>{t("admin.activeAlertsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="font-medium">{alert.message}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-600">
                          {alert.time}
                        </span>
                        <Badge variant="outline">{alert.station}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getAlertBadgeVariant(alert.type)}>
                      {t(`admin.${alert.type}`)}
                    </Badge>
                    <Button size="sm" variant="outline">
                      {t("admin.resolve")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.alertConfiguration")}</CardTitle>
          <CardDescription>{t("admin.alertConfigurationDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">
                {t("admin.systemThresholds")}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {t("admin.batteryHealthCritical")}
                  </span>
                  <span className="text-sm font-medium">&lt; 50%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {t("admin.stationUtilization")}
                  </span>
                  <span className="text-sm font-medium">&gt; 95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t("admin.paymentFailures")}</span>
                  <span className="text-sm font-medium">&gt; 5%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">
                {t("admin.notificationSettings")}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">
                    {t("admin.emailNotifications")}
                  </span>
                  <Badge className="bg-green-100 text-green-800">
                    {t("admin.enabled")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t("admin.smsAlerts")}</span>
                  <Badge className="bg-green-100 text-green-800">
                    {t("admin.enabled")}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t("admin.slackIntegration")}</span>
                  <Badge className="bg-gray-100 text-gray-800">
                    {t("admin.disabled")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <Button className="w-full mt-6">
            <Settings className="w-4 h-4 mr-2" /> {t("admin.configureAlerts")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
