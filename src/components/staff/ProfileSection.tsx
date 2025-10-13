import React from 'react';
import { User, MapPin, Phone, Mail, Calendar, Clock, TrendingUp, Star } from 'lucide-react';
import { DailyStats } from '../../services/staffApi';
import { useLanguage } from '../LanguageContext';

interface ProfileSectionProps {
  user: {
    id: string;
    name: string;
    email: string;
    stationId?: number;
  };
  dailyStats: DailyStats;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, dailyStats }) => {
  const { formatCurrency, t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600">{t("staff.stationStaff")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t("staff.personalInfo")}</h3>
            
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{user.email}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">+84 123 456 789</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{t("staff.startDate")} 15/01/2024</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t("staff.stationInfo")}</h3>
            
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{t("staff.station")} {user.stationId || 1} - Quận 1, TP.HCM</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{t("staff.workShift")} 8:00 - 17:00</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{t("staff.status")} {t("staff.active")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("staff.todayWorkStats")}</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{dailyStats.totalSwaps}</div>
            <div className="text-sm text-gray-600">{t("staff.swapCount")}</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(dailyStats.revenue)}</div>
            <div className="text-sm text-gray-600">{t("staff.revenue")}</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{dailyStats.avgSwapTime.toFixed(2)} phút</div>
            <div className="text-sm text-gray-600">{t("staff.avgTime")}</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">{dailyStats.customerRating.toFixed(2)}/5</span>
            </div>
            <div className="text-sm text-gray-600">{t("staff.rating")}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("staff.alertsMaintenance")}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <span className="text-red-700">{t("staff.lowBatteryNeedReplacement")}</span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {dailyStats.lowBatteryAlerts}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <span className="text-orange-700">{t("staff.maintenanceRequired")}</span>
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
              {dailyStats.maintenanceNeeded}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
