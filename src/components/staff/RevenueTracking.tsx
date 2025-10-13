import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Receipt,
  Wallet,
  Banknote,
  Filter,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { useLanguage } from "../LanguageContext";
import { RevenueStats, Transaction } from "../../services/staffApi";
import staffApi from "../../services/staffApi";

interface RevenueTrackingProps {
  stationId: number;
}

export function RevenueTracking({ stationId }: RevenueTrackingProps) {
  const { t, formatCurrency } = useLanguage();
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'pending' | 'paid'>('all');
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const [stats, trans] = await Promise.all([
        staffApi.getRevenueStats(stationId, period),
        staffApi.getTransactions(stationId, 50)
      ]);
      setRevenueStats(stats);
      setTransactions(trans);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [stationId, period]);

  const handleStatusUpdate = async (transactionId: string, newStatus: 'unpaid' | 'pending' | 'paid') => {
    try {
      await staffApi.updatePaymentStatus(transactionId, newStatus);
      // Refresh data after status update
      await fetchRevenueData();
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterStatus === 'all') return true;
    return transaction.paymentStatus === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Đã thanh toán</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Chờ thanh toán</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Chưa thanh toán</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'online':
        return <Badge className="bg-blue-100 text-blue-800"><Smartphone className="w-3 h-3 mr-1" />Thanh toán online</Badge>;
      case 'counter':
        return <Badge className="bg-purple-100 text-purple-800"><CreditCard className="w-3 h-3 mr-1" />Thanh toán tại quầy</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg border border-orange-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <Receipt className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Thu Ngân</h1>
                <p className="text-orange-100 text-sm">Hệ thống quản lý thanh toán và doanh thu</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-3 py-1"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                {showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-3 py-1"
                onClick={fetchRevenueData}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Select value={period} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setPeriod(value)}>
                <SelectTrigger className="w-40 bg-gray-50 border-gray-200 text-sm">
                  <Calendar className="w-3 h-3 mr-2 text-orange-500" />
                  <SelectValue placeholder="Chọn thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">📅 Theo tháng</SelectItem>
                  <SelectItem value="quarterly">📊 Theo quý</SelectItem>
                  <SelectItem value="yearly">📈 Theo năm</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 px-3 py-1 text-xs">
                🕐 {revenueStats?.periodLabel}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      {revenueStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue Card */}
          <Card className="bg-gradient-to-br from-green-400 to-green-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">💰 Tổng Doanh Thu</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(revenueStats.totalRevenue)}</p>
                  <p className="text-green-100 text-xs mt-1">Tất cả giao dịch</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Online Revenue Card */}
          <Card className="bg-gradient-to-br from-blue-400 to-blue-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">📱 Thanh Toán Online</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(revenueStats.onlineRevenue)}</p>
                  <p className="text-blue-100 text-xs mt-1">Giao dịch online</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Counter Revenue Card */}
          <Card className="bg-gradient-to-br from-purple-400 to-purple-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">🏪 Thanh Toán Tại Quầy</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(revenueStats.counterRevenue)}</p>
                  <p className="text-purple-100 text-xs mt-1">Giao dịch tại quầy</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Banknote className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Paid Transactions Card */}
          <Card className="bg-gradient-to-br from-orange-400 to-orange-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">✅ Giao Dịch Đã Thanh Toán</p>
                  <p className="text-2xl font-bold mt-1">{revenueStats.paidTransactions}</p>
                  <p className="text-orange-100 text-xs mt-1">Giao dịch hoàn thành</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Status Summary */}
      {revenueStats && showDetails && (
        <Card className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-500 rounded-full p-1.5">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">📊 Tổng Quan Trạng Thái Thanh Toán</h2>
                <p className="text-gray-600 text-xs">Thống kê chi tiết các giao dịch</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Paid Transactions */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500 rounded-full p-2">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800 text-sm">✅ Đã Thanh Toán</p>
                      <p className="text-green-600 text-xs">Giao dịch hoàn thành</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{revenueStats.paidTransactions}</p>
                    <p className="text-green-500 text-xs">giao dịch</p>
                  </div>
                </div>
              </div>
              
              {/* Pending Transactions */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-500 rounded-full p-2">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-yellow-800 text-sm">⏳ Chờ Thanh Toán</p>
                      <p className="text-yellow-600 text-xs">Đang xử lý</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">{revenueStats.pendingTransactions}</p>
                    <p className="text-yellow-500 text-xs">giao dịch</p>
                  </div>
                </div>
              </div>
              
              {/* Unpaid Transactions */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-500 rounded-full p-2">
                      <XCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-red-800 text-sm">❌ Chưa Thanh Toán</p>
                      <p className="text-red-600 text-xs">Cần xử lý</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{revenueStats.unpaidTransactions}</p>
                    <p className="text-red-500 text-xs">giao dịch</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction List with Filters */}
      <Card className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-3 border-b border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-500 rounded-full p-1.5">
                <Receipt className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">📋 Danh Sách Giao Dịch</h2>
                <p className="text-gray-600 text-xs">Quản lý và cập nhật trạng thái thanh toán</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 px-3 py-1 text-xs">
              📊 {filteredTransactions.length} giao dịch
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          {/* Filter Controls */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-orange-500" />
              <span className="text-gray-700 font-medium text-sm">Lọc theo trạng thái:</span>
            </div>
            <Select value={filterStatus} onValueChange={(value: 'all' | 'unpaid' | 'pending' | 'paid') => setFilterStatus(value)}>
              <SelectTrigger className="w-48 bg-gray-50 border-gray-200 text-sm">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🔍 Tất cả giao dịch</SelectItem>
                <SelectItem value="unpaid">❌ Chưa thanh toán</SelectItem>
                <SelectItem value="pending">⏳ Chờ thanh toán</SelectItem>
                <SelectItem value="paid">✅ Đã thanh toán</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-orange-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Time & Date */}
                    <div className="text-center bg-orange-100 rounded-lg p-3 min-w-[80px]">
                      <p className="font-mono text-lg text-orange-600 font-bold">{transaction.time}</p>
                      <p className="text-xs text-orange-500 mt-1">{transaction.date}</p>
                    </div>
                    
                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="bg-blue-100 rounded-full p-1.5">
                          <Receipt className="w-3 h-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{transaction.customer}</p>
                          <p className="text-gray-600 text-xs">{transaction.vehicle}</p>
                        </div>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(transaction.paymentStatus)}
                        {getPaymentTypeBadge(transaction.paymentType)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Amount & Actions */}
                  <div className="text-right">
                    <div className="bg-green-100 rounded-lg p-3 mb-3">
                      <p className="text-xl font-bold text-green-600">{formatCurrency(transaction.amount)}</p>
                      <p className="text-xs text-green-500">Số tiền</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-1">
                      {transaction.paymentStatus !== 'paid' && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs px-3 py-1"
                          onClick={() => handleStatusUpdate(transaction.id, 'paid')}
                        >
                          ✅ Đánh dấu đã thanh toán
                        </Button>
                      )}
                      {transaction.paymentStatus !== 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-400 text-yellow-600 hover:bg-yellow-50 hover:border-yellow-500 transition-all duration-200 text-xs px-3 py-1"
                          onClick={() => handleStatusUpdate(transaction.id, 'pending')}
                        >
                          ⏳ Chờ thanh toán
                        </Button>
                      )}
                      {transaction.paymentStatus !== 'unpaid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500 transition-all duration-200 text-xs px-3 py-1"
                          onClick={() => handleStatusUpdate(transaction.id, 'unpaid')}
                        >
                          ❌ Chưa thanh toán
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
