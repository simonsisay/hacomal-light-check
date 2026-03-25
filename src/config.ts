import dotenv from "dotenv";

dotenv.config();

export type AppConfig = {
  botToken: string;
  databaseUrl: string;
  nodeEnv: "development" | "production" | "test";
  publicBaseUrl?: string;
  webhookSecret?: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function loadConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV ?? "development") as AppConfig["nodeEnv"];

  const config: AppConfig = {
    botToken: required("BOT_TOKEN"),
    databaseUrl: required("DATABASE_URL"),
    nodeEnv,
    publicBaseUrl: process.env.PUBLIC_BASE_URL,
    webhookSecret: process.env.WEBHOOK_SECRET
  };

  return config;
}

export function webhookPath(webhookSecret: string): string {
  return `/api/telegram/${webhookSecret}`;
}

export function webhookUrl(config: AppConfig): string {
  if (!config.publicBaseUrl) {
    throw new Error("Missing required env var: PUBLIC_BASE_URL");
  }
  if (!config.webhookSecret) {
    throw new Error("Missing required env var: WEBHOOK_SECRET");
  }

  const baseUrl = config.publicBaseUrl.endsWith("/")
    ? config.publicBaseUrl.slice(0, -1)
    : config.publicBaseUrl;

  return `${baseUrl}${webhookPath(config.webhookSecret)}`;
}
