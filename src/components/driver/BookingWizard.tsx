import React, { useState } from 'react'; // Giữ lại useState
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { CheckCircle, Car, ArrowRight, ArrowLeft, Loader2, Info, CreditCard, Landmark } from 'lucide-react'; // Giữ lại icons
import { useLanguage } from '../LanguageContext';
import { Badge } from '../ui/badge';

interface Vehicle {
  id: string;
  vin: string;
  plate: string;
  brand: string;
  vehicleModelFullName?: string;
  compatibleBatteryModelName?: string;
  compatibleBatteryModelId: string;
  photoUrl?: string;
}
interface Slot {
  slotStartTime: string;
  slotEndTime: string;
  totalCapacity: number;
  currentReservations: number;
  isAvailable: boolean;
}
export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  isActive: boolean;
  openTime: string;
  closeTime: string;
  phoneNumber: string | null;
  primaryImageUrl: string | null;
  isOpenNow: boolean;
}
interface SubscriptionInfo {
  id: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isBlocked: boolean;
  vehicleId: string;
  currentMonthSwapCount: number;
  swapsLimit: number | null;
  subscriptionPlan: {
    name: string;
    maxSwapsPerMonth?: number;
  };
}


// ✅ SỬA LẠI PROPS: onConfirm nhận thêm paymentMethod
interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[] | null;
  vehicles: Vehicle[];
  slots: Slot[];
  bookingStep: number;
  selectedStation: string | null;
  selectedVehicle: Vehicle | null;
  bookingDate: Date | undefined;
  selectedSlot: Slot | null;
  bookingResult: any;
  isLoadingSlots: boolean;
  isBooking: boolean;
  onStepChange: (step: number) => void;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onDateChange: (date: Date | undefined) => void;
  onSlotSelect: (slot: Slot | null) => void;

  onConfirm: (isUsingSubscription: boolean, price: number | null, paymentMethod: number | null) => void;
  onQRDialog: () => void;
  subscriptionInfoList: SubscriptionInfo[];
}

