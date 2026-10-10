import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { runChallengeLiveUpdates } from "../../application/challengeLiveUpdates";
import { queryKeys } from "../../application/queries/keys";
import { useKaikuChallengeDataSource } from "../../app/useKaikuChallengeDataSource";
import type { ConnectionState } from "../../domain/backend";
import { createKaikuChallengeStreamSource } from "../../infrastructure/api/challengeStreamClient";
import { ApiError } from "../../infrastructure/api/errors";
import { ConnectionBadge } from "../../shared/ui/ConnectionBadge";

const cursorStorageKey = "zikit-sentinel.kaiku-stream-cursor.v1";

interface ChallengeLiveConnectionStatusProps {
  apiBaseUrl: string;
  compact?: boolean;
}

export function ChallengeLiveConnectionStatus({ apiBaseUrl, compact = false }: ChallengeLiveConnectionStatusProps) {
  const dataSource = useKaikuChallengeDataSource();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ConnectionState>("connecting");
  const streamSource = useMemo(
    () => createKaikuChallengeStreamSource({ baseUrl: apiBaseUrl }),
    [apiBaseUrl],
  );
  const contract = useQuery({
    queryKey: queryKeys.challengeContract,
    queryFn: ({ signal }) => dataSource.getContract(signal),
  });

  useEffect(() => {
    if (contract.data === undefined) return;
    const controller = new AbortController();

    const invalidateChallengeViews = () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["challenge-alerts"] }),
      queryClient.invalidateQueries({ queryKey: ["challenge-overview"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.challengeHeaderOperations }),
      queryClient.invalidateQueries({ queryKey: ["challenge-explanation"] }),
      queryClient.invalidateQueries({ queryKey: ["challenge-incident-cases"] }),
      queryClient.invalidateQueries({ queryKey: ["challenge-incident-case"] }),
    ]);

    void runChallengeLiveUpdates(streamSource, {
      onState: setState,
      onUpdates() {
        void invalidateChallengeViews();
      },
      onCursor: storeCursor,
      onReconcile() {
        void invalidateChallengeViews();
      },
    }, controller.signal, { initialCursor: readCursor() }).catch(() => {
      if (!controller.signal.aborted) setState("offline");
    });

    return () => controller.abort();
  }, [contract.data, queryClient, streamSource]);

  const incompatible = contract.error instanceof ApiError
    && contract.error.code === "incompatible_contract";
  const visibleState: ConnectionState = contract.isPending
    ? "connecting"
    : contract.isError
      ? incompatible ? "incompatible" : "offline"
      : state;

  if (compact) {
    const compactLabel: Record<ConnectionState, string> = {
      connecting: "Conectando stream",
      live: "Stream conectado",
      reconnecting: "Reconectando stream",
      offline: "Stream desconectado",
      incompatible: "Contrato incompatible",
    };
    return (
      <span className={`header-stream-state header-stream-${visibleState}`} role="status">
        <i aria-hidden="true" />
        {compactLabel[visibleState]}
      </span>
    );
  }

  return <ConnectionBadge prefix="Kaiku SSE" state={visibleState} />;
}

function readCursor(): number | null {
  try {
    const value = window.sessionStorage.getItem(cursorStorageKey);
    if (value === null) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

function storeCursor(cursor: number): void {
  try {
    window.sessionStorage.setItem(cursorStorageKey, String(cursor));
  } catch {
    // El cursor sigue vivo en el proceso aunque sessionStorage esté bloqueado.
  }
}
