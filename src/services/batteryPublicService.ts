import api from "@/configs/axios";

/**
 * Interface cho Battery Unit từ API public
 * Dựa trên cấu trúc từ batteryService.ts nhưng cho API public
 */
export interface PublicBatteryUnit {
  id: string;
  serialNumber?: string;
  serial?: string;
  batteryModelId?: string;
  batteryModelName?: string;
  model?: string;
  modelName?: string;
  status: string; // "Full", "Available", "Charging", etc.
  stationId: string;
  stationName?: string;
  isReserved?: boolean;
  updatedAt?: string;
}

/**
 * Lấy tất cả battery units từ tất cả các trạm (Public API - không cần authentication)
 * GET /api/BatteryUnits/public
 */
export async function fetchAllPublicBatteries(): Promise<PublicBatteryUnit[]> {
  try {
    const response = await api.get("/api/BatteryUnits/public");
    
    // Xử lý các format response khác nhau
    let batteries: PublicBatteryUnit[] = [];
    
    if (Array.isArray(response.data)) {
      batteries = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      batteries = response.data.data;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      batteries = response.data.items;
    } else {
      console.warn("Unexpected response format from /api/BatteryUnits/public", response.data);
      return [];
    }

    // Normalize data để đảm bảo có stationId
    return batteries.map((battery: any) => ({
      id: battery.id || battery.batteryId || battery.unitId || "",
      serialNumber: battery.serialNumber || battery.serial || "",
      batteryModelId: battery.batteryModelId || battery.modelId || "",
      batteryModelName: battery.batteryModelName || battery.modelName || battery.model || "",
      status: battery.status || "",
      stationId: battery.stationId || battery.station?.id || "",
      stationName: battery.stationName || battery.station?.name || "",
      isReserved: battery.isReserved || false,
      updatedAt: battery.updatedAt || battery.updated_at || "",
    }));
  } catch (error) {
    console.error("Error fetching all public batteries:", error);
    throw error;
  }
}

/**
 * Lấy battery units của một trạm cụ thể (Public API - không cần authentication)
 * GET /api/BatteryUnits/public/station/{stationId}
 */
export async function fetchPublicBatteriesByStation(
  stationId: string
): Promise<PublicBatteryUnit[]> {
  try {
    const response = await api.get(`/api/BatteryUnits/public/station/${stationId}`);
    
    // Xử lý các format response khác nhau
    let batteries: PublicBatteryUnit[] = [];
    
    if (Array.isArray(response.data)) {
      batteries = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      batteries = response.data.data;
    } else if (response.data?.items && Array.isArray(response.data.items)) {
      batteries = response.data.items;
    } else {
      console.warn("Unexpected response format from /api/BatteryUnits/public/station", response.data);
      return [];
    }

    // Normalize data
    return batteries.map((battery: any) => ({
      id: battery.id || battery.batteryId || battery.unitId || "",
      serialNumber: battery.serialNumber || battery.serial || "",
      batteryModelId: battery.batteryModelId || battery.modelId || "",
      batteryModelName: battery.batteryModelName || battery.modelName || battery.model || "",
      status: battery.status || "",
      stationId: battery.stationId || battery.station?.id || stationId,
      stationName: battery.stationName || battery.station?.name || "",
      isReserved: battery.isReserved || false,
      updatedAt: battery.updatedAt || battery.updated_at || "",
    }));
  } catch (error) {
    console.error(`Error fetching public batteries for station ${stationId}:`, error);
    throw error;
  }
}

/**
 * Đếm số lượng pin của một trạm (sử dụng API public)
 * Option 1: Filter từ tất cả batteries
 * Option 2: Gọi API riêng cho station
 */
export async function countBatteriesByStation(
  stationId: string,
  options?: {
    status?: string; // Filter theo status, ví dụ: "Full", "Available"
    useStationEndpoint?: boolean; // true = gọi /station/{id}, false = filter từ all
  }
): Promise<number> {
  try {
    let batteries: PublicBatteryUnit[] = [];

    if (options?.useStationEndpoint) {
      // Option 2: Gọi API riêng cho station
      batteries = await fetchPublicBatteriesByStation(stationId);
    } else {
      // Option 1: Lấy tất cả rồi filter (tối ưu hơn nếu có nhiều trạm)
      const allBatteries = await fetchAllPublicBatteries();
      batteries = allBatteries.filter((b) => b.stationId === stationId);
    }

    // Filter theo status nếu có
    // Chỉ lấy pin sẵn sàng: status = "Full" và không bị reserved
    if (options?.status) {
      batteries = batteries.filter((b) => {
        const statusMatch = String(b.status).trim().toLowerCase() === String(options.status).trim().toLowerCase();
        
        // Nếu filter là "Full", chỉ lấy pin không bị reserved
        if (String(options.status).trim().toLowerCase() === "full") {
          return statusMatch && !b.isReserved;
        }
        
        return statusMatch;
      });
    } else {
      // Mặc định chỉ lấy pin sẵn sàng (Full và không reserved)
      batteries = batteries.filter((b) => {
        const batteryStatus = String(b.status).trim().toLowerCase();
        return batteryStatus === "full" && !b.isReserved;
      });
    }

    return batteries.length;
  } catch (error) {
    console.error(`Error counting batteries for station ${stationId}:`, error);
    return 0; // Return 0 nếu có lỗi
  }
}

/**
 * Lấy số lượng pin cho nhiều trạm cùng lúc (tối ưu - chỉ gọi API 1 lần)
 * Trả về Map<stationId, count>
 */
export async function countBatteriesForMultipleStations(
  stationIds: string[],
  options?: {
    status?: string; // Filter theo status
  }
): Promise<Map<string, number>> {
  try {
    // Gọi API 1 lần để lấy tất cả batteries
    const allBatteries = await fetchAllPublicBatteries();

    // Filter theo status nếu có
    // Chỉ lấy pin sẵn sàng: status = "Full" và không bị reserved
    let filteredBatteries = allBatteries;
    if (options?.status) {
      filteredBatteries = allBatteries.filter((b) => {
        const batteryStatus = String(b.status).trim();
        const filterStatus = String(options.status).trim();
        
        // So sánh status (case-insensitive)
        const statusMatch = batteryStatus.toLowerCase() === filterStatus.toLowerCase();
        
        // Nếu filter là "Full", chỉ lấy pin có status = "Full" và không bị reserved
        if (filterStatus.toLowerCase() === "full") {
          return statusMatch && !b.isReserved;
        }
        
        // Các status khác: chỉ so sánh status
        return statusMatch;
      });
    } else {
      // Nếu không có filter status, mặc định chỉ lấy pin sẵn sàng (Full và không reserved)
      filteredBatteries = allBatteries.filter((b) => {
        const batteryStatus = String(b.status).trim().toLowerCase();
        return batteryStatus === "full" && !b.isReserved;
      });
    }

    // Đếm theo từng stationId
    const countMap = new Map<string, number>();
    
    // Khởi tạo tất cả stations với count = 0
    stationIds.forEach((id) => countMap.set(id, 0));

    // Đếm batteries
    filteredBatteries.forEach((battery) => {
      if (battery.stationId && stationIds.includes(battery.stationId)) {
        const currentCount = countMap.get(battery.stationId) || 0;
        countMap.set(battery.stationId, currentCount + 1);
      }
    });

    return countMap;
  } catch (error) {
    console.error("Error counting batteries for multiple stations:", error);
    // Trả về Map với tất cả stations = 0 nếu có lỗi
    const emptyMap = new Map<string, number>();
    stationIds.forEach((id) => emptyMap.set(id, 0));
    return emptyMap;
  }
}

