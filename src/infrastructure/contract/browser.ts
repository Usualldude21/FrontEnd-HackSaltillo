import { setupWorker } from "msw/browser";
import { createContractHandlers } from "./handlers";

let started = false;

export async function enableContractMode(): Promise<void> {
  if (started) return;
  const worker = setupWorker(...createContractHandlers());
  await worker.start({ onUnhandledRequest: "error", quiet: true });
  started = true;
}
