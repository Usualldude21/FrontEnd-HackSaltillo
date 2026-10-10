import { useState } from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  History,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import type { PublicConfig } from "./config";
import { AppRouter } from "./router";
import { ChallengeLiveConnectionStatus } from "../features/live/ChallengeLiveConnectionStatus";
import { WorkspaceOperationalStatus } from "../features/live/WorkspaceOperationalStatus";
import { RouteStatus } from "../features/navigation/RouteStatus";
import { LandingPage } from "../pages/LandingPage";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";

interface AppProps {
  config: PublicConfig;
}

const accessSessionKey = "zikit-sentinel.access.v1";

const navigation = [
  { to: "/operacion", label: "Operación", icon: Activity },
  { to: "/alertas", label: "Alertas", icon: BellRing },
  { to: "/incidentes", label: "Casos", icon: ShieldAlert },
  { to: "/rendimiento", label: "Rendimiento", icon: BarChart3 },
  { to: "/replay", label: "Laboratorio", icon: History },
] as const;

const routeTitles: Record<string, string> = {
  "/operacion": "Centro operativo",
  "/alertas": "Alertas",
  "/incidentes": "Casos",
  "/rendimiento": "Rendimiento",
  "/replay": "Laboratorio",
};

export function App({ config }: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(readAccessSession);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  ));

  if (!isAuthenticated) {
    return (
      <LandingPage onUnlock={() => {
        writeAccessSession();
        setIsAuthenticated(true);
        void navigate(location.pathname === "/" ? "/operacion" : location.pathname, { replace: true });
      }} />
    );
  }

  const basePath = location.pathname.startsWith("/incidentes/") ? "/incidentes" : location.pathname;
  const currentTitle = routeTitles[basePath] ?? "Centro operativo";

  const closeMobileSidebar = () => {
    if (window.matchMedia("(max-width: 760px)").matches) setIsSidebarCollapsed(true);
  };

  return (
    <div className={isSidebarCollapsed ? "dashboard-shell sidebar-collapsed" : "dashboard-shell"}>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <aside className="operational-sidebar">
        <div className="sidebar-brand">
          <div>
            <strong>Sentinel</strong>
            <span>Operations</span>
          </div>
          <button
            aria-label="Cerrar menú"
            className="sidebar-mobile-close"
            onClick={() => setIsSidebarCollapsed(true)}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="sidebar-navigation">
          {navigation.map(({ icon: Icon, label, to }) => (
            <NavLink key={to} onClick={closeMobileSidebar} title={isSidebarCollapsed ? label : undefined} to={to}>
              <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-monitoring">
            <span aria-hidden="true" />
            <div><strong>Monitoreo</strong><small>Actualización continua</small></div>
          </div>
          <button
            className="sidebar-signout"
            onClick={() => {
              clearAccessSession();
              setIsAuthenticated(false);
              void navigate("/", { replace: true });
            }}
            title={isSidebarCollapsed ? "Salir" : undefined}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} />
            <span>Salir</span>
          </button>
          <button
            aria-label={isSidebarCollapsed ? "Expandir menú" : "Contraer menú"}
            className="sidebar-collapse"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            type="button"
          >
            {isSidebarCollapsed
              ? <PanelLeftOpen aria-hidden="true" size={18} />
              : <PanelLeftClose aria-hidden="true" size={18} />}
            <span>{isSidebarCollapsed ? "Expandir" : "Contraer"}</span>
          </button>
        </div>
      </aside>

      {!isSidebarCollapsed ? (
        <button aria-label="Cerrar menú" className="sidebar-backdrop" onClick={() => setIsSidebarCollapsed(true)} type="button" />
      ) : null}

      <div className="dashboard-workspace">
        <header className="workspace-header">
          <div className="workspace-heading">
            <button
              aria-label="Abrir navegación"
              className="workspace-menu-button"
              onClick={() => setIsSidebarCollapsed(false)}
              type="button"
            >
              <Menu aria-hidden="true" size={21} />
            </button>
            <div>
              <span>Kaiku</span>
              <strong>{currentTitle}</strong>
            </div>
          </div>
          <div className="workspace-live-status">
            <WorkspaceOperationalStatus />
            <ChallengeLiveConnectionStatus apiBaseUrl={config.apiBaseUrl} compact />
          </div>
        </header>
        <RouteStatus />
        <main id="main-content" tabIndex={-1}>
          <ErrorBoundary><AppRouter /></ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function readAccessSession(): boolean {
  try {
    return window.sessionStorage.getItem(accessSessionKey) === "granted";
  } catch {
    return false;
  }
}

function writeAccessSession(): void {
  try {
    window.sessionStorage.setItem(accessSessionKey, "granted");
  } catch {
    // El flujo puede continuar aunque el navegador bloquee sessionStorage.
  }
}

function clearAccessSession(): void {
  try {
    window.sessionStorage.removeItem(accessSessionKey);
  } catch {
    // No hay estado persistente que limpiar si sessionStorage no está disponible.
  }
}
