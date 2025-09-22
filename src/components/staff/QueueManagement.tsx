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

interface Booking {
  id: string;
  customer: string;
  vehicle: string;
  time: string;
  code: string;
  status: "pending" | "in-progress" | "confirmed";
}

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
    <Card>
      <CardHeader>
        <CardTitle>{t("staff.todaysBookings")}</CardTitle>
        <CardDescription>{t("staff.todaysBookingsDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="font-mono text-lg">{booking.time}</p>
                    <Badge
                      variant={
                        booking.status === "in-progress"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {t(`staff.${booking.status}`)}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">{booking.customer}</p>
                    <p className="text-sm text-gray-500">{booking.vehicle}</p>
                    <p className="text-xs font-mono">{booking.code}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {booking.status === "pending" && (
                    <Button size="sm" onClick={onStartSwap}>
                      {t("staff.startSwap")}
                    </Button>
                  )}
                  {booking.status === "in-progress" && (
                    <Button size="sm" variant="outline">
                      <Clock className="w-4 h-4 mr-2" />{" "}
                      {t(`staff.${booking.status}`)}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost">
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
