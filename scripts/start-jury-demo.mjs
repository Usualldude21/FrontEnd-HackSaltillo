import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)));
const backendDirectory = resolve(
  process.env.SENTINEL_BACKEND_DIR ?? resolve(frontendDirectory, "../hacktoon-saltillo"),
);
const backendPython = resolve(backendDirectory, ".venv/bin/python");
const databasePath = resolve(tmpdir(), `sentinel-jurado-${Date.now()}.db`);
const backendUrl = "http://127.0.0.1:8000";
const frontendUrl = "http://127.0.0.1:5173";

await access(backendPython).catch(() => {
  throw new Error(`No se encontró el entorno Python del backend en ${backendPython}`);
});

const children = [];
let stopping = false;

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

start(backendPython, [
  "-m",
  "uvicorn",
  "app.main:app",
  "--host",
  "127.0.0.1",
  "--port",
  "8000",
], {
  cwd: backendDirectory,
  env: {
    ...process.env,
    DATABASE_URL: `sqlite:///${databasePath}`,
    MONITOR_ENABLED: "false",
    RESOURCE_MONITOR_ENABLED: "false",
    TRAFFIC_ENABLED: "false",
  },
});

const deadline = Date.now() + 20_000;
while (Date.now() < deadline) {
  try {
    const response = await fetch(`${backendUrl}/api/challenge/contract`);
    if (response.ok) break;
  } catch {
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
}

if (Date.now() >= deadline) {
  console.error("El backend no quedó disponible en 20 segundos.");
  stop(1);
} else {
  start("pnpm", ["dev:api", "--host", "127.0.0.1", "--port", "5173"], {
    cwd: frontendDirectory,
    env: {
      ...process.env,
      SENTINEL_BACKEND_DIR: backendDirectory,
      SENTINEL_BACKEND_URL: backendUrl,
    },
  });

  console.log("\nSentinel listo para la demostración del jurado.");
  console.log(`Abrir: ${frontendUrl}`);
  console.log("La base inicia vacía y las acciones no solicitan tokens en la interfaz.\n");
}
