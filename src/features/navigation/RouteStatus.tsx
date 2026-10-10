import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/operacion": "Operación",
  "/alertas": "Alertas",
  "/incidentes": "Casos de riesgo",
  "/replay": "Replay",
  "/rendimiento": "Rendimiento",
};

export function RouteStatus() {
  const location = useLocation();
  const basePath = location.pathname.startsWith("/incidentes/")
    ? "/incidentes"
    : location.pathname;
  const title = routeTitles[basePath] ?? "Página no encontrada";

  useEffect(() => {
    document.title = `${title} | Sentinel`;
  }, [title]);

  return <p aria-live="polite" className="sr-only" role="status">Sección: {title}</p>;
}
