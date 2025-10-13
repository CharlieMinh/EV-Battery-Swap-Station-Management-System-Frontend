import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Printer, Download, X } from "lucide-react";
import staffApi from "../../services/staffApi";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerInfo?: {
    name: string;
    vehicle: string;
    bookingCode: string;
  };
  transactionId?: string;
}

export function InvoiceDialog({ isOpen, onClose, customerInfo, transactionId }: InvoiceDialogProps) {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  const currentTime = new Date().toLocaleTimeString('vi-VN');

  const handlePrint = async () => {
    try {
      if (transactionId) {
        await staffApi.printInvoice(transactionId);
      }
      window.print();
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert("Có lỗi xảy ra khi in hóa đơn");
    }
  };

  const handleDownload = async () => {
    try {
      if (transactionId) {
        await staffApi.getInvoice(transactionId);
      }
      alert("Đã tải xuống hóa đơn thành công!");
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert("Có lỗi xảy ra khi tải xuống hóa đơn");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-gray-800 text-lg font-bold">
            Hóa Đơn Dịch Vụ
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            Phiếu thanh toán dịch vụ thay pin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Invoice Header */}
          <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <div>
                  <h1 className="text-lg font-bold text-gray-800">TRẠM THAY PIN ĐIỆN</h1>
                  <p className="text-gray-600 text-sm">EV Battery Swap Station</p>
                </div>
                
                <div className="border-t border-b border-gray-300 py-1">
                  <h2 className="text-base font-semibold text-gray-800">HÓA ĐƠN DỊCH VỤ</h2>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-left">
                    <p><span className="font-medium">Số:</span> INV-2024-001</p>
                    <p><span className="font-medium">Ngày:</span> {currentDate}</p>
                    <p><span className="font-medium">Giờ:</span> {currentTime}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-medium">Mã:</span> {customerInfo?.bookingCode || "SW-2024-001"}</p>
                    <p><span className="font-medium">NV:</span> Staff-001</p>
                    <p><span className="font-medium">Trạm:</span> Station-A</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Thông Tin Khách Hàng</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p><span className="font-medium">Tên:</span> {customerInfo?.name || "Alex Chen"}</p>
                  <p><span className="font-medium">SĐT:</span> 0123456789</p>
                </div>
                <div>
                  <p><span className="font-medium">Xe:</span> {customerInfo?.vehicle || "Tesla Model 3 2023"}</p>
                  <p><span className="font-medium">Biển số:</span> 30A-12345</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Chi Tiết Dịch Vụ</h3>
              <div className="space-y-2">
                <div className="border border-gray-200 rounded p-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm">Dịch Vụ Thay Pin</h4>
                      <div className="mt-1 text-xs text-gray-500">
                        <p>• Pin cũ: BAT-OLD-12345 (15%)</p>
                        <p>• Pin mới: BAT-NEW-67890 (100%)</p>
                        <p>• Slot: A2 → B3</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800 text-sm">$25.00</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded p-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm">Dịch Vụ Bổ Sung</h4>
                      <div className="mt-1 text-xs text-gray-500">
                        <p>• Kiểm tra hệ thống làm mát</p>
                        <p>• Vệ sinh đầu nối pin</p>
                        <p>• Cập nhật firmware</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800 text-sm">$5.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="border border-gray-200 rounded-lg bg-orange-50 shadow-sm">
            <CardContent className="p-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Tổng Kết Thanh Toán</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Dịch vụ thay pin:</span>
                  <span>$25.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Dịch vụ bổ sung:</span>
                  <span>$5.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Thuế VAT (10%):</span>
                  <span>$3.00</span>
                </div>
                <div className="border-t border-gray-300 pt-1">
                  <div className="flex justify-between font-bold text-sm">
                    <span>Tổng cộng:</span>
                    <span className="text-orange-600">$33.00</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Thanh toán:</span>
                  <span>Thẻ</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Trạng thái:</span>
                  <span className="text-green-600 font-medium">Đã thanh toán</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <Card className="border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-gray-600">
                Cảm ơn quý khách đã sử dụng dịch vụ!
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Hotline: 1900-1234 | Email: support@evstation.com
              </p>
              <p className="text-xs text-gray-500">
                Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between mt-4">
            <Button variant="outline" className="rounded-lg text-sm px-3 py-1" onClick={onClose}>
              <X className="w-3 h-3 mr-1" />
              Đóng
            </Button>
            <div className="space-x-2">
              <Button variant="outline" className="rounded-lg text-sm px-3 py-1" onClick={handleDownload}>
                <Download className="w-3 h-3 mr-1" />
                Tải xuống
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm px-3 py-1" onClick={handlePrint}>
                <Printer className="w-3 h-3 mr-1" />
                In hóa đơn
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
