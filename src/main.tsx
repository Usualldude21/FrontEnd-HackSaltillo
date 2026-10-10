import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { readPublicConfig } from "./app/config";
import { AppProviders } from "./app/providers";
import { createKaikuChallengeDataSource } from "./infrastructure/api/kaikuChallengeDataSource";
import { BootstrapFailure } from "./shared/ui/BootstrapFailure";
import "./shared/styles/global.css";

async function bootstrap(): Promise<void> {
  const config = readPublicConfig();

  if (config.dataSource === "contract") {
    const { enableContractMode } = await import("./infrastructure/contract/browser");
    await enableContractMode();
  }

  const challengeDataSource = createKaikuChallengeDataSource({ baseUrl: config.apiBaseUrl });

  const rootElement = document.getElementById("root");
  if (rootElement === null) throw new Error("No se encontró el nodo raíz de la aplicación.");

  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <AppProviders challengeDataSource={challengeDataSource}>
          <App config={config} />
        </AppProviders>
      </BrowserRouter>
    </StrictMode>,
  );
}

function renderBootstrapFailure(): void {
  const rootElement = document.getElementById("root");
  if (rootElement === null) return;
  createRoot(rootElement).render(<BootstrapFailure />);
}

void bootstrap().catch(renderBootstrapFailure);
