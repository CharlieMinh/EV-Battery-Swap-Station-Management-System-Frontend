# Hướng dẫn Fix vấn đề Timezone (Lệch 7 giờ)

## Vấn đề
Backend trả về thời gian theo UTC (GMT+0), nhưng khi frontend parse và hiển thị không chỉ định timezone, dẫn đến **lệch chậm 7 giờ** so với thời gian thực tế ở Việt Nam (GMT+7).

## Giải pháp
Đã tạo file `src/utils/dateTimeUtils.ts` với các utility functions xử lý timezone đúng cách:

### Các hàm có sẵn:

```typescript
import { 
  formatDate,           // DD/MM/YYYY
  formatTime,           // HH:mm:ss
  formatDateTime,       // DD/MM/YYYY HH:mm:ss
  formatDateTimeShort,  // DD/MM/YYYY HH:mm
  formatRelativeTime,   // "2 giờ trước", "5 phút trước"
  formatCurrency,       // 1.000.000 ₫
  formatNumber          // 1.000.000
} from '../../utils/dateTimeUtils';
```

### Cách sử dụng:

#### ❌ SAI (sẽ lệch 7 giờ):
```typescript
const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("vi-VN") + " " + 
         date.toLocaleTimeString("vi-VN");
};
```

#### ✅ ĐÚNG (có timezone Asia/Ho_Chi_Minh):
```typescript
import { formatDateTime } from '../../utils/dateTimeUtils';

// Sử dụng trực tiếp
<p>{formatDateTime(customer.createdAt)}</p>
<p>{formatDate(subscription.startDate)}</p>
<p>{formatTime(transaction.completedAt)}</p>
```

## Các file cần cập nhật

### Đã cập nhật:
- ✅ `src/components/admin/StaffDetailModal.tsx`
- ✅ `src/components/staff/StaffCustomerManagement.tsx`

### Cần cập nhật thủ công:
Tìm và thay thế các hàm `formatDateTime`, `formatDate`, `formatTime` local bằng hàm từ `dateTimeUtils.ts`:

1. **Driver Components:**
   - `src/components/driver/SwapHistory.tsx`
   - `src/components/driver/MyPaymentsPage.tsx`
   - `src/components/driver/DriverProfile.tsx`
   - `src/components/driver/BookingWizard.tsx`
   - `src/components/driver/SubscriptionStatus.tsx`

2. **Staff Components:**
   - `src/components/staff/Revenue.tsx`
   - `src/components/staff/RequestBattery.tsx`
   - `src/components/staff/InventoryManagement.tsx`
   - `src/components/staff/CashPaymentManagement.tsx`
   - `src/components/staff/CheckRequest.tsx`
   - `src/components/staff/SendRequestList.tsx`
   - `src/components/staff/CheckSendRequest.tsx`

3. **Admin Components:**
   - `src/components/admin/CustomerDetailModal.tsx` (một phần đã update)
   - `src/components/admin/RequestForStation.tsx`
   - `src/components/admin/ComplaintsOfCustomer.tsx`
   - `src/components/admin/CheckRequestFromStaff.tsx`
   - `src/components/admin/AddPendingRequest.tsx`
   - `src/components/admin/RequestDetailModal.tsx`
   - `src/components/admin/NotificationBell.tsx`

## Pattern thay thế:

### 1. Import utility:
```typescript
import { formatDateTime, formatDate, formatTime } from '../../utils/dateTimeUtils';
```

### 2. Xóa hàm local:
```typescript
// XÓA CÁI NÀY:
const formatDateTime = (isoString: any) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("vi-VN") + " " + ...
};
```

### 3. Sử dụng hàm từ utility:
```typescript
// Không cần thay đổi cách gọi, chỉ cần import đúng
{formatDateTime(item.createdAt)}
```

## Lưu ý quan trọng:
- **LUÔN** sử dụng `timeZone: "Asia/Ho_Chi_Minh"` khi format date/time
- Không dùng `new Date().toLocaleDateString()` hoặc `toLocaleTimeString()` mà không có `timeZone`
- Backend có thể trả về ISO 8601 format với `Z` (UTC) hoặc không có timezone info
- JavaScript `new Date()` sẽ parse theo local timezone nếu không chỉ định

## Test:
Sau khi cập nhật, kiểm tra:
1. Thời gian hiển thị khớp với thời gian thực tế ở Việt Nam
2. Không còn lệch 7 giờ
3. Format hiển thị đúng: DD/MM/YYYY HH:mm:ss

## Tham khảo:
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [IANA Time Zone Database](https://www.iana.org/time-zones)

