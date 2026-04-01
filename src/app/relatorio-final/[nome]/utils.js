export function formatarData(data) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export const CORES = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#be185d",
  "#4f46e5",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0d9488",
  "#e11d48",
  "#6366f1",
];
