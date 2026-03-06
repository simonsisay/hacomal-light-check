import dotenv from "dotenv";

dotenv.config();

export type AppConfig = {
  botToken: string;
  nodeEnv: "development" | "production" | "test";
  port: number;
  publicBaseUrl?: string;
  webhookSecret?: string;
  storeBackend: "auto" | "sqlite" | "json";
  storePath: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];
  const port = Number(process.env.PORT ?? "3000");
  const storeBackendRaw = (process.env.STORE_BACKEND ?? "auto").toLowerCase();
  const storeBackend: AppConfig["storeBackend"] =
    storeBackendRaw === "sqlite" || storeBackendRaw === "json" || storeBackendRaw === "auto"
      ? storeBackendRaw
      : "auto";
  const storePathDefault = storeBackend === "json" ? "./.local/bot.json" : "./.local/bot.sqlite";
  const storePath = process.env.STORE_PATH ?? process.env.SQLITE_PATH ?? storePathDefault;

  const config: AppConfig = {
    botToken: required("BOT_TOKEN"),
    nodeEnv,
    port: Number.isFinite(port) ? port : 3000,
    publicBaseUrl: process.env.PUBLIC_BASE_URL,
    webhookSecret: process.env.WEBHOOK_SECRET,
    storeBackend,
    storePath
  };

  if (config.nodeEnv === "production") {
    if (!config.publicBaseUrl) throw new Error("Missing required env var in production: PUBLIC_BASE_URL");
    if (!config.webhookSecret) throw new Error("Missing required env var in production: WEBHOOK_SECRET");
  }

  return config;
}
