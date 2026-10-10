import { KeyRound, Trash2 } from "lucide-react";
import { Button } from "../../shared/ui/Button";

interface AdminTokenControlProps {
  token: string;
  onChange: (token: string) => void;
  placeholder?: string;
}

export function AdminTokenControl({ onChange, placeholder = "Necesario para reconocer", token }: AdminTokenControlProps) {
  const authorized = token.trim().length > 0;

  return (
    <section aria-labelledby="authorization-title" className="panel alert-auth-panel">
      <div className="alert-auth-copy">
        <KeyRound aria-hidden="true" size={20} />
        <div>
          <p className="eyebrow">Acción administrativa</p>
          <h3 id="authorization-title">Autorización de esta sesión</h3>
          <p>El token se conserva únicamente en memoria y sessionStorage hasta cerrar la sesión local.</p>
        </div>
      </div>
      <div className="token-control">
        <label htmlFor="admin-token">Token administrativo</label>
        <div>
          <input
            autoComplete="off"
            id="admin-token"
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            type="password"
            value={token}
          />
          <Button
            aria-label="Borrar token de esta sesión"
            disabled={!authorized}
            onClick={() => onChange("")}
            variant="ghost"
          >
            <Trash2 aria-hidden="true" size={16} />
            Borrar
          </Button>
        </div>
        <span className={authorized ? "token-status token-status-ready" : "token-status"}>
          {authorized ? "Autorización disponible" : "Sin autorización"}
        </span>
      </div>
    </section>
  );
}
