import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../application/queries/keys";
import { ApiError } from "../../infrastructure/api/errors";
import { useDataSource } from "../../app/useDataSource";
import { ConnectionBadge } from "../../shared/ui/ConnectionBadge";

export function ConnectionStatus() {
  const source = useDataSource();
  const status = useQuery({
    queryKey: queryKeys.backendStatus,
    queryFn: ({ signal }) => source.getBackendStatus(signal),
  });

  if (status.isPending) return <ConnectionBadge prefix="REST" state="connecting" />;
  if (status.error instanceof ApiError && status.error.code === "incompatible_contract") {
    return <ConnectionBadge prefix="REST" state="incompatible" />;
  }
  if (status.isError) return <ConnectionBadge prefix="REST" state="offline" />;

  const updatedAt = new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(status.dataUpdatedAt);

  return (
    <>
      <ConnectionBadge
        label={status.data.ready ? "Disponible" : "Degradado"}
        prefix="REST"
        state={status.data.ready ? "live" : "reconnecting"}
      />
      <span className="last-updated">Actualizado {updatedAt}</span>
    </>
  );
}
