import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { CreditCard, QrCode, DollarSign, Printer, CheckCircle } from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { InvoiceDialog } from "./InvoiceDialog";

interface POSDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function POSDialog({ isOpen, onClose }: POSDialogProps) {
  const { t } = useLanguage();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [showInvoice, setShowInvoice] = useState(false);

  const handlePayment = (method: string) => {
    setSelectedPaymentMethod(method);
    setPaymentSuccess(true);
  };

  const handlePrintInvoice = () => {
    setShowInvoice(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoice(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border border-orange-200 rounded-lg bg-white shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-orange-600 text-2xl font-bold">
            {t("staff.pointOfSale")}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t("staff.pointOfSaleDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Success Message */}
          {paymentSuccess && (
            <Card className="border border-green-200 rounded-lg bg-green-50 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold text-green-600">Thanh toán thành công!</h3>
                  <p className="text-green-600">
                    Phương thức: {selectedPaymentMethod}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Số tiền: $25.00 đã được thanh toán thành công
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Details */}
          <Card className="border border-orange-100 rounded-lg bg-gray-50 shadow-sm">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-orange-600">$25.00</h3>
                <p className="text-gray-600">{t("staff.batterySwapService")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {!paymentSuccess && (
            <div className="space-y-2">
              <Button 
                className="w-full h-16 text-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg shadow"
                onClick={() => handlePayment("Thanh toán thẻ")}
              >
                <CreditCard className="w-5 h-5 mr-2" /> {t("staff.cardPayment")}
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-16 text-lg rounded-lg shadow"
                onClick={() => handlePayment("Thanh toán QR")}
              >
                <QrCode className="w-5 h-5 mr-2" /> {t("staff.qrPayment")}
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-16 text-lg rounded-lg shadow"
                onClick={() => handlePayment("Thanh toán tiền mặt")}
              >
                <DollarSign className="w-5 h-5 mr-2" /> {t("staff.cashPayment")}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-4">
            <Button variant="outline" className="rounded-lg" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            {paymentSuccess ? (
              <Button 
                className="bg-green-500 hover:bg-green-600 text-white rounded-lg" 
                onClick={handlePrintInvoice}
              >
                <Printer className="w-4 h-4 mr-2" /> In hóa đơn
              </Button>
            ) : (
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg" disabled>
                <Printer className="w-4 h-4 mr-2" /> {t("staff.printReceipt")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Invoice Dialog */}
      <InvoiceDialog
        isOpen={showInvoice}
        onClose={handleCloseInvoice}
        customerInfo={{
          name: "Alex Chen",
          vehicle: "Tesla Model 3 2023",
          bookingCode: "SW-2024-001"
        }}
      />
    </Dialog>
  );
}
