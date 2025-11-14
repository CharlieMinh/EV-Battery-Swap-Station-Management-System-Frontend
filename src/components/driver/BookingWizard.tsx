import React, { useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { CheckCircle, Car, ArrowRight, ArrowLeft, Loader2, Info, CreditCard, Landmark } from 'lucide-react';
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
  currentMonthSwapCount: number;
  swapsLimit: number | null;
  subscriptionPlan: {
    name: string;
    batteryModelId?: string;
    maxSwapsPerMonth?: number;
  };
}

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
  const [showPackageConfirmDialog, setShowPackageConfirmDialog] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState<Vehicle | null>(null);

  const totalSteps = 5;


  const handleVehicleSelect = async (vehicle: Vehicle | null) => {
    setSelectedPayMethod(null);

    if (!vehicle) {
      onVehicleSelect(null);
      setIsUsingSubscription(false);
      setSwapPrice(null);
      return;
    }

    const matchedSub = subscriptionInfoList.find(
      (sub) => sub.isActive && sub.subscriptionPlan?.batteryModelId === vehicle.compatibleBatteryModelId
    );

    if (matchedSub) {
      const limit = matchedSub.swapsLimit ?? matchedSub.subscriptionPlan?.maxSwapsPerMonth ?? null;
      const count = matchedSub.currentMonthSwapCount;
      const hasRemainingSwaps = limit === null || count < limit;

      if (hasRemainingSwaps) {
        setPendingVehicle(vehicle);
        setShowPackageConfirmDialog(true);
        return;
      }
    }

    onVehicleSelect(vehicle);
    setIsUsingSubscription(false);
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
  };

  const handleConfirmUsePackage = () => {
    if (pendingVehicle) {
      onVehicleSelect(pendingVehicle);
      setIsUsingSubscription(true);
      setSwapPrice(null);
      setPendingVehicle(null);
      setShowPackageConfirmDialog(false);
    }
  };

  const handleConfirmPayPerSwap = async () => {
    if (pendingVehicle) {
      onVehicleSelect(pendingVehicle);
      setIsUsingSubscription(false);
      setShowPackageConfirmDialog(false);

      setIsLoadingPrice(true);
      setSwapPrice(null);
      try {
        const response = await axios.get(
          `http://localhost:5194/api/BatteryModels/${pendingVehicle.compatibleBatteryModelId}/swap-price`,
          { withCredentials: true }
        );
        setSwapPrice(response.data.swapPricePerSession);
      } catch (error) {
        console.error("Lỗi khi lấy giá đổi pin:", error);
      } finally {
        setIsLoadingPrice(false);
        setPendingVehicle(null);
      }
    }
  };


  const selectedVehicleSub = selectedVehicle
    ? subscriptionInfoList.find(s => s.isActive && s.subscriptionPlan?.batteryModelId === selectedVehicle.compatibleBatteryModelId)
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
      <DialogContent className="w-[95vw] sm:!max-w-none sm:w-[60vw] max-h-[90vh] overflow-y-auto">
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
                  (sub) => sub.isActive && sub.subscriptionPlan?.batteryModelId === vehicle.compatibleBatteryModelId
                );
                let vehicleSubInfo: { planName: string; usageText: string; remainingText: string; isLimitReached: boolean; batteryModelName: string } | null = null;
                if (vehicleSub) {
                  const limit = vehicleSub.swapsLimit ?? vehicleSub.subscriptionPlan?.maxSwapsPerMonth ?? null;
                  const count = vehicleSub.currentMonthSwapCount;
                  let isLimitReached = false;
                  let usageText = "";
                  let remainingText = "";
                  if (limit === null) {
                    usageText = `${t('driver.booking.usedSwaps')} ${count} ${t('driver.booking.swaps')}`;
                    remainingText = t('driver.booking.unlimited');
                  } else {
                    const remaining = limit - count;

                    remainingText = `${remaining}/${limit} ${t('driver.booking.swaps')}`;
                    if (count >= limit) isLimitReached = true;
                  }
                  vehicleSubInfo = {
                    planName: vehicleSub.subscriptionPlan.name,
                    usageText,
                    remainingText,
                    isLimitReached,
                    batteryModelName: vehicle.compatibleBatteryModelName || "N/A"
                  };
                }
                return (
                  <Card key={vehicle.id}
                    className={`cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id ? "border-2 border-orange-500 bg-orange-50" : "border-gray-300 bg-white hover:border-orange-400"}`}
                    onClick={() => handleVehicleSelect(vehicle)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          {vehicle.photoUrl ? (
                            <img src={vehicle.photoUrl} alt={vehicle.vehicleModelFullName} className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
                          ) : (
                            <Car className="w-10 h-10 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{vehicle.vehicleModelFullName || vehicle.brand}</p>
                            <p className="text-xs text-gray-600">
                              {t('driver.booking.plateLabel')} <span className="font-semibold">{vehicle.plate}</span>
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {t('driver.booking.pinLabel')} {vehicle.compatibleBatteryModelName}
                            </p>
                            <div className="pt-1">
                              {vehicleSubInfo ? (
                                vehicleSubInfo.isLimitReached ? (
                                  <Badge variant="destructive" className="text-xs">
                                    {t('driver.booking.outOfSwaps')} {vehicleSubInfo.usageText}
                                  </Badge>
                                ) : (
                                  <div className="space-y-1">
                                    <Badge className="bg-green-600 text-white text-xs whitespace-normal">
                                      {t('driver.booking.canUsePackage')} {vehicleSubInfo.planName}
                                    </Badge>
                                    <p className="text-xs text-green-700">
                                      {vehicleSubInfo.usageText}
                                    </p>
                                  </div>
                                )
                              ) : (
                                <Badge variant="secondary" className="text-xs">{t('driver.booking.payPerSwapOnly')}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedVehicle?.id === vehicle.id && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {selectedVehicle && selectedVehicleSub && (
              <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  {t('driver.booking.vehicleHasPackage')} {selectedVehicleSub.subscriptionPlan.name}
                </p>
                <p className="text-xs text-green-700">
                  {(() => {
                    const limit = selectedVehicleSub.swapsLimit ?? selectedVehicleSub.subscriptionPlan?.maxSwapsPerMonth ?? null;
                    const count = selectedVehicleSub.currentMonthSwapCount;
                    if (limit === null) {
                      return `${t('driver.booking.usedSwaps')} ${count} ${t('driver.booking.swaps')} (${t('driver.booking.unlimited')})`;
                    }
                    const remaining = limit - count;
                    return `${t('driver.booking.remainingSwaps')} ${remaining}/${limit} ${t('driver.booking.perMonthSwaps')}`;
                  })()}
                </p>
              </div>
            )}
            {selectedVehicle && !selectedVehicleSub && (
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg">
                <p className="text-xs text-blue-800 flex items-center">
                  <Info className="w-4 h-4 inline mr-1 flex-shrink-0" />
                  <span>{t('driver.booking.noPackageNote')}</span>
                </p>
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button className='bg-orange-500 text-white' onClick={() => onStepChange(2)} disabled={!selectedVehicle}>
                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

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

        {bookingStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.chooseTimeSlot')}</h3>
            {isLoadingSlots ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">{t('driver.booking.selectTimeSlot')}</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[60vh] sm:max-h-[420px] overflow-y-auto pr-2">
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

                      const isSelected = selectedSlot?.slotStartTime === slot.slotStartTime;
                      const availableSlots = slot.totalCapacity - slot.currentReservations;


                      return (
                        <button
                          key={slot.slotStartTime}
                          onClick={() => onSlotSelect(slot)}
                          disabled={isSlotDisabled}
                          className={`
                            relative p-3 rounded-lg border-2 text-left transition-all
                            ${isSelected
                              ? 'border-orange-500 bg-orange-50 shadow-md'
                              : isSlotDisabled
                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                                : 'border-gray-300 bg-white hover:border-orange-400 hover:shadow-sm'
                            }
                          `}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-bold ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                                {slot.slotStartTime.substring(0, 5)}
                              </span>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-orange-500" />
                              )}
                            </div>
                            <div className={`text-xs ${isSlotDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                              {availableSlots > 0 ? (
                                <span className="font-medium text-green-600">
                                  {t('driver.booking.availableSpots')} {availableSlots} {t('driver.booking.spots')}
                                </span>
                              ) : (
                                <span className="font-medium text-red-600">{t('driver.booking.full')}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    }) : <p className='col-span-2 text-center text-gray-500 py-16'>{t('driver.noAvailableSlots')}</p>}
                  </div>
                </div>

                <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50 min-h-[22rem]">
                  {selectedSlot ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-300 pb-3">
                        <h4 className="text-md font-bold text-gray-900">{t('driver.booking.slotInfo')}</h4>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('driver.booking.startTime')}
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            {selectedSlot.slotStartTime.substring(0, 5)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between">
                          <span className="text-sm text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t('driver.booking.endTime')}
                          </span>
                          <span className="text-sm font-bold text-orange-600">
                            {selectedSlot.slotEndTime.substring(0, 5)}
                          </span>
                        </div>

                        <div className="border-t border-gray-300 pt-3 mt-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm text-gray-600 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {t('driver.booking.reserved')}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {selectedSlot.currentReservations}
                            </span>
                          </div>

                          <div className="flex items-start justify-between mb-3">
                            <span className="text-sm text-gray-600 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {t('driver.booking.capacity')}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {selectedSlot.totalCapacity}
                            </span>
                          </div>

                          <div className="mt-3 p-2 bg-white rounded-md border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{t('driver.booking.available')}</span>
                              <span className={`text-lg font-bold ${selectedSlot.totalCapacity - selectedSlot.currentReservations > 0
                                ? 'text-green-600'
                                : 'text-red-600'
                                }`}>
                                {selectedSlot.totalCapacity - selectedSlot.currentReservations} {t('driver.booking.spots')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`mt-4 p-3 rounded-lg border ${selectedSlot.isAvailable
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                        }`}>
                        <div className="flex items-center space-x-2">
                          {selectedSlot.isAvailable ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">{t('driver.booking.slotAvailable')}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-red-700">{t('driver.booking.slotFull')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-gray-500 font-medium mb-1">{t('driver.booking.noSlotSelected')}</p>
                      <p className="text-xs text-gray-400">{t('driver.booking.selectSlotToView')}</p>
                    </div>
                  )}
                </div>
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
                  <span className="text-gray-500">{t('driver.booking.paymentType')}</span>
                  {isUsingSubscription ? (<span className="font-semibold text-green-600">{t('driver.booking.subscriptionFree')}</span>) : (<span className="font-semibold text-blue-600">{t('driver.booking.perSwapPayment')}</span>)}
                </div>
                {!isUsingSubscription && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">{t('driver.booking.swapFee')}</span>
                    {isLoadingPrice ? (<Loader2 className="h-4 w-4 animate-spin text-gray-500" />) : (<span className="font-semibold text-lg text-orange-600">{swapPrice ? `${swapPrice.toLocaleString('vi-VN')} VND` : "N/A"}</span>)}
                  </div>
                )}
              </CardContent>
            </Card>

            {!isUsingSubscription && !isLoadingPrice && swapPrice && swapPrice > 0 && (
              <div className="space-y-3">
                <h4 className="text-md font-medium">{t('driver.booking.selectPaymentMethod')}</h4>
                <div className="space-y-2">
                  <label htmlFor="pay-vnpay" className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors ${selectedPayMethod === 0 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      id="pay-vnpay"
                      name="paymentMethod"
                      value="0"
                      checked={selectedPayMethod === 0}
                      onChange={handlePaymentMethodChange}
                      className="form-radio h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="flex-grow">{t('driver.booking.payNowVNPay')}</span>
                  </label>

                  <label htmlFor="pay-cash" className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-colors ${selectedPayMethod === 1 ? 'border-orange-500 bg-orange-50' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
                    <input
                      type="radio"
                      id="pay-cash"
                      name="paymentMethod"
                      value="1"
                      checked={selectedPayMethod === 1}
                      onChange={handlePaymentMethodChange}
                      className="form-radio h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                    />
                    <Landmark className="w-5 h-5 text-green-600" />
                    <span className="flex-grow">{t('driver.booking.payCashAtStation')}</span>
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">{t('driver.booking.perSwapWarning')}</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>{t('driver.booking.cancelWithin1Hour')} <strong>{t('driver.booking.violation')}</strong></li>
                      <li>{t('driver.booking.noShowViolation')} <strong>{t('driver.booking.violation')}</strong></li>
                      <li>{t('driver.booking.threeViolations')} <strong>{t('driver.booking.noCashPayment')}</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {isUsingSubscription && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">{t('driver.booking.subscriptionWarning')}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>{t('driver.booking.quotaDeductedImmediately')}</li>
                    <li>{t('driver.booking.cancelBefore1Hour')} <strong>{t('driver.booking.quotaRefunded')}</strong>.</li>
                    <li>{t('driver.booking.cancelWithin1HourNoRefund')} <strong>{t('driver.booking.noCheckInNoRefund')}</strong>, <strong>{t('driver.booking.quotaNotRefunded')}</strong>.</li>
                  </ul>
                </div>
              </div>
            )}

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
                    (selectedPayMethod === 1 ? t('driver.booking.confirmCashBooking') :
                      t('driver.booking.proceedVNPay')))}
              </Button>
            </div>
          </div>
        )}

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

      {pendingVehicle && (
        <Dialog open={showPackageConfirmDialog} onOpenChange={setShowPackageConfirmDialog}>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {t('driver.booking.vehicleHasSubscription')}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 pt-3">
                {t('driver.vehicle')} <span className="font-bold">{pendingVehicle.plate}</span> {t('driver.booking.selectPaymentOrPackage')}
              </DialogDescription>
            </DialogHeader>

            {(() => {
              const vehicleSub = subscriptionInfoList.find(
                (sub) => sub.isActive && sub.subscriptionPlan?.batteryModelId === pendingVehicle.compatibleBatteryModelId
              );
              if (!vehicleSub) return null;

              const limit = vehicleSub.swapsLimit ?? vehicleSub.subscriptionPlan?.maxSwapsPerMonth ?? null;
              const count = vehicleSub.currentMonthSwapCount;
              const remaining = limit !== null ? limit - count : null;

              return (
                <div className="my-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-green-900">
                    {t('driver.booking.plan')} {vehicleSub.subscriptionPlan.name}
                  </p>
                  <p className="text-sm text-green-800">
                    {remaining !== null
                      ? `${t('driver.booking.remainingSwaps')} ${remaining}/${limit} ${t('driver.booking.perMonthSwaps')}`
                      : `${t('driver.booking.usedSwaps')} ${count} ${t('driver.booking.swaps')} (${t('driver.booking.unlimited')})`}
                  </p>
                </div>
              );
            })()}

            <div className="space-y-3 pt-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-5 text-base rounded-lg"
                onClick={handleConfirmUsePackage}
              >
                {t('driver.booking.useSubscriptionFree')}
              </Button>
              <Button
                variant="outline"
                className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold py-5 text-base rounded-lg"
                onClick={handleConfirmPayPerSwap}
              >
                {t('driver.booking.perSwapPayment')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}