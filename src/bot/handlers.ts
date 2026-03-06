import type TelegramBot from "node-telegram-bot-api";
import { DateTime } from "luxon";
import { parseOffTime, type OffTime } from "../core/parse";
import {
  addisNow,
  addisTodayDate,
  formatOutage,
  outageForDate,
  pickNextOutage,
} from "../core/schedule";
import type { SettingsStore, UserSettings } from "../store/types";

const TIME_BUTTONS: TelegramBot.SendMessageOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: "6:30 PM (18:30)", callback_data: "settoday:18:30" },
        { text: "7:30 PM (19:30)", callback_data: "settoday:19:30" },
      ],
    ],
  },
};

function mustBePrivate(
  bot: TelegramBot,
  chatId: number,
  chatType?: string
): boolean {
  if (chatType === "private") return true;
  void bot.sendMessage(
    chatId,
    "Please DM me in a private chat to use this bot."
  );
  return false;
}

function settingsOrPrompt(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
): UserSettings | null {
  const settings = store.getUserSettings(userId);
  if (settings) return settings;
  void bot.sendMessage(
    chatId,
    "I don’t know your schedule yet. Set today’s off time:",
    TIME_BUTTONS
  );
  return null;
}

async function sendToday(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = settingsOrPrompt(bot, chatId, store, userId);
  if (!settings) return;
  const today = addisTodayDate();
  const outage = outageForDate(
    { anchorDate: settings.anchorDate, anchorTime: settings.anchorTime },
    today
  );
  const now = addisNow();
  if (now >= outage.offStart) {
    const next = pickNextOutage(
      { anchorDate: settings.anchorDate, anchorTime: settings.anchorTime },
      now
    );
    await bot.sendMessage(
      chatId,
      `Today’s outage already started/passed.\nNext: ${formatOutage(next)}`
    );
    return;
  }
  await bot.sendMessage(chatId, formatOutage(outage));
}

async function sendTomorrow(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = settingsOrPrompt(bot, chatId, store, userId);
  if (!settings) return;
  const tomorrow = addisNow().plus({ days: 1 }).toFormat("yyyy-LL-dd");
  const outage = outageForDate(
    { anchorDate: settings.anchorDate, anchorTime: settings.anchorTime },
    tomorrow
  );
  await bot.sendMessage(chatId, formatOutage(outage));
}

async function sendNext(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = settingsOrPrompt(bot, chatId, store, userId);
  if (!settings) return;
  const outage = pickNextOutage({
    anchorDate: settings.anchorDate,
    anchorTime: settings.anchorTime,
  });
  await bot.sendMessage(chatId, `Next: ${formatOutage(outage)}`);
}

async function sendStatus(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = store.getUserSettings(userId);
  if (!settings) {
    await bot.sendMessage(
      chatId,
      "No schedule saved yet. Use /settoday to set today’s off time.",
      TIME_BUTTONS
    );
    return;
  }
  await bot.sendMessage(
    chatId,
    `Saved anchor:\n- date: ${settings.anchorDate} (Addis Ababa)\n- time: ${settings.anchorTime}\n\nUse /today to check today.`
  );
}

async function handleSetTodayValue(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number,
  offTime: OffTime
) {
  const anchorDate = addisTodayDate();
  const nowIso = DateTime.now().toISO() ?? new Date().toISOString();
  store.upsertUserSettings(
    { telegramUserId: userId, anchorDate, anchorTime: offTime },
    nowIso
  );
  await bot.sendMessage(
    chatId,
    `Saved. Anchor set to today (${anchorDate}) at ${offTime}.\nAsk /today anytime.`
  );
}

export function registerHandlers(bot: TelegramBot, store: SettingsStore) {
  bot.onText(/^\/start\b/i, async (msg) => {
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;
    await bot.sendMessage(
      msg.chat.id,
      "Hi! I can tell you today’s 1-hour power-off time (Addis Ababa).\n\nFirst, set today’s off time:",
      TIME_BUTTONS
    );
  });

  bot.onText(/^\/settoday(?:\s+(.+))?\b/i, async (msg, match) => {
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;
    const arg = match?.[1];
    const userId = msg.from?.id ?? msg.chat.id;
    if (arg) {
      const parsed = parseOffTime(arg);
      if (!parsed) {
      await bot.sendMessage(
        msg.chat.id,
        "Invalid time. Use 18:30 or 19:30, or tap a button:",
        TIME_BUTTONS
      );
      return;
    }
      await handleSetTodayValue(bot, msg.chat.id, store, userId, parsed);
      return;
    }
    await bot.sendMessage(msg.chat.id, "Set today’s off time:", TIME_BUTTONS);
  });

  bot.onText(/^\/today\b/i, async (msg) => {
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;
    await sendToday(bot, msg.chat.id, store, msg.from?.id ?? msg.chat.id);
  });

  bot.onText(/^\/tomorrow\b/i, async (msg) => {
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;
    await sendTomorrow(bot, msg.chat.id, store, msg.from?.id ?? msg.chat.id);
  });

  bot.onText(/^\/next\b/i, async (msg) => {
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;
    await sendNext(bot, msg.chat.id, store, msg.from?.id ?? msg.chat.id);
  });

  bot.onText(/^\/status\b/i, async (msg) => {
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;
    await sendStatus(bot, msg.chat.id, store, msg.from?.id ?? msg.chat.id);
  });

  bot.onText(/^\/reset\b/i, async (msg) => {
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;
    const userId = msg.from?.id ?? msg.chat.id;
    store.resetUserSettings(userId);
    await bot.sendMessage(
      msg.chat.id,
      "Reset done. Use /settoday to set today’s off time again."
    );
  });

  bot.on("callback_query", async (query) => {
    const message = query.message;
    if (!message) return;
    if (!mustBePrivate(bot, message.chat.id, message.chat.type)) return;

    const data = query.data ?? "";
    const match = /^settoday:(18:30|19:30)$/.exec(data);
    if (!match) return;

    const offTime = match[1] as OffTime;
    const userId = query.from.id;
    await handleSetTodayValue(bot, message.chat.id, store, userId, offTime);
    void bot.answerCallbackQuery(query.id);
  });

  bot.on("message", async (msg) => {
    if (!msg.text) return;
    if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;

    const text = msg.text.trim().toLowerCase();
    if (text.startsWith("/")) return; // handled by onText

    const userId = msg.from?.id ?? msg.chat.id;
    if (text === "today")
      return void (await sendToday(bot, msg.chat.id, store, userId));
    if (text === "tomorrow")
      return void (await sendTomorrow(bot, msg.chat.id, store, userId));
    if (text === "next")
      return void (await sendNext(bot, msg.chat.id, store, userId));
    if (text === "status")
      return void (await sendStatus(bot, msg.chat.id, store, userId));

    const maybeTime = parseOffTime(text);
    if (maybeTime)
      return void (await handleSetTodayValue(
        bot,
        msg.chat.id,
        store,
        userId,
        maybeTime
      ));
  });
}
