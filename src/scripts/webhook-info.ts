import TelegramBot from "node-telegram-bot-api";
import { loadConfig } from "../config";

async function main() {
  const config = loadConfig();
  const bot = new TelegramBot(config.botToken, { polling: false });
  const info = await bot.getWebHookInfo();

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(info, null, 2));
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
