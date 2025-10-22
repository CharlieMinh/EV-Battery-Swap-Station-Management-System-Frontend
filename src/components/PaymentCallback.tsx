import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Home } from 'lucide-react';
import { handleVNPayCallback, handleVNPayReturn, VNPayCallbackParams } from '../services/subscriptionPaymentService';

interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  amount?: number;
  orderInfo?: string;
}

export function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        setLoading(true);
        
        // Extract VNPay parameters from URL
        const vnpayParams: VNPayCallbackParams = {
          vnp_Amount: searchParams.get('vnp_Amount') || '',
          vnp_BankCode: searchParams.get('vnp_BankCode') || '',
          vnp_BankTranNo: searchParams.get('vnp_BankTranNo') || '',
          vnp_CardType: searchParams.get('vnp_CardType') || '',
          vnp_OrderInfo: searchParams.get('vnp_OrderInfo') || '',
          vnp_PayDate: searchParams.get('vnp_PayDate') || '',
          vnp_ResponseCode: searchParams.get('vnp_ResponseCode') || '',
          vnp_TmnCode: searchParams.get('vnp_TmnCode') || '',
          vnp_TransactionNo: searchParams.get('vnp_TransactionNo') || '',
          vnp_TransactionStatus: searchParams.get('vnp_TransactionStatus') || '',
          vnp_TxnRef: searchParams.get('vnp_TxnRef') || '',
          vnp_SecureHash: searchParams.get('vnp_SecureHash') || ''
        };

        // Check if this is a callback or return
        const isCallback = window.location.pathname.includes('/callback');
        
        let response;
        if (isCallback) {
          response = await handleVNPayCallback(vnpayParams);
        } else {
          response = await handleVNPayReturn(vnpayParams);
        }

        // Process response
        if (vnpayParams.vnp_ResponseCode === '00') {
          setResult({
            success: true,
            message: 'Thanh toán thành công! Gói dịch vụ đã được kích hoạt.',
            transactionId: vnpayParams.vnp_TransactionNo,
            amount: parseInt(vnpayParams.vnp_Amount) / 100, // VNPay amount is in cents
            orderInfo: vnpayParams.vnp_OrderInfo
          });
        } else {
          setResult({
            success: false,
            message: 'Thanh toán thất bại hoặc bị hủy.',
            transactionId: vnpayParams.vnp_TransactionNo,
            orderInfo: vnpayParams.vnp_OrderInfo
          });
        }

      } catch (error: any) {
        console.error('Error processing payment:', error);
        setError(error.response?.data?.message || 'Có lỗi xảy ra khi xử lý thanh toán.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Đang xử lý thanh toán...</h2>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Lỗi xử lý thanh toán</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <Button onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {result?.success ? (
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          ) : (
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          )}
          <CardTitle className={`text-2xl ${result?.success ? 'text-green-600' : 'text-red-600'}`}>
            {result?.success ? 'Thanh Toán Thành Công!' : 'Thanh Toán Thất Bại'}
          </CardTitle>
          <CardDescription className="text-lg">
            {result?.message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {result?.transactionId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Mã giao dịch:</span>
                  <p className="font-mono text-gray-900">{result.transactionId}</p>
                </div>
                {result.amount && (
                  <div>
                    <span className="font-medium text-gray-600">Số tiền:</span>
                    <p className="font-semibold text-gray-900">{formatAmount(result.amount)}</p>
                  </div>
                )}
              </div>
              {result.orderInfo && (
                <div className="mt-2">
                  <span className="font-medium text-gray-600">Thông tin đơn hàng:</span>
                  <p className="text-gray-900">{result.orderInfo}</p>
                </div>
              )}
            </div>
          )}

          {result?.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">
                  Gói dịch vụ đã được kích hoạt thành công!
                </span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                Bạn có thể bắt đầu sử dụng dịch vụ ngay bây giờ.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/driver')}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vào Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


