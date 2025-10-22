import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useNavigate } from 'react-router-dom';
import { 
  getSubscriptionPlansWithPricing, 
  SubscriptionPlan, 
  SubscriptionPlanPricing 
} from '../services/subscriptionService';
import { SubscriptionForm } from './SubscriptionForm';

interface PricingPageProps {
  user: any;
  onLogout: () => void;
}

export function PricingPage({ user, onLogout }: PricingPageProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<(SubscriptionPlan & { pricing: SubscriptionPlanPricing })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<(SubscriptionPlan & { pricing: SubscriptionPlanPricing }) | null>(null);
  const [isSubscriptionFormOpen, setIsSubscriptionFormOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const plansData = await getSubscriptionPlansWithPricing();
        setPlans(plansData);
        console.log('Pricing page plans loaded:', plansData);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        // Don't set error, let the service handle fallback
        console.log('API failed, service should provide fallback data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleGetStarted = (planId: string) => {
    if (!user) {
      navigate('/register');
    } else {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        setIsSubscriptionFormOpen(true);
      }
    }
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscriptionFormOpen(false);
    setSelectedPlan(null);
  };

  const formatPrice = (price: number, currency: string, billingPeriod: string) => {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'VND',
    }).format(price);

    switch (billingPeriod) {
      case 'per_swap':
        return `${formattedPrice}/mỗi lần thay`;
      case 'monthly':
        return `${formattedPrice}/mỗi tháng`;
      case 'custom':
        return 'Custom/giá tùy chỉnh';
      default:
        return formattedPrice;
    }
  };

  const getPlanDescription = (plan: SubscriptionPlan) => {
    switch (plan.name.toLowerCase()) {
      case 'pay per swap':
      case 'trả theo lần thay':
        return 'Hoàn hảo cho người dùng thỉnh thoảng';
      case 'monthly unlimited':
      case 'không giới hạn hàng tháng':
        return 'Tốt nhất cho người đi làm thường xuyên';
      case 'enterprise':
      case 'doanh nghiệp':
        return 'Cho đội xe và doanh nghiệp';
      default:
        return plan.description;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-orange-500 border-b border-gray-200 fixed top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img
                src="src/assets/logoEV2.png"
                alt="FPTFAST Logo"
                className="w-18 h-16 mr-3"
              />
              <span className="text-3xl font-bold text-white">
                F P T F A S T
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a
                href="/#features"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.features")}
              </a>
              <a
                href="/#pricing"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.pricing")}
              </a>
              <a
                href="/#stations"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.stations")}
              </a>
              <a
                href="/#contact"
                className="text-white hover:text-yellow-300 transition duration-300"
              >
                {t("nav.contact")}
              </a>
            </div>

            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Button variant="outline" onClick={() => navigate("/login")}>
                    {t("nav.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    className="bg-black text-white hover:bg-gray-800 flex items-center space-x-2"
                  >
                    {t("nav.getStarted")}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => navigate("/driver")}
                  className="bg-white text-orange-500 hover:bg-gray-100"
                >
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl text-gray-900 mb-4 font-bold">
              Giá Cả Đơn Giản, Minh Bạch
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chọn gói phù hợp nhất với nhu cầu lái xe của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={plan.id}
                className="relative transition-all duration-300 hover:shadow-xl border-gray-200 flex flex-col"
              >
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.pricing.price, plan.pricing.currency, plan.pricing.billingPeriod)}
                    </span>
                  </div>
                  <CardDescription className="text-gray-600 mt-2">
                    {getPlanDescription(plan)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features?.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className="w-full py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white mt-auto"
                    onClick={() => handleGetStarted(plan.id)}
                  >
                    Bắt Đầu
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Tại sao chọn FPTFAST?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dịch vụ 24/7</h4>
                  <p className="text-gray-600">Hỗ trợ khách hàng không ngừng nghỉ</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mạng lưới rộng</h4>
                  <p className="text-gray-600">Trạm đổi pin trên toàn quốc</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-orange-500" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Công nghệ tiên tiến</h4>
                  <p className="text-gray-600">Quy trình đổi pin nhanh chóng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Subscription Form */}
      <SubscriptionForm
        isOpen={isSubscriptionFormOpen}
        onClose={() => setIsSubscriptionFormOpen(false)}
        plan={selectedPlan}
        onSuccess={handleSubscriptionSuccess}
      />
    </div>
  );
}
