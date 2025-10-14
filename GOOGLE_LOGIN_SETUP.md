# 🔐 Hướng dẫn cài đặt Google Login cho Frontend

## 📋 Tổng quan

Tài liệu này hướng dẫn cách tích hợp Google OAuth 2.0 Login vào React Frontend của hệ thống EV Battery Swap Station Management System.

## 🎯 Các file đã tạo

1. **`src/components/GoogleLoginButton.tsx`** - Component nút đăng nhập Google
2. **`src/services/authApi.ts`** - API services cho authentication
3. **`src/components/LoginPage.tsx`** - Đã cập nhật để tích hợp Google Login

## ⚙️ Cấu hình

### Bước 1: Lấy Google Client ID

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable **Google+ API** và **Google Identity**
4. Vào **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
6. Chọn **Web application**
7. **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
8. **Authorized redirect URIs**:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   ```
9. Copy **Client ID** (có dạng: `123456789-abc.apps.googleusercontent.com`)

### Bước 2: Cập nhật Client ID trong Frontend

Mở file `src/components/GoogleLoginButton.tsx` và thay thế:

```typescript
client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
```

Thành Client ID thực tế của bạn:

```typescript
client_id: '289474717245-ct0v1be2bqt09v9km4kbv9mbqa8199gl.apps.googleusercontent.com',
```

### Bước 3: Cấu hình Backend

Đảm bảo backend đã được cấu hình đúng trong `appsettings.json`:

```json
{
  "GoogleAuth": {
    "ClientId": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

**Lưu ý:** Client ID ở Frontend và Backend phải giống nhau!

### Bước 4: Cấu hình Axios Base URL

Kiểm tra file `src/configs/axios.ts` và đảm bảo baseURL trỏ đến backend:

```typescript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5194', // Backend API URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Cho phép gửi cookies
});

// Interceptor để tự động thêm token vào headers
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
```

### Bước 5: Thêm Translation (Tùy chọn)

Nếu bạn sử dụng đa ngôn ngữ, thêm vào file translation:

```json
{
  "login": {
    "orContinueWith": "Hoặc tiếp tục với",
    "continueWithGoogle": "Tiếp tục với Google"
  }
}
```

## 🚀 Cách sử dụng

### Trong LoginPage

Component `GoogleLoginButton` đã được tích hợp vào `LoginPage.tsx`:

```tsx
<GoogleLoginButton 
  onSuccess={handleGoogleLoginSuccess}
  onError={handleGoogleLoginError}
/>
```

### Callbacks

- **onSuccess**: Được gọi khi đăng nhập thành công, nhận về `{ token, role, name }`
- **onError**: Được gọi khi có lỗi xảy ra

### Flow hoạt động

1. User click vào nút "Sign in with Google"
2. Google hiển thị popup chọn tài khoản
3. User chọn tài khoản và đồng ý
4. Google trả về ID Token
5. Frontend gửi ID Token đến Backend API: `POST /api/v1/auth/google-login`
6. Backend xác thực token với Google
7. Backend tạo/tìm user và trả về JWT token
8. Frontend lưu token vào localStorage
9. Frontend điều hướng user theo role:
   - **Driver** → `/driver/dashboard` hoặc `/`
   - **Staff** → `/staff/dashboard`
   - **Admin** → `/admin/dashboard`

## 📡 API Endpoints

### Google Login

**Endpoint:** `POST /api/v1/auth/google-login`

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Response Success (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "Driver",
  "name": "Nguyễn Văn A"
}
```

**Response Error (401):**
```json
{
  "error": {
    "code": "GOOGLE_AUTH_FAILED",
    "message": "Google authentication failed.",
    "details": "Invalid ID token"
  }
}
```

## 🧪 Testing

### 1. Kiểm tra Backend đã chạy

Đảm bảo Backend đang chạy tại `http://localhost:5194`:

```powershell
cd d:\SWP391\BE\EV-Battery-Swap-Station-Management-System-Backend\src\EVBSS.Api
dotnet run
```

Truy cập Swagger: http://localhost:5194/swagger

### 2. Chạy Frontend

```powershell
cd d:\SWP391\FE\EV-Battery-Swap-Station-Management-System-Frontend
npm run dev
```

Truy cập: http://localhost:5173

### 3. Test Google Login

1. Vào trang Login: http://localhost:5173/login
2. Click nút "Sign in with Google"
3. Chọn tài khoản Google
4. Kiểm tra Console (F12) để xem log
5. Xác nhận redirect đến dashboard đúng

### 4. Test bằng file HTML (Tùy chọn)

Có thể sử dụng file `test-google-login.html` từ Backend để test trực tiếp:

```powershell
# Mở file trong browser
start d:\SWP391\BE\EV-Battery-Swap-Station-Management-System-Backend\test-google-login.html
```

## 🔍 Troubleshooting

### Lỗi "Invalid Client ID"

**Nguyên nhân:** Client ID không đúng hoặc chưa được cấu hình

**Giải pháp:**
1. Kiểm tra lại Client ID trong `GoogleLoginButton.tsx`
2. Đảm bảo Client ID trong Frontend và Backend giống nhau
3. Kiểm tra xem Client ID có được tạo cho "Web application" không

### Lỗi "Origin not allowed"

**Nguyên nhân:** Origin của Frontend chưa được thêm vào Authorized JavaScript origins

**Giải pháp:**
1. Vào Google Cloud Console
2. Thêm `http://localhost:5173` vào **Authorized JavaScript origins**
3. Đợi vài phút để cấu hình có hiệu lực

### Lỗi CORS

**Nguyên nhân:** Backend chưa cấu hình CORS cho Frontend

**Giải pháp:**
Kiểm tra `Program.cs` trong Backend có cấu hình CORS:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### Lỗi "GOOGLE_AUTH_FAILED"

**Nguyên nhân:** Backend không thể xác thực ID Token

**Giải pháp:**
1. Kiểm tra xem package `Google.Apis.Auth` đã được cài trong Backend chưa
2. Kiểm tra Client ID trong `appsettings.json`
3. Xem log chi tiết trong Console của Backend

### Token không được lưu

**Nguyên nhân:** localStorage bị block hoặc code lưu token sai

**Giải pháp:**
1. Mở DevTools (F12) → Application → Local Storage
2. Kiểm tra xem có key `token` và `user` không
3. Kiểm tra Console có lỗi không

## 📦 Dependencies

Đảm bảo các package sau đã được cài:

### Frontend
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x"
  }
}
```

### Backend
```xml
<PackageReference Include="Google.Apis.Auth" Version="1.68.0" />
```

## 🔒 Security Notes

1. **KHÔNG bao giờ commit Client Secret vào Git**
2. Sử dụng HTTPS trong production
3. Validate token ở Backend, không tin tưởng Frontend
4. Set HttpOnly cookie cho JWT token
5. Implement token refresh mechanism
6. Thêm rate limiting cho login endpoints

## 📚 Resources

- [Google Sign-In Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Google.Apis.Auth NuGet](https://www.nuget.org/packages/Google.Apis.Auth)

## 🆘 Support

Nếu gặp vấn đề, kiểm tra:
1. Console log trong Browser (F12)
2. Network tab để xem request/response
3. Backend logs
4. Swagger UI để test API trực tiếp

---

**Tác giả:** GitHub Copilot  
**Ngày cập nhật:** 2025-01-14
