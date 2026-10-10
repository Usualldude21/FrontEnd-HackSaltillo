import { z } from "zod";

const apiBaseUrlSchema = z.string().trim().min(1).superRefine((value, context) => {
  if (value === "/") return;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    context.addIssue({ code: "custom", message: "VITE_API_BASE_URL debe ser / o una URL HTTP(S) absoluta." });
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    context.addIssue({ code: "custom", message: "VITE_API_BASE_URL debe usar HTTP o HTTPS." });
  }
  if (url.username.length > 0 || url.password.length > 0) {
    context.addIssue({ code: "custom", message: "VITE_API_BASE_URL no debe contener credenciales." });
  }
  if (url.search.length > 0 || url.hash.length > 0) {
    context.addIssue({ code: "custom", message: "VITE_API_BASE_URL no debe contener query ni fragmento." });
  }
}).transform((value) => value === "/" ? value : value.replace(/\/+$/u, ""));

const publicConfigSchema = z.object({
  dataSource: z.enum(["contract", "api"]),
  apiBaseUrl: apiBaseUrlSchema,
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;

interface PublicEnvironment {
  readonly MODE: string;
  readonly VITE_DATA_SOURCE?: unknown;
  readonly VITE_API_BASE_URL?: unknown;
}

export function readPublicConfig(env: PublicEnvironment = import.meta.env): PublicConfig {
  const inferredSource = env.MODE === "api" ? "api" : "contract";
  return publicConfigSchema.parse({
    dataSource: env.VITE_DATA_SOURCE ?? inferredSource,
    apiBaseUrl: env.VITE_API_BASE_URL ?? "/",
  });
}

export function getSourceLabel(config: PublicConfig): string {
  if (config.dataSource === "contract") return "Contrato";
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/u.test(config.apiBaseUrl)
    || config.apiBaseUrl === "/"
    ? "Backend local"
    : "Backend remoto";
}
