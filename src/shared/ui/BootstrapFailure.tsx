import { AlertTriangle } from "lucide-react";

/** Last-resort state for failures that happen before providers or routing exist. */
export function BootstrapFailure() {
  return (
    <main className="global-error" id="main-content">
      <div className="error-state" role="alert">
        <AlertTriangle aria-hidden="true" className="state-icon" size={24} />
        <h1>Sentinel no pudo iniciar</h1>
        <p>
          Revisa la configuración pública y la disponibilidad del contrato Kaiku.
          No se enviaron acciones ni se modificaron datos.
        </p>
        <div className="state-action">
          <button className="button button-primary" onClick={() => window.location.reload()} type="button">
            Reintentar arranque
          </button>
        </div>
      </div>
    </main>
  );
}
