import { useQuery } from "@tanstack/react-query";
import { BellRing, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import { queryKeys } from "../../application/queries/keys";
import { useKaikuChallengeDataSource } from "../../app/useKaikuChallengeDataSource";

export function WorkspaceOperationalStatus() {
  const source = useKaikuChallengeDataSource();
  const operations = useQuery({
    queryKey: queryKeys.challengeHeaderOperations,
    queryFn: ({ signal }) => source.getChallengeOperations(signal),
    refetchInterval: 3_000,
  });

  return (
    <div aria-label="Fuente de operación" className="workspace-source-status">
      <FlaskConical aria-hidden="true" size={15} />
      <div>
        <span>Entorno</span>
        <strong>Datos de prueba</strong>
      </div>
      {operations.data === undefined ? null : (
        <Link
          aria-label={`${operations.data.alertCounts.open} hallazgos sin revisar. Ir a Alertas`}
          className="workspace-alert-shortcut"
          to="/alertas"
        >
          <BellRing aria-hidden="true" size={17} />
          <span>{operations.data.alertCounts.open}</span>
          <small>sin revisar</small>
        </Link>
      )}
    </div>
  );
}
