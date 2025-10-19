import axios from "axios";
import { Coordinates } from "@/services/admin/stationService";

// Cache để tránh gọi API lặp lại
const cache = new Map<string, Coordinates | null>();

const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY;
const GOONG_GEOCODE_URL = "https://rsapi.goong.io/geocode";

// Bounding box (approx) cho TP.HCM — dùng để ưu tiên kết quả nằm trong khu vực này
const HCM_BOUNDS = {
  latMin: 10.0,
  latMax: 11.5,
  lngMin: 105.5,
  lngMax: 107.5,
};

function isInHCM(lat: number, lng: number) {
  return lat >= HCM_BOUNDS.latMin &&
         lat <= HCM_BOUNDS.latMax &&
         lng >= HCM_BOUNDS.lngMin &&
         lng <= HCM_BOUNDS.lngMax;
}

/**
 * Tạo vài biến thể "gọn" của địa chỉ để tăng khả năng match đúng (loại bỏ phường, mã bưu chính, lặp city...)
 */
function buildAddressVariants(formAddress: string, city?: string) {
  const variants: string[] = [];
  const cityNormalized = city?.trim() || "";

  // raw
  variants.push(`${formAddress}${cityNormalized ? `, ${cityNormalized}` : ""}`);

  // rút gọn: bỏ phần "Phường ..." (nếu có)
  const noWard = formAddress.replace(/\b(P(hường|huong)|Phường|P\.)\b[^,]*/gi, "").replace(/\s+,/g, ",").trim();
  if (noWard !== formAddress) variants.push(`${noWard}${cityNormalized ? `, ${cityNormalized}` : ""}`);

  // rút gọn: chỉ lấy tên đường + quận (nếu có từ 'Quận' hoặc 'Q.')
  const matchDistrict = formAddress.match(/(.+?)(?:,|\b)(.*?(Quận|Q\.)[^,]*)/i);
  if (matchDistrict && matchDistrict[1]) {
    const street = matchDistrict[1].trim();
    const district = matchDistrict[2] ? matchDistrict[2].trim() : "";
    variants.push(`${street}${district ? `, ${district}` : ""}${cityNormalized ? `, ${cityNormalized}` : ""}`);
  }

  // bổ sung: "TP <city>" shorthand
  if (cityNormalized) {
    variants.push(`${formAddress}, TP ${cityNormalized}`);
    variants.push(`${formAddress}, ${cityNormalized}`);
  }

  // thêm 1 biến thể ngắn: tên địa điểm + city (nếu chuỗi có tên địa điểm bằng chữ hoa đầu)
  const firstPart = formAddress.split(",")[0].trim();
  if (firstPart && firstPart.length < 60) {
    variants.push(`${firstPart}${cityNormalized ? `, ${cityNormalized}` : ""}`);
  }

  // loại trùng lặp và trim
  return Array.from(new Set(variants.map(v => v.replace(/\s{2,}/g, " ").trim()))).filter(Boolean);
}

/**
 * Phiên bản nâng cao: thử nhiều biến thể address, ưu tiên kết quả có 'Hồ Chí Minh' hoặc nằm trong bounding box HCM.
 */
export async function geocodeAddress(address: string, city?: string): Promise<Coordinates | null> {
  if (!address?.trim()) return null;

  const cacheKey = `${address}__${city ?? ""}`.toLowerCase().trim();
  if (cache.has(cacheKey)) {
    console.log("📦 Cache hit:", address);
    return cache.get(cacheKey)!;
  }

  if (!GOONG_API_KEY) {
    console.error("❌ Thiếu VITE_GOONG_API_KEY trong .env");
    return null;
  }

  // Tạo các biến thể để thử
  const variants = buildAddressVariants(address, city ?? "");
  console.log("🔍 Thử các biến thể address:", variants);

  try {
    for (const variant of variants) {
      // Log URL debug (dễ copy vào trình duyệt)
      const encoded = encodeURIComponent(variant);
      const fullUrl = `${GOONG_GEOCODE_URL}?address=${encoded}&api_key=${GOONG_API_KEY}`;
      console.log("🌐 gọi:", fullUrl);

      const res = await axios.get(GOONG_GEOCODE_URL, {
        params: { address: encoded, api_key: GOONG_API_KEY },
        timeout: 10000,
      });

      const results = res.data?.results || [];
      if (!results.length) {
        console.log("→ Không có kết quả cho biến thể:", variant);
        continue;
      }

      // Log tất cả kết quả ngắn gọn
      results.forEach((r: any, i: number) => {
        const formatted = r.formatted_address || r.formattedAddress || "";
        const loc = r.geometry?.location || {};
        console.log(`  #${i}: ${formatted} → ${loc.lat} ${loc.lng}`);
      });

      // 1) Tìm kết quả chứa "Hồ Chí Minh" (không phân biệt hoa thường)
      const preferByCity = results.find((r: any) => {
        const f = (r.formatted_address || r.formattedAddress || "").toLowerCase();
        return f.includes("hồ chí minh") || f.includes("ho chi minh") || f.includes("tp hồ chí minh") || f.includes("tphcm") || f.includes("quận");
      });
      if (preferByCity) {
        const loc = preferByCity.geometry.location;
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          console.log("✅ Chọn kết quả ưu tiên theo city:", preferByCity.formatted_address || preferByCity.formattedAddress);
          const coords = { lat: loc.lat, lng: loc.lng };
          cache.set(cacheKey, coords);
          return coords;
        }
      }

      // 2) Nếu không có kết quả chứa city, tìm kết quả nằm trong bounding box HCM
      const preferByBBox = results.find((r: any) => {
        const loc = r.geometry?.location;
        return loc && isInHCM(loc.lat, loc.lng);
      });
      if (preferByBBox) {
        const loc = preferByBBox.geometry.location;
        console.log("✅ Chọn kết quả theo bounding box HCM:", preferByBBox.formatted_address || preferByBBox.formattedAddress);
        const coords = { lat: loc.lat, lng: loc.lng };
        cache.set(cacheKey, coords);
        return coords;
      }

      // 3) Fallback: lấy results[0] nếu nó nằm trong dải lat/lng hợp lý (tránh Nha Trang/Hà Nội v.v.)
      const first = results[0];
      const locFirst = first.geometry?.location;
      if (locFirst && typeof locFirst.lat === "number" && typeof locFirst.lng === "number") {
        if (isInHCM(locFirst.lat, locFirst.lng)) {
          console.log("✅ Chọn results[0] (nằm trong HCM):", first.formatted_address || first.formattedAddress);
          const coords = { lat: locFirst.lat, lng: locFirst.lng };
          cache.set(cacheKey, coords);
          return coords;
        } else {
          console.log("→ results[0] KHÔNG nằm trong HCM, bỏ qua:", first.formatted_address || first.formattedAddress);
          // tiếp tục vòng lặp: thử biến thể kế tiếp
        }
      }
      // nếu none matched, tiếp tục với biến thể kế
    }

    // Sau khi thử hết các biến thể mà không tìm ra kết quả hợp lý, log và trả null
    console.warn("⚠️ Không tìm thấy kết quả geocode phù hợp trong HCM cho:", address);
    cache.set(cacheKey, null);
    return null;
  } catch (error: any) {
    console.error("❌ Lỗi khi gọi Goong API:", error?.message ?? error);
    cache.set(cacheKey, null);
    return null;
  }
}

/** Xóa cache geocode */
export function clearGeocodeCache() {
  cache.clear();
  console.log("🗑️ Đã xóa cache geocode");
}
