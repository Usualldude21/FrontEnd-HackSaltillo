export function formatConfidence(value: number | null): string {
  return value === null ? "No disponible" : new Intl.NumberFormat("es-MX", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTimestamp(value: string | null): string {
  if (value === null) return "Sin muestra";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatMetric(value: number | null, unit: string): string {
  if (value === null) return "Sin dato";
  return `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(value)}${unit}`;
}

export function formatIncidentSeverity(value: string): string {
  const labels: Record<string, string> = {
    critical: "Crítica",
    warning: "Advertencia",
    high: "Alta",
    watch: "Observación",
  };
  return labels[value.toLowerCase()] ?? value;
}

export function formatIncidentStatus(value: string): string {
  const labels: Record<string, string> = {
    active: "Activo",
    open: "Abierto",
    recovered: "Recuperado",
    resolved: "Resuelto",
  };
  return labels[value.toLowerCase()] ?? value;
}
