import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { CheckCircle, Car, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

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


interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;

  // Dữ liệu hiển thị
  stations: Station[] | null;
  vehicles: Vehicle[];
  slots: Slot[];

  // State của luồng đặt chỗ
  bookingStep: number;
  selectedStation: string | null;
  selectedVehicle: Vehicle | null;
  bookingDate: Date | undefined;
  selectedSlot: Slot | null;
  bookingResult: any; // Kết quả cuối cùng từ API

  // Trạng thái loading
  isLoadingSlots: boolean;
  isBooking: boolean;

  // Các hàm "ra lệnh" cho component cha
  onStepChange: (step: number) => void;
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onDateChange: (date: Date | undefined) => void;
  onSlotSelect: (slot: Slot | null) => void;
  onConfirm: () => void;
  onQRDialog: () => void;
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
  onQRDialog
}: BookingWizardProps) {
  const { t } = useLanguage();
  const selectedStationData = stations?.find(s => s.id === selectedStation);

  const totalSteps = 5;

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

        {/* Thanh tiến trình */}
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

        {/* BƯỚC 1: CHỌN XE */}
        {bookingStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.selectVehicle')}</h3>
            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={`cursor-pointer transition-all ${selectedVehicle?.id === vehicle.id ? "border-2 border-orange-500 bg-orange-50" : "border-gray-300 bg-white hover:border-orange-400"}`}
                  onClick={() => onVehicleSelect(vehicle)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {vehicle.photoUrl ? <img src={vehicle.photoUrl} alt={vehicle.vehicleModelFullName} className="w-16 h-12 object-cover rounded-md" /> : <Car className="w-10 h-10 text-gray-400" />}
                      <div>
                        <p className="font-bold">{vehicle.vehicleModelFullName || vehicle.brand}</p>
                        <p className="text-sm text-gray-600">{t('driver.booking.licensePlate')}: <span className="font-semibold">{vehicle.plate}</span></p>
                      </div>
                    </div>
                    {selectedVehicle?.id === vehicle.id && <CheckCircle className="w-6 h-6 text-green-500" />}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button className='bg-orange-500 text-white' onClick={() => onStepChange(2)} disabled={!selectedVehicle}>
                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: CHỌN NGÀY */}
        {bookingStep === 2 && (
          <div className="space-y-6 flex flex-col items-center">
            <h3 className="text-lg font-medium">{t('driver.booking.selectDateTitle')}</h3>

            <div className="flex justify-center items-center w-full">
              <Calendar
                mode="single"
                selected={bookingDate}
                onSelect={onDateChange}
                disabled={(date: Date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                captionLayout="dropdown"
                fromYear={2020}
                toYear={2030}
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
                }}
              />
            </div>

            <div className="flex justify-between w-full pt-4">
              <Button variant="outline" onClick={() => onStepChange(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
              </Button>
              <Button
                className="bg-orange-500 text-white"
                onClick={() => onStepChange(3)}
                disabled={!bookingDate}
              >
                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: CHỌN GIỜ */}
        {bookingStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.chooseTimeSlot')}</h3>
            {isLoadingSlots ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
                {slots.length > 0 ? slots.map((slot) => {
                  const now = new Date();
                  const isToday = bookingDate
                    ? bookingDate.getFullYear() === now.getFullYear() &&
                    bookingDate.getMonth() === now.getMonth() &&
                    bookingDate.getDate() === now.getDate()
                    : false;
                  let isSlotDisabled = !slot.isAvailable;
                  if (isToday) {
                    const [hours, minutes] = slot.slotStartTime.split(':');
                    const slotTime = new Date();
                    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                    if (slotTime < now) {
                      isSlotDisabled = true;
                    }
                  }
                  return (
                    <Button
                      key={slot.slotStartTime}
                      variant={selectedSlot?.slotStartTime === slot.slotStartTime ? "default" : "outline"}
                      className={`h-12 ${selectedSlot?.slotStartTime === slot.slotStartTime ? 'bg-orange-500' : ''}`}
                      onClick={() => onSlotSelect(slot)}
                      disabled={isSlotDisabled}
                    >
                      {slot.slotStartTime.substring(0, 5)} - {slot.slotEndTime.substring(0, 5)} <br></br>
                      {t('driver.currentReservations')}: 5/5
                    </Button>
                  );
                }) : <p className='col-span-4 text-center text-gray-500 py-16'>{t('driver.noAvailableSlots')}</p>}
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => onStepChange(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
              </Button>
              <Button className='bg-orange-500 text-white' onClick={() => onStepChange(4)} disabled={!selectedSlot}>
                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 4: XÁC NHẬN */}
        {bookingStep === 4 && (
          <div className="space-y-4">
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
              </CardContent>
            </Card>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => onStepChange(3)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
              </Button>
              <Button className='bg-orange-500 text-white' onClick={onConfirm} disabled={isBooking}>
                {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isBooking ? t('driver.processing') : t('driver.confirmAndBook')}
              </Button>
            </div>
          </div>
        )}

        {/* BƯỚC 5: THÀNH CÔNG */}
        {bookingStep === 5 && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold">{t('driver.bookingConfirmed')}</h3>
            <p className="text-gray-600">
              {t('driver.yourBookingCodeIs')}:
              <span className="block font-bold text-3xl text-black mt-2 font-mono tracking-widest">{bookingResult?.reservationCode}</span>
            </p>
            <div className='pt-4'>
              <Button className="bg-orange-500" onClick={() => { onClose(); onQRDialog(); }}>
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