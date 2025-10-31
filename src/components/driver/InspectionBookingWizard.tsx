import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Calendar } from '../ui/calendar';
import { CheckCircle, ArrowRight, ArrowLeft, Loader2, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { toast } from 'react-toastify';

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
    // Lưu slotStartTime và slotEndTime theo yêu cầu
    const [slotStartTime, setSlotStartTime] = useState<string>("");
    const [slotEndTime, setSlotEndTime] = useState<string>("");

    const [isLoadingStations, setIsLoadingStations] = useState(false);
    // Không gọi API lấy slot nữa
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalSteps = 4;

    // Fetch stations khi mở dialog
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
                    toast.error("Không thể tải danh sách trạm");
                } finally {
                    setIsLoadingStations(false);
                }
            };
            fetchStations();
        }
    }, [isOpen]);

    // Tạo slot 30 phút từ 08:00 đến 18:00 khi chọn ngày
    useEffect(() => {
        if (!bookingDate) {
            setSlots([]);
            setSelectedSlot(null);
            setSlotStartTime("");
            setSlotEndTime("");
            return;
        }
        const generateSlots = () => {
            const results: Slot[] = [];
            const startMinutes = 8 * 60; // 08:00
            const endMinutes = 18 * 60; // 18:00
            for (let m = startMinutes; m < endMinutes; m += 30) {
                const startH = Math.floor(m / 60).toString().padStart(2, '0');
                const startM = (m % 60).toString().padStart(2, '0');
                const endH = Math.floor((m + 30) / 60).toString().padStart(2, '0');
                const endM = ((m + 30) % 60).toString().padStart(2, '0');
                results.push({
                    slotStartTime: `${startH}:${startM}:00`,
                    slotEndTime: `${endH}:${endM}:00`,
                    isAvailable: true,
                });
            }
            return results;
        };
        setSlots(generateSlots());
        setSelectedSlot(null);
        setSlotStartTime("");
        setSlotEndTime("");
    }, [bookingDate]);

    const handleStationSelect = (station: Station) => {
        setSelectedStation(station);
        setSelectedSlot(null);
    };

    const handleConfirm = async () => {
        if (!selectedStation || !bookingDate || !slotStartTime || !slotEndTime) {
            toast.error("Vui lòng chọn đầy đủ thông tin");
            return;
        }

        setIsSubmitting(true);

        try {
            const formattedDate = bookingDate.toISOString().split("T")[0];

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

            toast.success(response.data.message || "Lịch hẹn kiểm tra đã được đặt thành công");
            onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Không thể đặt lịch kiểm tra. Vui lòng thử lại.";
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Đặt lịch kiểm tra pin</DialogTitle>
                    {bookingStep < totalSteps && (
                        <DialogDescription>
                            Hoàn thành đặt lịch trong {totalSteps - bookingStep} bước nữa
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Progress bar */}
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

                {/* BƯỚC 1: CHỌN TRẠM */}
                {bookingStep === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Chọn trạm kiểm tra</h3>
                        {isLoadingStations ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
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

                {/* BƯỚC 2: CHỌN NGÀY */}
                {bookingStep === 2 && (
                    <div className="space-y-6 flex flex-col items-center">
                        <h3 className="text-lg font-medium">Chọn ngày</h3>
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
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
                            </Button>
                            <Button
                                className="bg-orange-500 text-white"
                                onClick={() => setBookingStep(3)}
                                disabled={!bookingDate}
                            >
                                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* BƯỚC 3: CHỌN GIỜ */}
                {bookingStep === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">Chọn khung giờ</h3>
                        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2">
                            {slots.length > 0 ? (
                                slots.map((slot) => {
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
                                        <Button
                                            key={slot.slotStartTime}
                                            variant={selectedSlot?.slotStartTime === slot.slotStartTime ? "default" : "outline"}
                                            className={`h-12 ${selectedSlot?.slotStartTime === slot.slotStartTime ? 'bg-orange-500' : ''}`}
                                            onClick={() => { setSelectedSlot(slot); setSlotStartTime(slot.slotStartTime); setSlotEndTime(slot.slotEndTime); }}
                                            disabled={isSlotDisabled}
                                        >
                                            {slot.slotStartTime.substring(0, 5)} - {slot.slotEndTime.substring(0, 5)}
                                        </Button>
                                    );
                                })
                            ) : (
                                <p className="col-span-4 text-center text-gray-500 py-16">Không có khung giờ trống</p>
                            )}
                        </div>
                        <div className="flex justify-between w-full pt-4">
                            <Button variant="outline" onClick={() => setBookingStep(2)}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
                            </Button>
                            <Button
                                className="bg-orange-500 text-white"
                                onClick={() => setBookingStep(4)}
                                disabled={!selectedSlot}
                            >
                                {t('driver.next')} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* BƯỚC 4: XÁC NHẬN */}
                {bookingStep === 4 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium">Xác nhận lịch hẹn</h3>
                        <Card>
                            <CardContent className="p-6 space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Trạm kiểm tra:</span>
                                    <span className="font-semibold text-right">{selectedStation?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Địa chỉ:</span>
                                    <span className="font-semibold text-right">{selectedStation?.address}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Ngày & Giờ:</span>
                                    <span className="font-semibold text-right">
                                        {bookingDate?.toLocaleDateString('vi-VN')}, {selectedSlot?.slotStartTime.substring(0, 5)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Lưu ý:</strong> Vui lòng mang theo xe và giấy tờ liên quan đến trạm vào đúng giờ đã hẹn để kiểm tra pin.
                            </p>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setBookingStep(3)} disabled={isSubmitting}>
                                <ArrowLeft className="w-4 h-4 mr-2" /> {t('driver.back')}
                            </Button>
                            <Button
                                className="bg-orange-500 text-white"
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận lịch hẹn'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
