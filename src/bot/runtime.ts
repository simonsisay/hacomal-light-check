import TelegramBot from "node-telegram-bot-api";
import { loadConfig } from "../config";
import { openSettingsStore } from "../store";
import { registerHandlers } from "./handlers";

let botPromise: Promise<TelegramBot> | undefined;

export function getWebhookBot(): Promise<TelegramBot> {
  if (!botPromise) {
    botPromise = (async () => {
      const config = loadConfig();
      const bot = new TelegramBot(config.botToken, { polling: false });

      registerHandlers(bot, openSettingsStore());

      return bot;
    })();
  }

  return botPromise;
}
