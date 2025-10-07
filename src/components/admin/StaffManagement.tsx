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
import { Progress } from "../ui/progress";
import { Eye, Edit, Plus, Filter } from "lucide-react";
import { useLanguage } from "../LanguageContext";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  station: string;
  performance: number;
  status: "active" | "on-leave";
}

interface StaffManagementProps {
  staff: StaffMember[];
}

export function StaffManagement({ staff }: StaffManagementProps) {
  const { t } = useLanguage();

  const getPerformanceColor = (performance: number) => {
    if (performance >= 95) return "text-green-600";
    if (performance >= 85) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-orange-600">
          {t("admin.staffManagement")}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> {t("admin.filter")}
          </Button>
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-4 h-4" /> {t("admin.addStaff")}
          </Button>
        </div>
      </div>

      <Card className="border border-orange-200 rounded-lg">
        <CardHeader>
          <CardTitle className="text-orange-600">
            {"Danh sách nhân viên"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg border border-orange-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.role}</p>
                    <p className="text-xs text-gray-400">{member.station}</p>
                    <Badge
                      className={
                        member.status === "active"
                          ? "bg-green-400 text-white"
                          : "bg-red-500 text-white "
                      }
                    >
                      {t(`admin.${member.status}`)}
                    </Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex flex-col items-center text-center">
                    <div className="">
                      <p
                        className={`text-sm font-medium ${getPerformanceColor(
                          member.performance
                        )}`}
                      >
                        {member.performance}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("admin.performance")}
                      </p>
                    </div>
                  </div>
                  {/* <div className="flex space-x-2">
                    <Progress
                      value={member.performance}
                      className="w-20 h-2 bg-orange-100 [&>div]:bg-orange-500"
                    />
                  </div> */}
                  <div className="flex justify-center space-x-2 mt-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
