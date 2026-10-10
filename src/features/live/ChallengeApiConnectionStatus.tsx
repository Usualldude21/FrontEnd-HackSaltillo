import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../application/queries/keys";
import { useKaikuChallengeDataSource } from "../../app/useKaikuChallengeDataSource";
import { ApiError } from "../../infrastructure/api/errors";
import { ConnectionBadge } from "../../shared/ui/ConnectionBadge";

/** Reports compatibility of the definitive Kaiku API, not generic backend health. */
export function ChallengeApiConnectionStatus() {
  const source = useKaikuChallengeDataSource();
  const contract = useQuery({
    queryKey: queryKeys.challengeContract,
    queryFn: ({ signal }) => source.getContract(signal),
  });

  if (contract.isPending) return <ConnectionBadge prefix="API Kaiku" state="connecting" />;
  if (contract.error instanceof ApiError && contract.error.code === "incompatible_contract") {
    return <ConnectionBadge prefix="API Kaiku" state="incompatible" />;
  }
  if (contract.isError) return <ConnectionBadge prefix="API Kaiku" state="offline" />;

  const updatedAt = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(contract.dataUpdatedAt);

  return (
    <>
      <ConnectionBadge label="Contrato válido" prefix="API Kaiku" state="live" />
      <span className="last-updated">Validado {updatedAt}</span>
    </>
  );
}
