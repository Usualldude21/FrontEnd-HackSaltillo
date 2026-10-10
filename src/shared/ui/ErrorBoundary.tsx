import { Component, type PropsWithChildren, type ReactNode } from "react";
import { ErrorState } from "./ErrorState";

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(): void {
    // Punto futuro para telemetría segura. No se registran respuestas ni secretos.
  }

  private readonly reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="global-error">
          <ErrorState
            message="La interfaz encontró un error inesperado. No se cambiaron ni ocultaron los datos recibidos."
            onRetry={this.reload}
            retryLabel="Recargar aplicación"
            title="Sentinel no pudo continuar"
          />
        </div>
      );
    }
    return this.props.children;
  }
}
