import axios from "axios";
import { Coordinates } from "@/services/admin/stationService";

// Cache để tránh gọi API lặp lại
const cache = new Map<string, Coordinates | null>();

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAPBOX_GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

/**
 * Sinh các biến thể địa chỉ khác nhau để tăng khả năng tìm đúng
 */
function buildAddressVariants(formAddress: string, city?: string) {
  const variants: string[] = [];
  const cityNormalized = city?.trim() || "";

  variants.push(`${formAddress}${cityNormalized ? `, ${cityNormalized}` : ""}`);

  // Rút gọn bớt “Phường”, “Quận”, v.v.
  const noWard = formAddress
    .replace(/\b(P(hường|huong)|Phường|P\.)\b[^,]*/gi, "")
    .replace(/\s+,/g, ",")
    .trim();
  if (noWard !== formAddress)
    variants.push(`${noWard}${cityNormalized ? `, ${cityNormalized}` : ""}`);

  // Dạng viết khác
  if (cityNormalized) {
    variants.push(`${formAddress}, TP ${cityNormalized}`);
    variants.push(`${formAddress}, ${cityNormalized}`);
  }

  // Thêm dạng ngắn chỉ lấy phần đầu
  const firstPart = formAddress.split(",")[0].trim();
  if (firstPart && firstPart.length < 60) {
    variants.push(`${firstPart}${cityNormalized ? `, ${cityNormalized}` : ""}`);
  }

  return Array.from(
    new Set(variants.map((v) => v.replace(/\s{2,}/g, " ").trim()))
  ).filter(Boolean);
}

/**
 * Geocode sử dụng Mapbox API (toàn quốc, không giới hạn TP.HCM)
 */
export async function geocodeAddress(
  address: string,
  city?: string
): Promise<Coordinates | null> {
  if (!address?.trim()) return null;

  const cacheKey = `${address}__${city ?? ""}`.toLowerCase().trim();
  if (cache.has(cacheKey)) {
    console.log("📦 Cache hit:", address);
    return cache.get(cacheKey)!;
  }

  if (!MAPBOX_TOKEN) {
    console.error("❌ Thiếu VITE_MAPBOX_TOKEN trong .env");
    return null;
  }

  const variants = buildAddressVariants(address, city ?? "");
  console.log("🔍 Thử các biến thể address:", variants);

  try {
    for (const variant of variants) {
      const encoded = encodeURIComponent(variant);
      const fullUrl = `${MAPBOX_GEOCODE_URL}/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=3&country=VN`;
      console.log("🌐 Gọi:", fullUrl);

      const res = await axios.get(fullUrl, { timeout: 10000 });
      const features = res.data?.features || [];

      if (!features.length) {
        console.log("→ Không có kết quả cho biến thể:", variant);
        continue;
      }

      // Log ngắn gọn kết quả
      features.forEach((f: any, i: number) => {
        console.log(`  #${i}: ${f.place_name} → ${f.center[1]}, ${f.center[0]}`);
      });

      // Chọn kết quả đầu tiên (thường chính xác nhất)
      const [lng, lat] = features[0].center;
      const coords = { lat, lng };
      console.log("✅ Kết quả được chọn:", features[0].place_name);
      cache.set(cacheKey, coords);
      return coords;
    }

    console.warn("⚠️ Không tìm thấy kết quả hợp lý:", address);
    cache.set(cacheKey, null);
    return null;
  } catch (error: any) {
    console.error("❌ Lỗi khi gọi Mapbox API:", error?.message ?? error);
    cache.set(cacheKey, null);
    return null;
  }
}

/** Xóa cache geocode */
export function clearGeocodeCache() {
  cache.clear();
  console.log("🗑️ Đã xóa cache geocode");
}
