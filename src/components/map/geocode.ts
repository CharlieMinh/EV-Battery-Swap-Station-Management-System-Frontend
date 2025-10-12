import axios from "axios";
import { Coordinates } from "@/services/stationService";

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address) {
    console.warn("Geocode: Địa chỉ trống");
    return null;
  }

  try {
    console.log('🔍 Geocode: Đang tìm tọa độ cho địa chỉ:', address);

    // ✅ FIX 1: Thêm User-Agent header (BẮT BUỘC cho Nominatim)
    // ✅ FIX 2: Thêm countrycodes=vn để tìm ở Việt Nam
    // ✅ FIX 3: Tăng limit lên 5 để có nhiều kết quả hơn
    const url = `https://nominatim.openstreetmap.org/search`;
    
    const response = await axios.get(url, {
      params: {
        q: address,
        format: 'json',
        limit: 5,
        countrycodes: 'vn', // Giới hạn tìm kiếm ở Việt Nam
        addressdetails: 1,   // Lấy chi tiết địa chỉ
      },
      headers: {
        'User-Agent': 'FPT FAST', // QUAN TRỌNG: Thay bằng tên app của bạn
        'Accept-Language': 'vi,en',
      },
      timeout: 10000, // Timeout 10 giây
    });

    console.log('📍 Geocode: Response:', response.data);

    if (!response.data || response.data.length === 0) {
      console.warn("❌ Geocode: Không tìm thấy kết quả cho địa chỉ:", address);
      
      // Thử tìm với địa chỉ rút gọn
      const simplifiedAddress = simplifyVietnameseAddress(address);
      if (simplifiedAddress !== address) {
        console.log('🔄 Geocode: Thử lại với địa chỉ rút gọn:', simplifiedAddress);
        return geocodeAddress(simplifiedAddress);
      }
      
      return null;
    }

    // Lấy kết quả đầu tiên (thường là chính xác nhất)
    const result = response.data[0];
    const coordinates = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };

    console.log('✅ Geocode: Tìm thấy tọa độ:', coordinates);
    console.log('📍 Geocode: Display name:', result.display_name);
    
    return coordinates;

  } catch (error: any) {
    if (error.code === 'ECONNABORTED') {
      console.error("❌ Geocode: Timeout - Server phản hồi quá lâu");
    } else if (error.response?.status === 429) {
      console.error("❌ Geocode: Quá nhiều requests - Vui lòng đợi 1 giây");
    } else if (error.response?.status === 403) {
      console.error("❌ Geocode: Bị chặn - Kiểm tra User-Agent header");
    } else {
      console.error("❌ Geocode error:", error.message);
    }
    return null;
  }
}

// Helper function: Rút gọn địa chỉ Việt Nam để tìm dễ hơn
function simplifyVietnameseAddress(address: string): string {
  // Loại bỏ số nhà và tên đường cụ thể, chỉ giữ quận/huyện và thành phố
  const parts = address.split(',').map(p => p.trim());
  
  if (parts.length >= 3) {
    // Lấy 2-3 phần cuối (thường là quận/huyện và thành phố)
    return parts.slice(-3).join(', ');
  }
  
  return address;
}
export async function geocodeAddressMultiSource(address: string): Promise<Coordinates | null> {
  console.log('🔍 Geocode Multi-Source: Tìm tọa độ cho:', address);

  // Thử Nominatim trước
  let result = await geocodeAddress(address);
  if (result) return result;

  // Nếu Nominatim fail, thử với địa chỉ rút gọn
  console.log('🔄 Geocode: Thử với địa chỉ rút gọn...');
  const simplified = simplifyVietnameseAddress(address);
  result = await geocodeAddress(simplified);
  if (result) return result;

  // Nếu vẫn fail, thử chỉ với thành phố
  console.log('🔄 Geocode: Thử chỉ với tên thành phố...');
  const cityOnly = address.includes('Hồ Chí Minh') 
    ? 'Ho Chi Minh City, Vietnam' 
    : address.split(',').slice(-1)[0].trim();
  result = await geocodeAddress(cityOnly);
  
  if (!result) {
    console.error('❌ Geocode: Thất bại với tất cả phương pháp');
  }
  
  return result;
}

// Helper: Test geocoding với địa chỉ mẫu
export async function testGeocoding() {
  const testAddresses = [
    "709 Nguyễn Xiển, Long Thạnh Mỹ, Thủ Đức, Thành phố Hồ Chí Minh",
    "Long Thạnh Mỹ, Thủ Đức, Hồ Chí Minh",
    "Thủ Đức, Hồ Chí Minh",
    "Ho Chi Minh City, Vietnam"
  ];

  console.log('🧪 Testing geocoding...');
  
  for (const address of testAddresses) {
    const result = await geocodeAddress(address);
    console.log(`\n📍 "${address}":`);
    console.log(result ? `✅ ${result.lat}, ${result.lng}` : '❌ Không tìm thấy');
    
    // Đợi 1 giây giữa các request để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}