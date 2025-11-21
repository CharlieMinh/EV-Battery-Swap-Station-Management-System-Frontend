import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { CheckCircle, ArrowRight, ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { toast } from 'react-toastify';
import { formatDateFromDate } from '../../utils/dateTimeUtils';
import Swal from 'sweetalert2';

interface Station {
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

interface Slot {
    slotStartTime: string;
    slotEndTime: string;
    isAvailable: boolean;
    totalCapacity?: number;
    currentReservations?: number;
    availableSlots?: number;
}

interface InspectionBookingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    complaintId: string;
    swapTransactionId: string;
    onSuccess: () => void;
}

export function InspectionBookingWizard({
    isOpen,
    onClose,
    complaintId,
    swapTransactionId,
    onSuccess,
}: InspectionBookingWizardProps) {
    const { t } = useLanguage();

    const [bookingStep, setBookingStep] = useState(1);
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
    const [slotStartTime, setSlotStartTime] = useState<string>("");
    const [slotEndTime, setSlotEndTime] = useState<string>("");

    const [isLoadingStations, setIsLoadingStations] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalSteps = 4;

    useEffect(() => {
        if (isOpen) {
            const fetchStations = async () => {
                setIsLoadingStations(true);
                try {
                    const response = await axios.get(
                        "http://localhost:5194/api/v1/stations",
                        { withCredentials: true }
                    );
                    setStations(response.data.items);
                } catch (error: any) {
                    toast.error(t("driver.inspection.errorLoadStations"));
                } finally {
                    setIsLoadingStations(false);
                }
            };
            fetchStations();
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedSlot(null);
        setSlotStartTime("");
        setSlotEndTime("");

        if (!selectedStation || !bookingDate || !complaintId) {
            setSlots([]);
            return;
        }

        const fetchSlots = async () => {
            setIsLoadingSlots(true);
            try {
                const formattedDate = formatDateForAPI(bookingDate);
                const response = await axios.get(
                    `http://localhost:5194/api/v1/slot-reservations/inspection-slots`,
                    {
                        params: {
                            stationId: selectedStation.id,
                            date: formattedDate,
                            complaintId: complaintId,
                        },
                        withCredentials: true,
                    }
                );

                const apiSlots: Slot[] = (response.data || []).map((s: any) => ({
                    slotStartTime: s.slotStartTime,
                    slotEndTime: s.slotEndTime,
                    isAvailable: Boolean(s.isAvailable),
                    totalCapacity: s.totalCapacity,
                    currentReservations: s.currentReservations,
                    availableSlots: s.availableSlots,
                }));

                setSlots(apiSlots);
            } catch (error: any) {
                const apiMsg = error?.response?.data?.error?.message || error?.response?.data?.message;
                toast.error(apiMsg || t("driver.inspection.errorLoadSlots"));
                setSlots([]);
            } finally {
                setIsLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedStation?.id, bookingDate, complaintId]);

    const handleStationSelect = (station: Station) => {
        setSelectedStation(station);
        setSelectedSlot(null);
    };

    const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleConfirm = async () => {
        if (!selectedStation || !bookingDate || !slotStartTime || !slotEndTime) {
            toast.error(t("driver.inspection.errorIncompleteInfo"));
            return;
        }

        setIsSubmitting(true);

        try {
            const formattedDate = formatDateForAPI(bookingDate);

            const response = await axios.post(
                `http://localhost:5194/api/driver/complaints/${complaintId}/schedule-inspection`,
                {
                    complaintId: complaintId,
                    stationId: selectedStation.id,
                    slotDate: formattedDate,
                    slotStartTime: slotStartTime,
                    slotEndTime: slotEndTime,
                },
                { withCredentials: true }
            );

            onSuccess();
            onClose();

            await Swal.fire({
                icon: 'success',
                title: t("driver.inspection.successBooked"),
                confirmButtonColor: '#f97316',
            });
        } catch (error: any) {
            const msg = error.response?.data?.message || t("driver.inspection.errorBookFailed");
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t("driver.inspection.dialogTitle")}</DialogTitle>
                    {bookingStep < totalSteps && (
                        <DialogDescription>
                            {t("driver.inspection.dialogDescription")} {totalSteps - bookingStep} {t("driver.inspection.dialogDescriptionSteps")}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex items-center justify-between mb-6">
                    {[1, 2, 3, 4].map((step) => (
                        <React.Fragment key={step}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${step <= bookingStep ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {bookingStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                            </div>
                            {step < totalSteps && (
                                <div
                                    className={`flex-1 h-1 mx-2 transition-colors ${step < bookingStep ? 'bg-orange-500' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {bookingStep === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t("driver.inspection.step1Title")}</h3>
                        {isLoadingStations ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                                    <p className="text-gray-600">Đang tải...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto pr-2 space-y-3">
                                {stations.map((station) => (
                                    <Card
                                        key={station.id}
                                        className={`cursor-pointer transition-all ${selectedStation?.id === station.id
                                            ? 'border-2 border-orange-500 bg-orange-50'
                                            : 'border-gray-300 bg-white hover:border-orange-400'
                                            }`}
                                        onClick={() => handleStationSelect(station)}
                                    >
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-start space-x-3">
                                                <MapPin className="w-5 h-5 text-orange-500 mt-1" />
                                                <div>
                                                    <p className="font-bold">{station.name}</p>
                                                    <p className="text-sm text-gray-600">{station.address}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {station.openTime} - {station.closeTime}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedStation?.id === station.id && (
                                                <CheckCircle className="w-6 h-6 text-green-500" />
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-end pt-4">
                            <Button
                                className="bg-orange-500 text-white"
                                onClick={() => setBookingStep(2)}
                                disabled={!selectedStation}
                            >
                                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {bookingStep === 2 && (
                    <div className="space-y-6 flex flex-col items-center">
                        <h3 className="text-lg font-medium">{t("driver.inspection.step2Title")}</h3>
                        <div className="flex justify-center items-center w-full">
                            <Calendar
                                mode="single"
                                selected={bookingDate}
                                onSelect={(d) => { setBookingDate(d); setSelectedSlot(null); setSlotStartTime(""); setSlotEndTime(""); }}
                                disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                            <Button variant="outline" onClick={() => setBookingStep(1)}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t("driver.inspection.buttonPrevious")}
                            </Button>
                            <Button
                                className="bg-orange-500 text-white"
                                onClick={() => setBookingStep(3)}
                                disabled={!bookingDate}
                            >
                                {t("driver.inspection.buttonNext")} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {bookingStep === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">{t("driver.inspection.step3Title")}</h3>
                        {isLoadingSlots ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
                                    <p className="text-gray-600">Đang tải...</p>
                                </div>
                            </div>
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
                                            const availableSlots = (slot.totalCapacity ?? 0) - (slot.currentReservations ?? 0);

                                            return (
                                                <button
                                                    key={slot.slotStartTime}
                                                    onClick={() => { setSelectedSlot(slot); setSlotStartTime(slot.slotStartTime); setSlotEndTime(slot.slotEndTime); }}
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
                                        }) : <p className="col-span-2 text-center text-gray-500 py-16">{t("driver.inspection.noSlots")}</p>}
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
                                                            {selectedSlot.currentReservations ?? 0}
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
                                                            {selectedSlot.totalCapacity ?? '-'}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 p-2 bg-white rounded-md border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600">{t('driver.booking.available')}</span>
                                                            <span className={`text-lg font-bold ${(selectedSlot.totalCapacity ?? 0) - (selectedSlot.currentReservations ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {(selectedSlot.totalCapacity ?? 0) - (selectedSlot.currentReservations ?? 0)} {t('driver.booking.spots')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={`mt-4 p-3 rounded-lg border ${selectedSlot.isAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
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
                        <div className="flex justify-between w-full pt-4">
                            <Button variant="outline" onClick={() => setBookingStep(2)}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t("driver.inspection.buttonPrevious")}
                            </Button>
                            <Button
                                className="bg-orange-500 text-white"
                                onClick={() => setBookingStep(4)}
                                disabled={!selectedSlot}
                            >
                                {t("driver.inspection.buttonNext")} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {bookingStep === 4 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">{t("driver.inspection.step4Title")}</h3>
                        <Card>
                            <CardContent className="p-6 space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t("driver.inspection.confirmStation")}</span>
                                    <span className="font-semibold text-right">{selectedStation?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t("common.address")}</span>
                                    <span className="font-semibold text-right">{selectedStation?.address}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">{t("driver.inspection.confirmTime")}</span>
                                    <span className="font-semibold text-right">
                                        {formatDateFromDate(bookingDate || undefined)}, {selectedSlot?.slotStartTime.substring(0, 5)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>{t("driver.inspection.confirmNote")}</strong> {t("driver.inspection.confirmNoteText")}
                            </p>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setBookingStep(3)} disabled={isSubmitting}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t("driver.inspection.buttonPrevious")}
                            </Button>
                            <Button
                                className="bg-orange-500 text-white"
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("driver.inspection.buttonConfirming")}
                                    </>
                                ) : (
                                    t("driver.inspection.confirmButton")
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
