import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { CheckCircle, Car, ArrowRight, ArrowLeft, Plus, QrCode } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  batteryModel: string;
}

interface Station {
  id: string;
  name: string;
  address: string;
  distance: string;
  availableBatteries: number;
  totalSlots: number;
  rating: number;
  pricePerSwap: number;
  status: 'open' | 'maintenance';
  waitTime: string;
  hours: string;
}

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  bookingStep: number;
  selectedVehicle: string;
  selectedTime: string;
  selectedStation: string | null;
  vehicles: Vehicle[];
  stations: Station[];
  timeSlots: string[];
  onStepChange: (step: number) => void;
  onVehicleSelect: (vehicleId: string) => void;
  onTimeSelect: (time: string) => void;
  onQRDialog: () => void;
}

export function BookingWizard({
  isOpen,
  onClose,
  bookingStep,
  selectedVehicle,
  selectedTime,
  selectedStation,
  vehicles,
  stations,
  timeSlots,
  onStepChange,
  onVehicleSelect,
  onTimeSelect,
  onQRDialog
}: BookingWizardProps) {
  const { t } = useLanguage();

  const selectedStationData = stations.find(s => s.id === selectedStation);
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('driver.bookBatterySwap')}</DialogTitle>
          <DialogDescription>
            {t('driver.completeReservation')} {4 - bookingStep} {t('driver.moreSteps')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step <= bookingStep ? 'bg-orange-500 text-white' : 'bg-orange-200 text-white-500'
                }`}>
                {step < bookingStep ? <CheckCircle className="w-4 h-4" /> : step}
              </div>
              {step < 4 && <div className={`w-12 h-1 ${step < bookingStep ? 'bg-orange-500' : 'bg-orange-100'}`} />}
            </div>
          ))}
        </div>

        {bookingStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.selectVehicle')}</h3>
            <div className="grid gap-4">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={`cursor-pointer transition-colors ${selectedVehicle === vehicle.id ? 'border-orange-500 bg-orange-200' : 'border-orane-300 bg-white-500'
                    }`}
                  onClick={() => onVehicleSelect(vehicle.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Car className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                          <p className="text-sm text-gray-500">{t('driver.battery')} {vehicle.batteryModel}</p>
                        </div>
                      </div>
                      {selectedVehicle === vehicle.id && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" className="flex items-center justify-center  bg-orange-500 text-white ">
                <Plus className="w-4 h-4 mr-2" /> {t('driver.addNewVehicle')}
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button className='bg-orange-100 text-black ' variant="outline" onClick={onClose}>{t('driver.cancel')}</Button>
              <Button className='bg-orange-500 text-white '
                onClick={() => onStepChange(2)}
                disabled={!selectedVehicle}
              >
                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {bookingStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.chooseTimeSlot')}</h3>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  onClick={() => onTimeSelect(time)}
                  className="h-12"
                >
                  {time}
                </Button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => onStepChange(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
              </Button>
              <Button className='bg-orange-500 text-white '
                onClick={() => onStepChange(3)}
                disabled={!selectedTime}
              >
                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {bookingStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('driver.confirmBooking')}</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span>{t('driver.station')}</span>
                  <span className="font-medium">{selectedStationData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('driver.vehicle')}</span>
                  <span className="font-medium">
                    {selectedVehicleData?.year} {selectedVehicleData?.make} {selectedVehicleData?.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('driver.dateTime')}</span>
                  <span className="font-medium">{t('driver.today')}, {selectedTime}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-medium">
                  <span>{t('driver.total')}</span>
                  <span>$25.00</span>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => onStepChange(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
              </Button>
              <Button className='bg-orange-500 text-white ' onClick={() => onStepChange(4)}>
                {t('driver.confirmBooking')} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {bookingStep === 4 && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-medium">{t('driver.bookingConfirmed')}</h3>
            <p className="text-gray-600">{t('driver.swapReserved')} {selectedTime}</p>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4">
                  <QrCode className="w-24 h-24 text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium">{t('driver.bookingCode')}</p>
                    <p className="text-2xl font-mono">SW-2024-001</p>
                    <p className="text-sm text-gray-500">{t('driver.showQRCode')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-center space-x-2">
              <Button onClick={onQRDialog}>
                <QrCode className="w-4 h-4 mr-2" /> {t('driver.viewQRCode')}
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