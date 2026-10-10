export function formatSyntheticTimestamp(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/u.exec(value);
  if (match === null) return value;
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year}, ${hour}:${minute}`;
}

export function formatRiskScore(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Sin medición";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  if (seconds < 3_600) return `${new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 1,
  }).format(seconds / 60)} min`;
  return `${new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 1,
  }).format(seconds / 3_600)} h`;
}

export function formatIdentifier(value: string): string {
  return value.replaceAll("_", " ");
}

const incidentNames: Record<string, string> = {
  application_errors: "Incremento anormal de errores",
  checkout_degradation: "Degradación del checkout",
  cpu_saturation: "Saturación de CPU",
  database_connection_pressure: "Presión en conexiones",
  latency_degradation: "Degradación de latencia",
};

export function formatIncidentType(value: string | null): string {
  if (value === null) return "Riesgo sin clasificar";
  return incidentNames[value] ?? formatIdentifier(value);
}