export function BookingWizard({
  isOpen,
  onClose,
  stations,
  vehicles,
  slots,
  bookingStep,
  selectedStation,
  selectedVehicle,
  bookingDate,
  selectedSlot,
  bookingResult,
  isLoadingSlots,
  isBooking,
  onStepChange,
  onVehicleSelect,
  onDateChange,
  onSlotSelect,
  onConfirm,
  onQRDialog,
  subscriptionInfoList,
}: BookingWizardProps) {
  const { t } = useLanguage();
  const selectedStationData = stations?.find(s => s.id === selectedStation);


  const [isUsingSubscription, setIsUsingSubscription] = useState(false);
  const [swapPrice, setSwapPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<number | null>(null);

  const totalSteps = 5;


  const handleVehicleSelect = async (vehicle: Vehicle | null) => {
    onVehicleSelect(vehicle);
    setSelectedPayMethod(null);

    if (!vehicle) {
      setIsUsingSubscription(false);
      setSwapPrice(null);
      return;
    }
    const matchedSub = subscriptionInfoList.find(
      (sub) => sub.vehicleId === vehicle.id && sub.isActive
    );
    let isSubValid = false;
    if (matchedSub) {
      const limit = matchedSub.swapsLimit ?? matchedSub.subscriptionPlan?.maxSwapsPerMonth ?? null;
      const count = matchedSub.currentMonthSwapCount;
      if (limit === null || (limit != null && count < limit)) {
        isSubValid = true;
      }
    }
    setIsUsingSubscription(isSubValid);

    if (!isSubValid) {
      setIsLoadingPrice(true);
      setSwapPrice(null);
      try {
        const response = await axios.get(
          `http://localhost:5194/api/BatteryModels/${vehicle.compatibleBatteryModelId}/swap-price`,
          { withCredentials: true }
        );
        setSwapPrice(response.data.swapPricePerSession);
      } catch (error) {
        console.error("Lỗi khi lấy giá đổi pin:", error);
      } finally {
        setIsLoadingPrice(false);
      }
    } else {
      setSwapPrice(null);
    }
  };


  const selectedVehicleSub = selectedVehicle
    ? subscriptionInfoList.find(s => s.vehicleId === selectedVehicle.id && s.isActive)
    : null;
  const showWarning = selectedVehicle && selectedVehicleSub && !isUsingSubscription;

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value)) {
      setSelectedPayMethod(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('driver.bookBatterySwap')}</DialogTitle>
          {bookingStep < totalSteps && (
            <DialogDescription>
              {t('driver.completeReservation')} {totalSteps - bookingStep} {t('driver.moreSteps')}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <React.Fragment key={step}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${step <= bookingStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {bookingStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < totalSteps && <div className={`flex-1 h-1 mx-2 transition-colors ${step < bookingStep ? 'bg-orange-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
        {bookingStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.selectVehicle')}</h3>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
              {vehicles.map((vehicle) => {
                const vehicleSub = subscriptionInfoList.find(
                  (sub) => sub.vehicleId === vehicle.id && sub.isActive
                );
                let vehicleSubInfo: { planName: string; usageText: string; isLimitReached: boolean } | null = null;
                if (vehicleSub) {
                  const limit = vehicleSub.swapsLimit ?? vehicleSub.subscriptionPlan?.maxSwapsPerMonth ?? null;
                  const count = vehicleSub.currentMonthSwapCount;
                  let isLimitReached = false;
                  let usageText = "";
                  if (limit === null) {
                    usageText = `${count} lượt (Không giới hạn)`;
                  } else {
                    usageText = `${count}/${limit} lượt`;
                    if (count >= limit) isLimitReached = true;
                  }
                  vehicleSubInfo = { planName: vehicleSub.subscriptionPlan.name, usageText, isLimitReached };
                }
                return (
                  <Card key={vehicle.id}
                    className={`cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id ? "border-2 border-orange-500 bg-orange-50" : "border-gray-300 bg-white hover:border-orange-400"}`}
                    onClick={() => handleVehicleSelect(vehicle)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {vehicle.photoUrl ? <img src={vehicle.photoUrl} alt={vehicle.vehicleModelFullName} className="w-16 h-12 object-cover rounded-md" /> : <Car className="w-10 h-10 text-gray-400" />}
                        <div className="space-y-1">
                          <p className="font-bold">{vehicle.vehicleModelFullName || vehicle.brand}</p>
                          <p className="text-sm text-gray-600">{t('driver.booking.licensePlate')}: <span className="font-semibold">{vehicle.plate}</span></p>
                          {vehicleSubInfo ? (
                            vehicleSubInfo.isLimitReached ? (
                              <Badge variant="destructive">{vehicleSubInfo.planName} ({vehicleSubInfo.usageText})</Badge>
                            ) : (
                              <Badge className="bg-orange-500 text-white">{vehicleSubInfo.planName} ({vehicleSubInfo.usageText})</Badge>
                            )
                          ) : (
                            <Badge variant="secondary">Không có gói thuê</Badge>
                          )}
                        </div>
                      </div>
                      {selectedVehicle?.id === vehicle.id && <CheckCircle className="w-6 h-6 text-green-500" />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {showWarning && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-md flex items-start space-x-2">
                <Info className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">Gói dành cho xe này đã đạt giới hạn số lần đổi trong tháng. Nếu tiếp tục, phí đổi pin sẽ được tính theo lượt.</p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button className='bg-orange-500 text-white' onClick={() => onStepChange(2)} disabled={!selectedVehicle}>
                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: CHỌN NGÀY  */}
        {bookingStep === 2 && (
          <div className="space-y-6 flex flex-col items-center">
            <h3 className="text-lg font-medium">{t('driver.booking.selectDateTitle')}</h3>
            <div className="flex justify-center items-center w-full">
              <Calendar
                mode="single"
                selected={bookingDate}
                onSelect={onDateChange}
                disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                captionLayout="dropdown" fromYear={2020} toYear={2030}
                className="rounded-xl border border-gray-300 shadow-md p-6 w-full max-w-md bg-white"
                classNames={{
                  root: "flex justify-center",
                  months: "flex flex-col items-center space-y-4",
                  month: "space-y-4",
                  caption: "flex flex-col items-center gap-2 mb-2 w-full",
                  caption_label: "hidden",
                  dropdowns: "flex justify-center items-center gap-2",
                  dropdown: "rounded-md border border-gray-300 text-sm px-2 py-1 hover:border-orange-400 focus:border-orange-500 outline-none",
                  nav: "flex items-center justify-between w-full mt-2",
                  nav_button: "w-8 h-8 flex items-center justify-center rounded-md hover:bg-orange-100 transition text-gray-700",
                  table: "w-full border-spacing-2",
                  head_row: "text-gray-500",
                  head_cell: "text-sm font-medium text-center w-10 h-10",
                  row: "text-center",
                  day: "w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium hover:bg-orange-100 transition",
                  day_selected: "bg-orange-500 text-white hover:bg-orange-600",
                  day_today: "border border-orange-400 font-bold text-orange-600",
                  day_outside: "text-gray-400",
                }} />
            </div>
            <div className="flex justify-between w-full pt-4">
              <Button variant="outline" onClick={() => onStepChange(1)}><ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}</Button>
              <Button className="bg-orange-500 text-white" onClick={() => onStepChange(3)} disabled={!bookingDate}>{t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: CHỌN GIỜ  */}
        {bookingStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.chooseTimeSlot')}</h3>
            {isLoadingSlots ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
                {slots.length > 0 ? slots.map((slot) => {
                  const now = new Date();
                  const isToday = bookingDate ? bookingDate.toDateString() === now.toDateString() : false;
                  let isSlotDisabled = !slot.isAvailable;
                  if (isToday) {
                    const [hours, minutes] = slot.slotStartTime.split(':');
                    const slotTime = new Date();
                    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    if (slotTime < now) isSlotDisabled = true;
                  }
                  return (
                    <Button key={slot.slotStartTime} variant={selectedSlot?.slotStartTime === slot.slotStartTime ? "default" : "outline"} className={`h-12 ${selectedSlot?.slotStartTime === slot.slotStartTime ? 'bg-orange-500' : ''}`} onClick={() => onSlotSelect(slot)} disabled={isSlotDisabled}>
                      {slot.slotStartTime.substring(0, 5)} - {slot.slotEndTime.substring(0, 5)} <br />
                      {slot.currentReservations}/{slot.totalCapacity}
                    </Button>
                  );
                }) : <p className='col-span-4 text-center text-gray-500 py-16'>{t('driver.noAvailableSlots')}</p>}
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => onStepChange(2)}><ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}</Button>
              <Button className='bg-orange-500 text-white' onClick={() => onStepChange(4)} disabled={!selectedSlot}>{t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {bookingStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">{t('driver.confirmBooking')}</h3>
            <Card>
              <CardContent className="p-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('driver.station')}</span>
                  <span className="font-semibold text-right">{selectedStationData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('driver.vehicle')}</span>
                  <span className="font-semibold text-right">{selectedVehicle?.vehicleModelFullName} ({selectedVehicle?.plate})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('driver.dateTime')}</span>
                  <span className="font-semibold text-right">{bookingDate?.toLocaleDateString('vi-VN')}, {selectedSlot?.slotStartTime.substring(0, 5)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-gray-500">Hình thức</span>
                  {isUsingSubscription ? (<span className="font-semibold text-green-600">Sử dụng gói thuê (Miễn phí)</span>) : (<span className="font-semibold text-blue-600">Thanh toán theo lượt</span>)}
                </div>
                {!isUsingSubscription && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Phí đổi pin</span>
                    {isLoadingPrice ? (<Loader2 className="h-4 w-4 animate-spin text-gray-500" />) : (<span className="font-semibold text-lg text-orange-600">{swapPrice ? `${swapPrice.toLocaleString('vi-VN')} VND` : "N/A"}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ KHỐI CHỌN PHƯƠNG THỨC THANH TOÁN (Dùng HTML Radio) */}
            {!isUsingSubscription && !isLoadingPrice && swapPrice && swapPrice > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-medium">Chọn phương thức thanh toán:</h4>
                <div className="space-y-2"> {/* Bọc các label trong div */}
                  {/* Lựa chọn VNPay */}
                  <label htmlFor="pay-vnpay" className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors ${selectedPayMethod === 0 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      id="pay-vnpay"
                      name="paymentMethod"
                      value="0" // Giá trị là string "1"
                      checked={selectedPayMethod === 0}
                      onChange={handlePaymentMethodChange}
                      className="form-radio h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300" // Tailwind classes cho radio
                    />
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="flex-grow">Thanh toán ngay bằng VNPay</span>
                  </label>

                  {/* Lựa chọn Cash */}
                  <label htmlFor="pay-cash" className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors ${selectedPayMethod === 1 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      id="pay-cash"
                      name="paymentMethod"
                      value="1" // Giá trị là string "0"
                      checked={selectedPayMethod === 1}
                      onChange={handlePaymentMethodChange}
                      className="form-radio h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300" // Tailwind classes cho radio
                    />
                    <Landmark className="w-5 h-5 text-green-600" />
                    <span className="flex-grow">Thanh toán tiền mặt tại trạm</span>
                  </label>
                </div>
              </div>
            )}

            {/* Nút điều hướng (Giữ nguyên logic) */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => onStepChange(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
              </Button>
              <Button
                className='bg-orange-500 text-white hover:bg-orange-600'
                onClick={() => onConfirm(isUsingSubscription, swapPrice, selectedPayMethod)}
                disabled={isBooking || (!isUsingSubscription && (isLoadingPrice || !swapPrice || swapPrice <= 0 || selectedPayMethod === null))}
              >
                {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isBooking ? t('driver.processing') :
                  (isUsingSubscription ? t('driver.confirmAndBook') :
                    (selectedPayMethod === 1 ? "Xác nhận đặt tiền mặt" :
                      "Tiến hành thanh toán VNPay"))}
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 5: THÀNH CÔNG (Giữ nguyên) */}
        {bookingStep === 5 && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold">{t('driver.bookingConfirmed')}</h3>
            <div className='pt-4 space-x-2'>
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => { onClose(); onQRDialog(); }}>
                {t('driver.viewQRCode')}
              </Button>
              <Button variant="outline" onClick={onClose}>
                {t('driver.close')}
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}