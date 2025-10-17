import axios from "axios";
import { Coordinates } from "@/services/admin/stationService";

const cache = new Map<string, Coordinates | null>();

// --- ĐỊNH NGHĨA URL PROXY BACKEND CỦA BẠN ---
// Thay đổi URL này thành đường dẫn đến API Proxy C# của bạn
const GEOCODE_PROXY_URL = 'http://localhost:5194/api/AwsLocation/geocode'; 
// Hoặc sử dụng biến môi trường FE nếu có (ví dụ: import.meta.env.VITE_BE_URL + '/api/AwsLocation/geocode')
// ---

/**
 * Chuyển đổi địa chỉ thành tọa độ bằng cách gọi API Proxy Backend an toàn.
 * Backend sẽ xử lý việc chèn AWS API Key.
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    if (!address?.trim()) {
        console.warn('Geocode: Địa chỉ trống');
        return null;
    }

    const key = address.toLowerCase().trim();

    // Check cache
    if (cache.has(key)) {
        console.log('📦 Geocode: Cache hit');
        return cache.get(key)!;
    }

    try {
        console.log('🔍 Calling C# Geocode Proxy for:', address);

        // Gửi yêu cầu đến Endpoint Proxy Backend CỦA BẠN
        const response = await axios.post(
            GEOCODE_PROXY_URL,
            // Cấu trúc request body phải khớp với lớp GeocodeRequest trong C#
            {
                Address: address, // LƯU Ý: Phải là 'Address' (PascalCase) để khớp với C# model
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    // KHÔNG cần x-api-key ở đây nữa! Backend sẽ tự thêm.
                },
                timeout: 10000,
            }
        );

        // Phản hồi từ Proxy Backend C# có dạng: { lat: number, lng: number, label: string }
        const coords = response.data as Coordinates | null; 

        if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
            console.warn('❌ Không tìm thấy kết quả hoặc phản hồi không hợp lệ từ Proxy.');
            cache.set(key, null);
            return null;
        }

        console.log('✅ Tìm thấy tọa độ:', coords);
        // Label thường được trả về cùng, bạn có thể log nếu muốn: console.log('📍', response.data.label);

        cache.set(key, coords);
        return coords;

    } catch (error: any) {
        console.error('❌ Proxy Geocode error:', error.message);
        if (error.response) {
            console.error('Error response from Proxy:', error.response.data);
        }
        cache.set(key, null);
        return null;
    }
}

export function clearGeocodeCache() {
    cache.clear();
    console.log('🗑️ Đã xóa cache');
}
