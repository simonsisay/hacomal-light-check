import { loadConfig } from "../../src/config";
import { getWebhookBot } from "../../src/bot/runtime";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const config = loadConfig();
  const secret =
    typeof req.query.secret === "string" ? req.query.secret : req.query.secret?.[0];

  if (!config.webhookSecret || secret !== config.webhookSecret) {
    res.status(401).send("Unauthorized");
    return;
  }

  const bot = await getWebhookBot();
  await bot.processUpdate(req.body);

  res.status(200).send("ok");
}
