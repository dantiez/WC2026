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
