/**
 * Utility functions for formatting date and time with Vietnam timezone (GMT+7)
 * to fix the 7-hour timezone offset issue
 */

/**
 * Normalize datetime string to ensure it's treated as UTC
 * Backend returns datetime without timezone indicator, so we need to add 'Z'
 * @param isoString - Datetime string from backend
 * @returns Normalized UTC datetime string
 */
const normalizeToUTC = (isoString: string): string => {
  // If already has timezone info (Z, +00:00, etc.), return as is
  if (isoString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(isoString)) {
    return isoString;
  }
  // Add 'Z' to indicate UTC timezone
  return isoString + 'Z';
};

/**
 * Format ISO datetime string to Vietnamese date format (DD/MM/YYYY)
 * @param isoString - ISO 8601 datetime string from backend
 * @returns Formatted date string in vi-VN locale
 */
export const formatDate = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const normalizedString = normalizeToUTC(isoString);
    const date = new Date(normalizedString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh", // Vietnam timezone (GMT+7)
    }).format(date);
  } catch {
    return "Invalid Date";
  }
};

/**
 * Format ISO datetime string to Vietnamese time format (HH:mm:ss)
 * @param isoString - ISO 8601 datetime string from backend
 * @returns Formatted time string in vi-VN locale
 */
export const formatTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const normalizedString = normalizeToUTC(isoString);
    const date = new Date(normalizedString);
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh", // Vietnam timezone (GMT+7)
    }).format(date);
  } catch {
    return "Invalid Time";
  }
};

/**
 * Format Date object to Vietnamese time format (HH:mm)
 * Useful for formatting Date objects directly (e.g., from slot times)
 * @param date - Date object
 * @returns Formatted time string in vi-VN locale
 */
export const formatTimeFromDate = (date: Date | null | undefined): string => {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh", // Vietnam timezone (GMT+7)
    }).format(date);
  } catch {
    return "—";
  }
};

/**
 * Format Date object to Vietnamese date format (DD/MM/YYYY)
 * Useful for formatting Date objects directly (e.g., from calendar picker)
 * @param date - Date object
 * @returns Formatted date string in vi-VN locale
 */
export const formatDateFromDate = (date: Date | null | undefined): string => {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh", // Vietnam timezone (GMT+7)
    }).format(date);
  } catch {
    return "—";
  }
};

/**
 * Format ISO datetime string to Vietnamese datetime format (DD/MM/YYYY HH:mm:ss)
 * @param isoString - ISO 8601 datetime string from backend
 * @returns Formatted datetime string in vi-VN locale
 */
export const formatDateTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const normalizedString = normalizeToUTC(isoString);
    const date = new Date(normalizedString);
    const datePart = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
    const timePart = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
    return `${datePart} ${timePart}`;
  } catch {
    return "Invalid Date";
  }
};

/**
 * Format ISO datetime string to short Vietnamese datetime format (DD/MM/YYYY HH:mm)
 * @param isoString - ISO 8601 datetime string from backend
 * @returns Formatted short datetime string in vi-VN locale
 */
export const formatDateTimeShort = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const normalizedString = normalizeToUTC(isoString);
    const date = new Date(normalizedString);
    const datePart = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
    const timePart = new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
    return `${datePart} ${timePart}`;
  } catch {
    return "Invalid Date";
  }
};

/**
 * Format ISO datetime string to relative time (e.g., "2 giờ trước", "5 phút trước")
 * @param isoString - ISO 8601 datetime string from backend
 * @returns Relative time string
 */
export const formatRelativeTime = (isoString: string | null | undefined): string => {
  if (!isoString) return "N/A";
  try {
    const normalizedString = normalizeToUTC(isoString);
    const date = new Date(normalizedString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return formatDate(isoString);
  } catch {
    return "Invalid Date";
  }
};

/**
 * Format currency to Vietnamese format (e.g., 1.000.000 ₫)
 * @param amount - Amount in VND
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount == null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Format number to Vietnamese format (e.g., 1.000.000)
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return "0";
  return num.toLocaleString("vi-VN");
};

