import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { KaikuChallengeAlert } from "../../domain/kaikuChallenge";
import {
  formatDuration,
  formatIdentifier,
  formatRiskScore,
  formatSyntheticTimestamp,
} from "../../shared/format/challenge";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";
import { ChallengePriorityBadge, ChallengeStateBadge } from "../alerts/ChallengeAlertBadges";

export function ChallengeRiskCaseList({ cases }: { cases: readonly KaikuChallengeAlert[] }) {
  return (
    <div className="incident-list">
      {cases.map((riskCase) => (
        <article className="panel incident-list-item challenge-case-list-item" key={riskCase.eventId}>
          <div>
            <div className="incident-list-title">
              <strong>{formatIdentifier(riskCase.suspectedIncidentType ?? "riesgo sin clasificar")}</strong>
              <ChallengePriorityBadge priority={riskCase.priority} />
              <ChallengeStateBadge state={riskCase.state} />
            </div>
            <p>Evento {riskCase.eventId} · corrida {riskCase.runId} · predicción {riskCase.predictionId}</p>
            <dl>
              <div><dt>Primera señal</dt><dd>{formatSyntheticTimestamp(riskCase.signalAt.value)}</dd></div>
              <div><dt>Detección</dt><dd>{formatSyntheticTimestamp(riskCase.detectedAt.value)}</dd></div>
              <div><dt>Señal → detección</dt><dd>{formatDuration(riskCase.signalToDetectionSeconds)}</dd></div>
              <div><dt>Score de riesgo</dt><dd>{formatRiskScore(riskCase.risk.value)}</dd></div>
              <div><dt>Telemetría</dt><dd><DataQualityBadge quality={riskCase.dataQuality} /></dd></div>
            </dl>
          </div>
          <Link className="button button-secondary" to={`/incidentes/${riskCase.eventId}`}>
            Ver evidencia <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </article>
      ))}
    </div>
  );
}
