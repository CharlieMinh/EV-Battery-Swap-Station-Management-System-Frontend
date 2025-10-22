import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  ArrowLeft, 
  CheckCircle, 
  Loader2,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
import { SubscriptionPlan, SubscriptionPlanPricing } from '../services/subscriptionService';
import { Vehicle, createVNPayPayment } from '../services/subscriptionPaymentService';

interface PaymentPageState {
  subscriptionId: string;
  plan: SubscriptionPlan & { pricing: SubscriptionPlanPricing };
  vehicle: Vehicle;
  startDate: string;
  notes?: string;
}

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const state = location.state as PaymentPageState;

  useEffect(() => {
    if (!state) {
      navigate('/pricing');
    }
  }, [state, navigate]);

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

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError('Vui lòng chọn phương thức thanh toán.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (paymentMethod === 'vnpay') {
        // Create VNPay payment URL
        const paymentData = {
          invoiceId: state.subscriptionId,
          orderInfo: `Đăng ký gói ${state.plan.name}`,
          ipAddress: await getClientIP()
        };

        const paymentResponse = await createVNPayPayment(paymentData);
        
        // Redirect to VNPay payment page
        window.location.href = paymentResponse.paymentUrl;
      } else {
        // Handle other payment methods here
        setError('Phương thức thanh toán này chưa được hỗ trợ.');
      }
      
    } catch (error: any) {
      console.error('Error processing payment:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý thanh toán.');
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '127.0.0.1';
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Không tìm thấy thông tin thanh toán</p>
            <Button onClick={() => navigate('/pricing')} className="mt-4">
              Quay lại trang giá
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentMethods = [
    {
      id: 'vnpay',
      name: 'VNPay',
      description: 'Thanh toán qua VNPay',
      icon: <CreditCard className="w-6 h-6" />,
      features: ['Bảo mật cao', 'Hỗ trợ nhiều ngân hàng', 'Thanh toán nhanh'],
      popular: true
    },
    {
      id: 'momo',
      name: 'MoMo',
      description: 'Thanh toán qua ví MoMo',
      icon: <Smartphone className="w-6 h-6" />,
      features: ['Thanh toán qua ví điện tử', 'Nhanh chóng', 'Tiện lợi'],
      popular: false,
      disabled: true
    },
    {
      id: 'bank_transfer',
      name: 'Chuyển khoản ngân hàng',
      description: 'Chuyển khoản trực tiếp',
      icon: <Building2 className="w-6 h-6" />,
      features: ['Chuyển khoản trực tiếp', 'Không phí', 'An toàn'],
      popular: false,
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Thanh Toán
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Bảo mật SSL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Tóm tắt đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Plan Info */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{state.plan.name}</h3>
                  <div className="text-2xl font-bold text-orange-600 mb-2">
                    {formatPrice(state.plan.pricing.price, state.plan.pricing.currency, state.plan.pricing.billingPeriod)}
                  </div>
                  <p className="text-sm text-gray-600">{state.plan.description}</p>
                </div>

                {/* Vehicle Info */}
                <div className="border-b pb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Xe đăng ký</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-xl text-blue-700 bg-blue-50 px-4 py-3 rounded-lg border-2 border-blue-300 shadow-sm">
                        {state.vehicle.licensePlate}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                      <strong className="text-gray-800">Loại xe:</strong> {state.vehicle.brand} {state.vehicle.model}
                    </div>
                    {state.vehicle.batteryModel && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                        <strong className="text-gray-700">Pin:</strong> {state.vehicle.batteryModel.name} ({state.vehicle.batteryModel.voltage}V)
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Date */}
                <div className="border-b pb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Ngày bắt đầu</h4>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(state.startDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tính năng bao gồm</h4>
                  <ul className="space-y-1">
                    {state.plan.features?.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Zap className="w-3 h-3 text-orange-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                    {state.plan.features && state.plan.features.length > 3 && (
                      <li className="text-xs text-gray-500">
                        +{state.plan.features.length - 3} tính năng khác
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Chọn phương thức thanh toán</CardTitle>
                <CardDescription>
                  Chọn phương thức thanh toán phù hợp với bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? 'border-orange-500 bg-orange-50'
                        : method.disabled
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => !method.disabled && setPaymentMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          paymentMethod === method.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {method.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{method.name}</h3>
                            {method.popular && (
                              <Badge className="bg-orange-500 text-white text-xs">
                                Phổ biến
                              </Badge>
                            )}
                            {method.disabled && (
                              <Badge variant="outline" className="text-xs">
                                Sắp có
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod === method.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod === method.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {method.features.map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Payment Button */}
                <div className="pt-6">
                  <Button
                    onClick={handlePayment}
                    disabled={loading || !paymentMethod}
                    className="w-full py-3 text-lg font-semibold bg-orange-500 hover:bg-orange-600"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Thanh toán {state.plan.pricing.price.toLocaleString('vi-VN')} VND
                      </>
                    )}
                  </Button>
                </div>

                {/* Security Notice */}
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Bảo mật thanh toán</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
