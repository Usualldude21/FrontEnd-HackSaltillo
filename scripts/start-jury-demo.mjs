import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)));
const backendCandidates = process.env.SENTINEL_BACKEND_DIR === undefined
  ? ["../zikit-2026", "../hacktoon-saltillo"].map((path) => resolve(frontendDirectory, path))
  : [resolve(process.env.SENTINEL_BACKEND_DIR)];
let backendDirectory = backendCandidates[0];
for (const candidate of backendCandidates) {
  try {
    await access(resolve(candidate, "pyproject.toml"));
    await access(resolve(candidate, ".venv/bin/python"));
    backendDirectory = candidate;
    break;
  } catch {
    // Continúa con el siguiente checkout compatible.
  }
}
const backendPython = resolve(backendDirectory, ".venv/bin/python");
const databasePath = resolve(tmpdir(), `sentinel-jurado-${Date.now()}.db`);
const backendPort = Number(process.env.SENTINEL_BACKEND_PORT ?? 8000);
const frontendPort = Number(process.env.SENTINEL_FRONTEND_PORT ?? 5173);
if (!Number.isSafeInteger(backendPort) || backendPort < 1 || backendPort > 65_535) {
  throw new Error("SENTINEL_BACKEND_PORT debe ser un puerto válido.");
}
if (!Number.isSafeInteger(frontendPort) || frontendPort < 1 || frontendPort > 65_535) {
  throw new Error("SENTINEL_FRONTEND_PORT debe ser un puerto válido.");
}
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

await access(backendPython).catch(() => {
  throw new Error(`No se encontró el entorno Python del backend en ${backendPython}`);
});

const children = [];
let stopping = false;

async function assertPortAvailable(port, label) {
  await new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.unref();
    server.once("error", (error) => {
      rejectPort(
        new Error(
          `${label} no puede iniciar: el puerto ${port} ya está ocupado. ` +
            "Cierra los procesos residuales y vuelve a ejecutar la demo.",
          { cause: error },
        ),
      );
    });
    server.listen({ host: "127.0.0.1", port }, () => {
      server.close((error) => {
        if (error) rejectPort(error);
        else resolvePort();
      });
    });
  });
}

function start(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: "inherit" });
  children.push(child);
  child.once("exit", (code, signal) => {
    if (stopping) return;
    console.error(`\nLa demo se detuvo: ${command} terminó (${signal ?? code ?? "sin estado"}).`);
    stop(code ?? 1);
  });
  return child;
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGKILL");
    }
    process.exit(exitCode);
  }, 2_000).unref();
}

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));

try {
  await assertPortAvailable(backendPort, "El backend");
  await assertPortAvailable(frontendPort, "El frontend");
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

start(backendPython, [
  "-m",
  "uvicorn",
  "app.main:app",
  "--host",
  "127.0.0.1",
  "--port",
  String(backendPort),
], {
  cwd: backendDirectory,
  env: {
    ...process.env,
    DATABASE_URL: `sqlite:///${databasePath}`,
    MONITOR_ENABLED: "false",
    RESOURCE_MONITOR_ENABLED: "false",
    TRAFFIC_ENABLED: "false",
    MCP_EXECUTION_URL: `${backendUrl}/mcp-execution/`,
  },
});

const deadline = Date.now() + 20_000;
let geminiConfigured = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(`${backendUrl}/api/challenge/contract`);
    if (response.ok) {
      const remediationResponse = await fetch(`${backendUrl}/api/challenge/remediations`);
      if (remediationResponse.ok) {
        const remediation = await remediationResponse.json();
        geminiConfigured = remediation.gemini_configured === true;
      }
      break;
    }
  } catch {
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
}

if (Date.now() >= deadline) {
  console.error("El backend no quedó disponible en 20 segundos.");
  stop(1);
} else {
  start("pnpm", ["dev:api", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"], {
    cwd: frontendDirectory,
    env: {
      ...process.env,
      SENTINEL_BACKEND_DIR: backendDirectory,
      SENTINEL_BACKEND_URL: backendUrl,
    },
  });

  const frontendDeadline = Date.now() + 20_000;
  while (Date.now() < frontendDeadline) {
    try {
      const response = await fetch(frontendUrl);
      if (response.ok) break;
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }
  }

  if (Date.now() >= frontendDeadline) {
    console.error("El frontend no quedó disponible en 20 segundos.");
    stop(1);
  } else {
    console.log("\nSentinel listo para la demostración del jurado.");
    console.log(`Abrir: ${frontendUrl}`);
    console.log(`Backend: ${backendDirectory}`);
    console.log("La base inicia vacía. La Fase 4 solo actúa sobre infraestructura controlada.");
    console.log(geminiConfigured
      ? "Gemini está configurado; las alertas críticas abiertas pueden activar un runbook permitido.\n"
      : "GEMINI_API_KEY no está configurada; la detección funcionará y la remediación se escalará sin ejecutar cambios.\n");
  }
}
