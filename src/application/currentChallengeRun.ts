const currentRunStorageKey = "sentinel.current-challenge-run.v1";
const validRunId = /^corrida_\d{2}$/u;

export function readCurrentChallengeRun(): string | null {
  try {
    const runId = window.sessionStorage.getItem(currentRunStorageKey);
    return runId !== null && validRunId.test(runId) ? runId : null;
  } catch {
    return null;
  }
}

export function storeCurrentChallengeRun(runId: string): void {
  if (!validRunId.test(runId)) return;
  try {
    window.sessionStorage.setItem(currentRunStorageKey, runId);
  } catch {
    // La navegación todavía puede usar la corrida más reciente devuelta por el backend.
  }
}
