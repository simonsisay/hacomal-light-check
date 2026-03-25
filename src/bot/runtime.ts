import TelegramBot from "node-telegram-bot-api";
import { loadConfig } from "../config";

let botPromise: Promise<TelegramBot> | undefined;

export function getWebhookBot(): Promise<TelegramBot> {
  if (!botPromise) {
    botPromise = (async () => {
      const config = loadConfig();
      return new TelegramBot(config.botToken, { polling: false });
    })();
  }

  return botPromise;
}
