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
  MessageCircle,
  Phone,
  FileText,
  AlertCircle,
  Clock,
  HeadphonesIcon,
} from "lucide-react";
import { useLanguage } from "../LanguageContext";

export function DriverSupport() {
  const { t } = useLanguage();

  const supportOptions = [
    {
      icon: MessageCircle,
      title: t("driver.liveChat"),
      description: t("driver.liveChatDesc"),
      availability: t("driver.available247"),
      action: t("driver.startChat"),
    },
    {
      icon: Phone,
      title: t("driver.phoneSupport"),
      description: t("driver.phoneSupportDesc"),
      availability: t("driver.available6am10pm"),
      action: t("driver.callNow"),
    },
    {
      icon: FileText,
      title: t("driver.helpCenter"),
      description: t("driver.helpCenterDesc"),
      availability: t("driver.selfService"),
      action: t("driver.browse"),
    },
  ];

  const faqItems = [
    {
      question: t("driver.faq1Question"),
      answer: t("driver.faq1Answer"),
    },
    {
      question: t("driver.faq2Question"),
      answer: t("driver.faq2Answer"),
    },
    {
      question: t("driver.faq3Question"),
      answer: t("driver.faq3Answer"),
    },
  ];

  const recentTickets = [
    {
      id: "T-2024-001",
      subject: "Battery swap incomplete",
      status: "resolved",
      date: "2024-01-15",
      priority: "high",
    },
    {
      id: "T-2024-002",
      subject: "Payment not processed",
      status: "in-progress",
      date: "2024-01-12",
      priority: "medium",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Contact Support */}
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-500 font-bold">
            <HeadphonesIcon className="w-5 h-5" />
            <span>{t("driver.contactSupport")}</span>
          </CardTitle>
          <CardDescription>{t("driver.contactSupportDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {supportOptions.map((option, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <option.icon className="w-8 h-8 text-blue-500" />
                  <div>
                    <h3 className="font-medium">{option.title}</h3>
                    <p className="text-sm text-gray-500">
                      {option.description}
                    </p>
                    <p className="text-xs text-green-600">
                      {option.availability}
                    </p>
                  </div>
                </div>
                <Button>{option.action}</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Support Tickets */}
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className=" text-orange-500 font-bold">{t("driver.recentTickets")}</CardTitle>
          <CardDescription>{t("driver.recentTicketsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-gray-500">
                      {ticket.id} • {ticket.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      ticket.status === "resolved" ? "default" : "secondary"
                    }
                    className={
                      ticket.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : ""
                    }
                  >
                    {t(`driver.${ticket.status}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            {t("driver.viewAllTickets")}
          </Button>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className=" text-orange-500 font-bold">{t("driver.frequentlyAsked")}</CardTitle>
          <CardDescription>{t("driver.frequentlyAskedDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0">
                <h4 className="font-medium mb-2">{item.question}</h4>
                <p className="text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            {t("driver.viewAllFAQ")}
          </Button>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="border border-orange-500 rounded-lg">
        <CardHeader>
          <CardTitle className=" text-orange-500 font-bold">{t("driver.systemStatus")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>{t("driver.paymentGateway")}</span>
              <Badge className="bg-green-100 text-green-800">
                {t("driver.operational")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("driver.stationNetwork")}</span>
              <Badge className="bg-green-100 text-green-800">
                {t("driver.operational")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("driver.mobileApp")}</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {t("driver.maintenance")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
