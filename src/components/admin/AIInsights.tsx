import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Brain, TrendingUp, Target, AlertCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface DemandForecast {
  time: string;
  predicted: number;
  actual: number;
  confidence: number;
}

interface AIInsightsProps {
  demandForecast: DemandForecast[];
}

export function AIInsights({ demandForecast }: AIInsightsProps) {
  const { t } = useLanguage();

  const insights = [
    {
      title: t("admin.peakDemandPrediction"),
      description: t("admin.peakDemandPredictionDesc"),
      confidence: 94,
      impact: "high",
      icon: TrendingUp,
    },
    {
      title: t("admin.batteryOptimization"),
      description: t("admin.batteryOptimizationDesc"),
      confidence: 87,
      impact: "medium",
      icon: Target,
    },
    {
      title: t("admin.maintenanceAlert"),
      description: t("admin.maintenanceAlertDesc"),
      confidence: 96,
      impact: "high",
      icon: AlertCircle,
    },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">{t("admin.aiPoweredInsights")}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.demandForecast")}</CardTitle>
            <CardDescription>{t("admin.demandForecastDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={demandForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  name={t("admin.predicted")}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  name={t("admin.actual")}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.intelligentRecommendations")}</CardTitle>
            <CardDescription>
              {t("admin.intelligentRecommendationsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <insight.icon className="w-6 h-6 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {insight.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {t("admin.confidence")}:
                          </span>
                          <span className="text-xs font-medium">
                            {insight.confidence}%
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(
                            insight.impact
                          )}`}
                        >
                          {t(`admin.${insight.impact}Impact`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Model Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.modelPerformance")}</CardTitle>
          <CardDescription>{t("admin.modelPerformanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">92.4%</p>
              <p className="text-sm text-gray-600">
                {t("admin.demandAccuracy")}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">89.1%</p>
              <p className="text-sm text-gray-600">
                {t("admin.maintenancePrediction")}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">94.7%</p>
              <p className="text-sm text-gray-600">
                {t("admin.batteryOptimization")}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">87.3%</p>
              <p className="text-sm text-gray-600">
                {t("admin.revenueForecasting")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
