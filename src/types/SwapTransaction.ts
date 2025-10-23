export interface SwapTransaction {
  id: string;
  transactionNumber: string;
  status: string;
  userEmail: string;
  stationName: string;
  stationAddress: string;
  vehicleLicensePlate: string;
  vehicleModel: string;
  vehicleOdoAtSwap: number;
  issuedBatterySerial: string;
  returnedBatterySerial: string;
  batteryHealthIssued: number;
  batteryHealthReturned: number;
  paymentType: string;
  swapFee: number;
  kmChargeAmount: number;
  totalAmount: number;
  isPaid: boolean;
  startedAt: string;
  checkedInAt: string;
  batteryIssuedAt: string;
  batteryReturnedAt: string;
  completedAt: string;
  notes: string;
  reservationId: string;
  userSubscriptionId: string;
  rating: number;
  feedback: string;
  ratedAt: string;
}

// Kiểu phản hồi từ API
export interface SwapHistoryResponse {
  transactions: SwapTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}