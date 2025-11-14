import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { QrCode, MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';

interface Reservation {
  id: string;
  slotDate: string;
  stationName: string;
  slotStartTime: string;
  slotEndTime?: string;
  qrCode: string;
  reservationCode: string;
}

interface SwapStatusProps {
  onQRDialog: () => void;
  onNavigateToBooking: () => void;
}

export function SwapStatus({ onQRDialog, onNavigateToBooking }: SwapStatusProps) {
  const { t } = useLanguage();

  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelNote, setCancelNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getReservation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Reservation[]>(
        "http://localhost:5194/api/v1/slot-reservations/mine",
        {
          params: { status: 0 },
          withCredentials: true,
        }
      );
      setActiveReservation(response.data?.[0] || null);
    } catch (error) {
      console.error(t("driver.booking.errorFetchReservation"), error);
      setError(t("driver.booking.errorFetchReservation"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getReservation();
  }, [t]);

  const showCancelReservation = () => setShowCancelPrompt(true);
  const hideCancelReservation = () => setShowCancelPrompt(false);

  const handleCancelReservation = async () => {
    if (!activeReservation) return;

    setIsCancelling(true);
    try {
      await axios.delete(
        `http://localhost:5194/api/v1/slot-reservations/${activeReservation.id}`,
        {
          data: { reason: 0, note: cancelNote },
          withCredentials: true,
        }
      );
      toast.success(t("driver.cancelBooking.success"));
      setActiveReservation(null);
      setShowCancelPrompt(false);
      setCancelNote("");
    } catch (error) {
      console.error("Lỗi khi hủy lịch hẹn:", error);
      toast.error(t("driver.cancelBooking.error"));
    } finally {
      setIsCancelling(false);
    }
  };

  const checkCancellationTiming = (): { isLate: boolean; timeUntilSlot: number; warningMessage: string } => {
    if (!activeReservation) return { isLate: false, timeUntilSlot: 0, warningMessage: '' };

    try {
      const dateParts = activeReservation.slotDate.split('-').map(Number);
      const timeParts = activeReservation.slotStartTime.split(':').map(Number);

      const slotStartDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
      const now = new Date();

      let slotEndDateTime: Date;
      if (activeReservation.slotEndTime) {
        const endTimeParts = activeReservation.slotEndTime.split(':').map(Number);
        slotEndDateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], endTimeParts[0], endTimeParts[1]);
      } else {
        slotEndDateTime = new Date(slotStartDateTime.getTime() + 30 * 60 * 1000);
      }

      const timeUntilSlot = (slotStartDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const timeUntilSlotEnd = (slotEndDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      const isLate = timeUntilSlot <= 1 && timeUntilSlotEnd > 0;

      let warningMessage = '';
      if (isLate && timeUntilSlot > 0) {
        warningMessage = t('driver.swapStatus.warningNearTime');
      } else if (isLate && timeUntilSlot <= 0 && timeUntilSlotEnd > 0) {
        warningMessage = t('driver.swapStatus.warningInTime');
      } else if (timeUntilSlot > 1) {
        warningMessage = t('driver.swapStatus.warningBefore1Hour');
      }

      return { isLate, timeUntilSlot, warningMessage };
    } catch (error) {
      return { isLate: false, timeUntilSlot: 0, warningMessage: '' };
    }
  };

  if (loading) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              {t("driver.swap")}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t("driver.swapStatus.manageTitle")}
            </p>
          </div>
          <Card className="text-center p-8 border-dashed">
            <CardContent className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              <p className="ml-2 text-gray-600">{t("driver.swapStatus.loadingCheck")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              {t("driver.swapStatus.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("driver.swapStatus.description")}
            </p>
          </div>
          <Card className="text-center p-8 border-dashed border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">{t("driver.swapStatus.errorTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={getReservation} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" /> {t("driver.swapStatus.retryButton")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeReservation) {
    const dateString = activeReservation.slotDate;
    const parts = dateString.split('-').map(Number);
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);

    return (
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              {t("driver.swapStatus.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("driver.swapStatus.description")}
            </p>
          </div>
          <Card className="border border-orange-500 rounded-lg">
            <CardHeader>
              <CardDescription>{t("driver.activeReservationDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-orange-600">{activeReservation.stationName}</h3>
                  <p className="text-gray-500">
                    {localDate.toLocaleDateString('vi-VN')} {t('driver.booking.atTime')} {activeReservation.slotStartTime.substring(0, 5)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg inline-block border">
                  <QRCodeSVG value={activeReservation.qrCode || ""} size={128} />
                </div>
                <p className="font-mono text-lg tracking-widest">{activeReservation.reservationCode}</p>
                <div className="space-y-3 pt-4">

                  {showCancelPrompt ? (
                    <div className="space-y-2 text-left">
                      {(() => {
                        const { isLate, timeUntilSlot, warningMessage } = checkCancellationTiming();

                        return (
                          <>
                            {isLate && (
                              <div className="p-3 rounded-lg border bg-red-50 border-red-300">
                                <p className="text-sm font-semibold text-red-700">
                                  {warningMessage}
                                </p>
                                <div className="mt-2 text-xs text-red-600 space-y-1">
                                  <p><strong>{t("driver.swapStatus.cancelNoticeTitle")}</strong></p>

                                  <p className="ml-3">- {t("driver.swapStatus.cancelSubscription")}</p>

                                  <p className="ml-3">- {t("driver.swapStatus.cancelPerSwap")}</p>


                                </div>
                              </div>
                            )}
                            {!isLate && timeUntilSlot > 1 && (
                              <div className="p-3 rounded-lg border bg-green-50 border-green-300">
                                <p className="text-sm font-semibold text-green-700">
                                  {warningMessage}
                                </p>
                                <p className="mt-1 text-xs text-green-600">
                                  - {t("driver.swapStatus.cancelEarlySubscription")}
                                  <br />- {t("driver.swapStatus.cancelEarlyPerSwap")}
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      <label htmlFor="cancelNote" className="block text-sm font-medium text-gray-700">
                        {t("driver.cancelReason")} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="cancelNote"
                        rows={3}
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100"
                        value={cancelNote}
                        onChange={(e) => setCancelNote(e.target.value)}
                        placeholder={t("driver.enterCancelReason")}
                        disabled={isCancelling}
                      />
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        onClick={handleCancelReservation}
                        disabled={isCancelling || !cancelNote.trim()}
                      >
                        {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t("driver.confirmCancel")}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={hideCancelReservation}
                        disabled={isCancelling}
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="w-full bg-orange-500 text-white"
                        onClick={showCancelReservation}
                      >
                        {t("driver.cancelBooking")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            {t("driver.swapStatus.title")}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("driver.swapStatus.description")}
          </p>
        </div>
        <Card className="text-center p-8 border-dashed">
          <CardHeader>
            <CardTitle>{t('driver.swapStatus.noReservationTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="bg-orange-500" onClick={onNavigateToBooking}>
              <MapPin className="w-4 h-4 mr-2" /> {t('driver.swapStatus.bookNow')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}