export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function parseVND(value: string): number {
  const cleaned = value.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export const GROUP_TYPES = [
  { value: "family", label: "Gia đình", emoji: "👨‍👩‍👧‍👦" },
  { value: "couple", label: "Cặp đôi", emoji: "💑" },
  { value: "friends", label: "Bạn bè", emoji: "👫" },
  { value: "other", label: "Khác", emoji: "👥" },
];

export const GROUP_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

export function getGroupTypeLabel(type: string) {
  return GROUP_TYPES.find((t) => t.value === type) ?? GROUP_TYPES[3];
}
