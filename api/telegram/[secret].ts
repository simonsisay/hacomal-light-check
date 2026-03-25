import { loadConfig } from "../../src/config";
import { handleIncomingUpdate } from "../../src/bot/handlers";
import { getWebhookBot } from "../../src/bot/runtime";
import { openSettingsStore } from "../../src/store";

function parseUpdate(body: unknown) {
  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const config = loadConfig();
  const secret =
    typeof req.query.secret === "string" ? req.query.secret : req.query.secret?.[0];

  if (!config.webhookSecret || secret !== config.webhookSecret) {
    // eslint-disable-next-line no-console
    console.warn("Rejected webhook request due to invalid secret");
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    // eslint-disable-next-line no-console
    console.log("Received Telegram webhook update");
    const bot = await getWebhookBot();
    const update = parseUpdate(req.body);

    if (!update || typeof update !== "object") {
      res.status(400).send("Invalid update");
      return;
    }

    await handleIncomingUpdate(bot, openSettingsStore(), update as any);
    res.status(200).send("ok");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to process Telegram webhook update", error);
    res.status(500).send("Internal Server Error");
  }
}
