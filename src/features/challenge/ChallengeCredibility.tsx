import { CircleAlert, FlaskConical, ShieldCheck } from "lucide-react";
import type { ChallengeContract, ChallengeShowcase } from "../../domain/kaikuChallenge";

interface ChallengeCredibilityProps {
  contract: ChallengeContract;
  showcase: ChallengeShowcase;
}

export function ChallengeCredibility({ contract, showcase }: ChallengeCredibilityProps) {
  const control = showcase.falseAlarmControl;

  return (
    <section aria-labelledby="credibility-title" className="panel challenge-credibility">
      <div className="panel-heading challenge-panel-heading">
        <div>
          <p className="eyebrow">Control de credibilidad</p>
          <h3 id="credibility-title">Alertar temprano sin alertar por todo</h3>
        </div>
        <span className="badge badge-warning">
          <FlaskConical aria-hidden="true" size={15} /> Datos sintéticos oficiales
        </span>
      </div>

      <div className="challenge-credibility-grid">
        <article>
          <ShieldCheck aria-hidden="true" size={22} />
          <strong>{control.knownEventAlertsWithContext}</strong>
          <span>alertas sobre eventos conocidos usando contexto</span>
        </article>
        <article>
          <CircleAlert aria-hidden="true" size={22} />
          <strong>{control.knownEventAlertsWithoutContext}</strong>
          <span>alertas sobre esos eventos al retirar el contexto</span>
        </article>
      </div>
      <p>{control.interpretation}</p>
      <ul className="challenge-boundaries">
        <li>El score expresa riesgo; no una probabilidad calibrada.</li>
        <li>No se usó ground truth oficial para afirmar que el caso representativo sea un incidente real.</li>
        <li>No se observó impacto real en clientes, infraestructura remota, mitigación ni recuperación.</li>
        <li>Gemini no es necesario para el camino crítico; el contrato es {contract.version}.</li>
      </ul>
    </section>
  );
}
