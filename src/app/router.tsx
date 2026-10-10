import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const OperationsPage = lazy(async () => {
  const module = await import("../pages/OperationsPage");
  return { default: module.OperationsPage };
});
const AlertsPage = lazy(async () => {
  const module = await import("../pages/AlertsPage");
  return { default: module.AlertsPage };
});
const IncidentsPage = lazy(async () => {
  const module = await import("../pages/IncidentsPage");
  return { default: module.IncidentsPage };
});
const IncidentPage = lazy(async () => {
  const module = await import("../pages/IncidentPage");
  return { default: module.IncidentPage };
});
const ReplayPage = lazy(async () => {
  const module = await import("../pages/ReplayPage");
  return { default: module.ReplayPage };
});
const PerformancePage = lazy(async () => {
  const module = await import("../pages/PerformancePage");
  return { default: module.PerformancePage };
});
const NotFoundPage = lazy(async () => {
  const module = await import("../pages/NotFoundPage");
  return { default: module.NotFoundPage };
});

export function AppRouter() {
  return (
    <Suspense fallback={<p className="route-loading" role="status">Cargando sección…</p>}>
      <Routes>
        <Route path="/" element={<Navigate replace to="/operacion" />} />
        <Route path="/operacion" element={<OperationsPage />} />
        <Route path="/alertas" element={<AlertsPage />} />
        <Route path="/incidentes" element={<IncidentsPage />} />
        <Route path="/incidentes/:eventId" element={<IncidentPage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route path="/rendimiento" element={<PerformancePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
