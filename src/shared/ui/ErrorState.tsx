import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Intentar de nuevo",
  title = "No fue posible cargar esta sección",
}: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <AlertTriangle aria-hidden="true" className="state-icon" size={24} />
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry === undefined ? null : (
        <div className="state-action"><Button onClick={onRetry}>{retryLabel}</Button></div>
      )}
    </div>
  );
}
