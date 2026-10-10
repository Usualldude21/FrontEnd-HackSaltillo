import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConnectionState } from "../../domain/backend";
import type { TimelineEvent } from "../../domain/event";
import { runLiveUpdates } from "../../application/liveUpdates";
import { queryKeys } from "../../application/queries/keys";
import { relatedQueryKeys } from "../../application/selectors/events";
import { useDataSource } from "../../app/useDataSource";
import { createEventStreamSource } from "../../infrastructure/api/eventStreamClient";
import { ConnectionBadge } from "../../shared/ui/ConnectionBadge";

interface LiveConnectionStatusProps {
  apiBaseUrl: string;
}

export function LiveConnectionStatus({ apiBaseUrl }: LiveConnectionStatusProps) {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ConnectionState>("connecting");
  const streamSource = useMemo(() => createEventStreamSource({ baseUrl: apiBaseUrl }), [apiBaseUrl]);
  const capabilities = useQuery({
    queryKey: queryKeys.capabilities,
    queryFn: ({ signal }) => dataSource.getCapabilities(signal),
  });

  useEffect(() => {
    if (capabilities.isPending || capabilities.isError || capabilities.data.eventStream === false) return;

    const controller = new AbortController();
    const invalidate = async (events: readonly TimelineEvent[]) => {
      const keys = new Map<string, ReturnType<typeof relatedQueryKeys>[number]>();
      for (const event of events) {
        for (const key of relatedQueryKeys(event)) keys.set(JSON.stringify(key), key);
      }
      await Promise.all([...keys.values()].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })));
    };

    void runLiveUpdates(streamSource, {
      onState: setState,
      onEvents(events) {
        void invalidate(events);
      },
    }, controller.signal).catch(() => {
      if (!controller.signal.aborted) setState("offline");
    });

    return () => controller.abort();
  }, [capabilities.data, capabilities.isError, capabilities.isPending, queryClient, streamSource]);

  const visibleState = capabilities.isError || capabilities.data?.eventStream === false
    ? "offline"
    : capabilities.isPending
      ? "connecting"
      : state;

  return <ConnectionBadge prefix="SSE" state={visibleState} />;
}
