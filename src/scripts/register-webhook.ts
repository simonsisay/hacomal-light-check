import TelegramBot from "node-telegram-bot-api";
import { loadConfig, webhookUrl } from "../config";
import { setBotCommands } from "../bot/commands";

async function main() {
  const config = loadConfig();
  const bot = new TelegramBot(config.botToken, { polling: false });
  const url = webhookUrl(config);

  await setBotCommands(bot);
  await bot.setWebHook(url, { drop_pending_updates: true } as any);
  const info = await bot.getWebHookInfo();

  // eslint-disable-next-line no-console
  console.log(`Webhook set to ${url}`);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(info, null, 2));
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
