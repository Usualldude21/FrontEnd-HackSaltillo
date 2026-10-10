import { Badge } from "../../shared/ui/Badge";

interface PredictorUnavailableProps {
  operationalLabAvailable: boolean;
}

export function PredictorUnavailable({ operationalLabAvailable }: PredictorUnavailableProps) {
  return (
    <section aria-labelledby="lab-title" className="panel operation-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Backend operativo</p>
          <h3 id="lab-title">Laboratorio operativo</h3>
        </div>
        <Badge tone={operationalLabAvailable ? "success" : "neutral"}>
          {operationalLabAvailable ? "Disponible" : "No disponible"}
        </Badge>
      </div>
      <div className="predictor-unavailable">
        <Badge tone="warning">Predictor de Kaiku no disponible</Badge>
        <p>El predictor del kit todavía no está expuesto por este backend.</p>
        <p>No se convertirán servicios genéricos del laboratorio en datos de Kaiku.</p>
      </div>
    </section>
  );
}
