import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { loadConfig } from "./config";
import { registerHandlers } from "./bot/handlers";
import { openSettingsStore } from "./store";

function withoutTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function main() {
  const config = loadConfig();
  const store = openSettingsStore(config.storeBackend, config.storePath);

  if (config.nodeEnv === "development") {
    const bot = new TelegramBot(config.botToken, { polling: true });
    registerHandlers(bot, store);
    // eslint-disable-next-line no-console
    console.log("Bot running in development (long polling).");
    return;
  }

  const bot = new TelegramBot(config.botToken, { polling: false });
  registerHandlers(bot, store);

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const secret = config.webhookSecret!;
  const path = `/telegram/${secret}`;

  app.post(path, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  app.get("/health", (_req, res) => res.status(200).send("ok"));

  const port = config.port;
  app.listen(port, async () => {
    const webhookUrl = `${withoutTrailingSlash(config.publicBaseUrl!)}${path}`;
    await bot.setWebHook(webhookUrl);
    // eslint-disable-next-line no-console
    console.log(`Bot running in production (webhook). Listening on :${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
