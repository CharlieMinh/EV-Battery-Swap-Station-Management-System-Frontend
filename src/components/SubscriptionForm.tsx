import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, CreditCard, Calendar, Car, Loader2 } from 'lucide-react';
import { SubscriptionPlan, SubscriptionPlanPricing } from '../services/subscriptionService';
import { 
  Vehicle, 
  createSubscription, 
  getUserVehicles
} from '../services/subscriptionPaymentService';

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan & { pricing: SubscriptionPlanPricing } | null;
  onSuccess: () => void;
}

export function SubscriptionForm({ isOpen, onClose, plan, onSuccess }: SubscriptionFormProps) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format price for display
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

  // Load user vehicles
  useEffect(() => {
    if (isOpen) {
      const loadVehicles = async () => {
        try {
          setVehiclesLoading(true);
          const userVehicles = await getUserVehicles();
          setVehicles(userVehicles);
          
          // Set default start date to today
          const today = new Date().toISOString().split('T')[0];
          setStartDate(today);
          
          // Auto-select first vehicle if available
          if (userVehicles.length > 0) {
            setSelectedVehicleId(userVehicles[0].id);
          }
        } catch (error) {
          console.error('Error loading vehicles:', error);
          setError('Không thể tải danh sách xe. Vui lòng thử lại.');
        } finally {
          setVehiclesLoading(false);
        }
      };

      loadVehicles();
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicleId('');
      setStartDate('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan || !selectedVehicleId || !startDate) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create subscription
      const subscriptionData = {
        subscriptionPlanId: plan.id,
        vehicleId: selectedVehicleId,
        startDate: new Date(startDate).toISOString(),
        notes: notes || undefined
      };

      const subscription = await createSubscription(subscriptionData);
      
      // Get selected vehicle info
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      
      if (!selectedVehicle) {
        setError('Không tìm thấy thông tin xe đã chọn.');
        return;
      }

      // Navigate to payment page with subscription data
      navigate('/payment', {
        state: {
          subscriptionId: subscription.id,
          plan: plan,
          vehicle: selectedVehicle,
          startDate: startDate,
          notes: notes
        }
      });
      
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Đăng Ký Gói Dịch Vụ
          </DialogTitle>
          <DialogDescription className="text-center">
            Hoàn tất thông tin để đăng ký gói dịch vụ
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                {plan.isPopular && (
                  <Badge className="bg-orange-500 text-white">
                    Phổ Biến Nhất
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {formatPrice(plan.pricing.price, plan.pricing.currency, plan.pricing.billingPeriod)}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Tính năng bao gồm:</h4>
                <ul className="space-y-1">
                  {plan.features?.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Thông Tin Đăng Ký
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vehicle Selection */}
                <div className="space-y-2">
                  <Label htmlFor="vehicle" className="flex items-center">
                    <Car className="w-4 h-4 mr-2" />
                    Chọn xe đăng ký *
                  </Label>
                  {vehiclesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-500">Đang tải danh sách xe...</span>
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center">
                      <p className="text-sm text-gray-500 mb-2">Bạn chưa có xe nào được đăng ký</p>
                      <Button type="button" variant="outline" size="sm">
                        Thêm xe mới
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger className="h-auto py-3">
                          <SelectValue placeholder="Chọn xe của bạn" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicles.map((vehicle) => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-bold text-xl text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                      {vehicle.licensePlate}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium">
                                    {vehicle.brand} {vehicle.model}
                                  </span>
                                  {vehicle.batteryModel && (
                                    <span className="text-xs text-gray-500">
                                      Pin: {vehicle.batteryModel.name} ({vehicle.batteryModel.voltage}V)
                                    </span>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <Car className="w-6 h-6 text-blue-500" />
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Selected Vehicle Info */}
                      {selectedVehicle && (
                        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-2 mb-3">
                            <Car className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-blue-800 text-lg">Xe đã chọn:</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-2xl text-blue-700 bg-white px-4 py-3 rounded-lg shadow-sm border-2 border-blue-300">
                                {selectedVehicle.licensePlate}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                              <strong className="text-gray-800">Loại xe:</strong> {selectedVehicle.brand} {selectedVehicle.model}
                            </div>
                            {selectedVehicle.batteryModel && (
                              <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                                <strong className="text-gray-800">Pin:</strong> {selectedVehicle.batteryModel.name} ({selectedVehicle.batteryModel.voltage}V)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Ngày bắt đầu *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thêm ghi chú cho đăng ký của bạn..."
                    rows={3}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    disabled={loading || !selectedVehicleId || !startDate || vehicles.length === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Thanh Toán
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}