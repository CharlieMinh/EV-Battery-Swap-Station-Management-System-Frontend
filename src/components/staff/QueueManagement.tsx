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
import { Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { Booking } from "../../services/staffApi";

interface QueueManagementProps {
  bookings: Booking[];
  onStartSwap: () => void;
}

export function QueueManagement({
  bookings,
  onStartSwap,
}: QueueManagementProps) {
  const { t } = useLanguage();

  return (
    <Card className="border border-orange-200 rounded-lg shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="text-orange-600 text-2xl font-bold">
          {t("staff.todaysBookings")}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t("staff.todaysBookingsDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="border border-orange-100 rounded-lg bg-gray-50 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="font-mono text-lg text-orange-600 font-bold">{booking.time}</p>
                    <Badge
                      variant={
                        booking.status === "in-progress"
                          ? "default"
                          : "secondary"
                      }
                      className={
                        booking.status === "pending"
                          ? "bg-yellow-500 text-white"
                          : booking.status === "in-progress"
                          ? "bg-blue-500 text-white"
                          : "bg-green-500 text-white"
                      }
                    >
                      {t(`staff.${booking.status}`)}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium text-black">{booking.customer}</p>
                    <p className="text-sm text-gray-500">{booking.vehicle}</p>
                    <p className="text-xs font-mono text-gray-400">{booking.code}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {booking.status === "pending" && (
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg" onClick={onStartSwap}>
                      {t("staff.startSwap")}
                    </Button>
                  )}
                  {booking.status === "in-progress" && (
                    <Button size="sm" variant="outline" className="rounded-lg">
                      <Clock className="w-4 h-4 mr-2" />
                      {t(`staff.${booking.status}`)}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="rounded-lg">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
