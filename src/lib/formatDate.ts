export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatPickActivity(createdAt: string, updatedAt: string): {
  label: "Thêm" | "Sửa";
  timestamp: string;
  edited: boolean;
} {
  const edited = updatedAt !== createdAt;
  return {
    label: edited ? "Sửa" : "Thêm",
    timestamp: formatTimestamp(edited ? updatedAt : createdAt),
    edited,
  };
}

/**
 * Format remaining time until `deadlineIso`. Returns "Hết hạn" once it passes.
 * Granularity adapts: shows days+hours if >1d, hours+minutes if >1h, else m+s.
 */
export function formatCountdown(deadlineIso: string, now: number = Date.now()): {
  text: string;
  expired: boolean;
  msLeft: number;
} {
  const target = new Date(deadlineIso).getTime();
  const msLeft = target - now;
  if (msLeft <= 0) return { text: "Hết hạn", expired: true, msLeft: 0 };

  const totalSec = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  let text: string;
  if (days > 0) text = `${days}d ${hours}h ${minutes}m`;
  else if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`;
  else text = `${minutes}m ${seconds}s`;
  return { text, expired: false, msLeft };
}
