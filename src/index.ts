import TelegramBot from "node-telegram-bot-api";
import { registerHandlers } from "./bot/handlers";
import { setBotCommands } from "./bot/commands";
import { loadConfig } from "./config";
import { openSettingsStore } from "./store";

async function main() {
  const config = loadConfig();

  const bot = new TelegramBot(config.botToken, { polling: false });
  const store = openSettingsStore();

  await bot.deleteWebHook();
  registerHandlers(bot, store);
  await setBotCommands(bot);
  await bot.startPolling();

  // eslint-disable-next-line no-console
  console.log("Bot running in development (long polling).");
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
