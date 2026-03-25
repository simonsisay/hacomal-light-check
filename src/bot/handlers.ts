import type TelegramBot from "node-telegram-bot-api";
import { DateTime } from "luxon";
import { parseOffTime, type OffTime } from "../core/parse";
import {
  addisNow,
  addisTodayDate,
  ADDIS_ZONE,
  outageForDate,
  pickNextOutage,
} from "../core/schedule";
import { ethiopianDayPart, formatEthiopianTime } from "../core/ethiopianTime";
import type { SettingsStore, UserSettings } from "../store/types";
import { labels, t } from "../texts";

const TIME_BUTTONS: TelegramBot.SendMessageOptions = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: t("buttons.off_1830"), callback_data: "settoday:18:30" },
        { text: t("buttons.off_1930"), callback_data: "settoday:19:30" },
      ],
    ],
  },
};

const MAIN_KEYBOARD: TelegramBot.SendMessageOptions = {
  reply_markup: {
    keyboard: [
      [
        { text: labels.today() },
        { text: labels.tomorrow() },
        { text: labels.next() },
      ],
      [
        { text: labels.setToday() },
        { text: labels.status() },
        { text: labels.reset() },
      ],
    ],
    resize_keyboard: true,
  },
};

function mustBePrivate(
  bot: TelegramBot,
  chatId: number,
  chatType?: string
): boolean {
  if (chatType === "private") return true;
  void bot.sendMessage(chatId, t("messages.private_only"), MAIN_KEYBOARD);
  return false;
}

function formatEthiopianTimeWithPart(dt: DateTime): string {
  const part = t(`time.${ethiopianDayPart(dt)}`);
  return `${formatEthiopianTime(dt)} ${part}`;
}

function formatOutageLine(offStart: DateTime, backOn: DateTime): string {
  const date = offStart.setZone(ADDIS_ZONE).toFormat("yyyy-LL-dd");
  const off = formatEthiopianTimeWithPart(offStart);
  const back = formatEthiopianTimeWithPart(backOn);
  return t("outage.line", { date, off, back });
}

async function settingsOrPrompt(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
): Promise<UserSettings | null> {
  const settings = await store.getUserSettings(userId);
  if (settings) return settings;
  void bot.sendMessage(chatId, t("messages.need_set"), MAIN_KEYBOARD);
  void bot.sendMessage(chatId, t("messages.set_first"), TIME_BUTTONS);
  return null;
}

async function sendToday(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = await settingsOrPrompt(bot, chatId, store, userId);
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
    const nextLine = formatOutageLine(next.offStart, next.backOn);
    await bot.sendMessage(
      chatId,
      t("messages.today_passed", { line: nextLine }),
      MAIN_KEYBOARD
    );
    return;
  }
  await bot.sendMessage(
    chatId,
    formatOutageLine(outage.offStart, outage.backOn),
    MAIN_KEYBOARD
  );
}

async function sendTomorrow(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = await settingsOrPrompt(bot, chatId, store, userId);
  if (!settings) return;
  const tomorrow = addisNow().plus({ days: 1 }).toFormat("yyyy-LL-dd");
  const outage = outageForDate(
    { anchorDate: settings.anchorDate, anchorTime: settings.anchorTime },
    tomorrow
  );
  await bot.sendMessage(
    chatId,
    formatOutageLine(outage.offStart, outage.backOn),
    MAIN_KEYBOARD
  );
}

async function sendNext(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = await settingsOrPrompt(bot, chatId, store, userId);
  if (!settings) return;
  const outage = pickNextOutage({
    anchorDate: settings.anchorDate,
    anchorTime: settings.anchorTime,
  });
  const line = formatOutageLine(outage.offStart, outage.backOn);
  await bot.sendMessage(
    chatId,
    t("messages.next_line", { line }),
    MAIN_KEYBOARD
  );
}

async function sendStatus(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  const settings = await store.getUserSettings(userId);
  if (!settings) {
    await bot.sendMessage(
      chatId,
      t("messages.status_none", { setTodayBtn: labels.setToday() }),
      MAIN_KEYBOARD
    );
    return;
  }
  const anchorStart = DateTime.fromISO(
    `${settings.anchorDate}T${settings.anchorTime}:00`,
    { zone: ADDIS_ZONE }
  );
  const anchorDisplay = formatEthiopianTimeWithPart(anchorStart);
  await bot.sendMessage(
    chatId,
    t("messages.status_saved", {
      date: settings.anchorDate,
      time: anchorDisplay,
    }),
    MAIN_KEYBOARD
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
  await store.upsertUserSettings(
    { telegramUserId: userId, anchorDate, anchorTime: offTime },
    nowIso
  );
  const outage = outageForDate({ anchorDate, anchorTime: offTime }, anchorDate);
  const displayTime = formatEthiopianTimeWithPart(outage.offStart);
  await bot.sendMessage(
    chatId,
    t("messages.saved", { date: anchorDate, time: displayTime }),
    MAIN_KEYBOARD
  );
  await bot.sendMessage(
    chatId,
    t("messages.ask_anytime", { todayBtn: labels.today() }),
    MAIN_KEYBOARD
  );
}

async function handleStartMessage(bot: TelegramBot, chatId: number) {
  await bot.sendMessage(chatId, t("messages.welcome"), MAIN_KEYBOARD);
  await bot.sendMessage(chatId, t("messages.set_first"), TIME_BUTTONS);
}

async function handleReset(
  bot: TelegramBot,
  chatId: number,
  store: SettingsStore,
  userId: number
) {
  await store.resetUserSettings(userId);
  await bot.sendMessage(
    chatId,
    t("messages.reset_done", { setTodayBtn: labels.setToday() }),
    MAIN_KEYBOARD
  );
}

function parseSetTodayCommand(text: string): RegExpExecArray | null {
  return /^\/settoday(?:@\w+)?(?:\s+(.+))?\b/i.exec(text);
}

function matchesCommand(text: string, command: string): boolean {
  return new RegExp(`^\\/${command}(?:@\\w+)?\\b`, "i").test(text);
}

export async function handleIncomingMessage(
  bot: TelegramBot,
  store: SettingsStore,
  msg: TelegramBot.Message
) {
  if (!msg.text) return;
  if (!mustBePrivate(bot, msg.chat.id, msg.chat.type)) return;

  const raw = msg.text.trim();
  const text = raw.toLowerCase();
  const userId = msg.from?.id ?? msg.chat.id;

  if (matchesCommand(raw, "start")) {
    await handleStartMessage(bot, msg.chat.id);
    return;
  }

  const setTodayMatch = parseSetTodayCommand(raw);
  if (setTodayMatch) {
    const arg = setTodayMatch[1];
    if (!arg) {
      await bot.sendMessage(msg.chat.id, t("messages.set_first"), TIME_BUTTONS);
      return;
    }

    const parsed = parseOffTime(arg);
    if (!parsed) {
      await bot.sendMessage(
        msg.chat.id,
        t("messages.invalid_time"),
        MAIN_KEYBOARD
      );
      await bot.sendMessage(msg.chat.id, t("messages.set_first"), TIME_BUTTONS);
      return;
    }

    await handleSetTodayValue(bot, msg.chat.id, store, userId, parsed);
    return;
  }

  if (matchesCommand(raw, "today")) {
    await sendToday(bot, msg.chat.id, store, userId);
    return;
  }

  if (matchesCommand(raw, "tomorrow")) {
    await sendTomorrow(bot, msg.chat.id, store, userId);
    return;
  }

  if (matchesCommand(raw, "next")) {
    await sendNext(bot, msg.chat.id, store, userId);
    return;
  }

  if (matchesCommand(raw, "status")) {
    await sendStatus(bot, msg.chat.id, store, userId);
    return;
  }

  if (matchesCommand(raw, "reset")) {
    await handleReset(bot, msg.chat.id, store, userId);
    return;
  }

  if (raw === labels.today()) {
    await sendToday(bot, msg.chat.id, store, userId);
    return;
  }

  if (raw === labels.tomorrow()) {
    await sendTomorrow(bot, msg.chat.id, store, userId);
    return;
  }

  if (raw === labels.next()) {
    await sendNext(bot, msg.chat.id, store, userId);
    return;
  }

  if (raw === labels.status()) {
    await sendStatus(bot, msg.chat.id, store, userId);
    return;
  }

  if (raw === labels.setToday()) {
    await bot.sendMessage(msg.chat.id, t("messages.set_first"), TIME_BUTTONS);
    return;
  }

  if (raw === labels.reset()) {
    await handleReset(bot, msg.chat.id, store, userId);
    return;
  }

  const maybeTime = parseOffTime(text);
  if (maybeTime) {
    await handleSetTodayValue(bot, msg.chat.id, store, userId, maybeTime);
  }
}

export async function handleIncomingCallbackQuery(
  bot: TelegramBot,
  store: SettingsStore,
  query: TelegramBot.CallbackQuery
) {
  const message = query.message;
  if (!message) return;
  if (!mustBePrivate(bot, message.chat.id, message.chat.type)) return;

  const data = query.data ?? "";
  const match = /^settoday:(18:30|19:30)$/.exec(data);
  if (!match) return;

  const offTime = match[1] as OffTime;
  const userId = query.from.id;
  await handleSetTodayValue(bot, message.chat.id, store, userId, offTime);
  await bot.answerCallbackQuery(query.id);
}

export async function handleIncomingUpdate(
  bot: TelegramBot,
  store: SettingsStore,
  update: TelegramBot.Update
) {
  if (update.message) {
    await handleIncomingMessage(bot, store, update.message);
    return;
  }

  if (update.callback_query) {
    await handleIncomingCallbackQuery(bot, store, update.callback_query);
  }
}

export function registerHandlers(bot: TelegramBot, store: SettingsStore) {
  bot.on("message", (msg: TelegramBot.Message) => {
    void handleIncomingMessage(bot, store, msg).catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to handle Telegram message", error);
    });
  });

  bot.on("callback_query", (query: TelegramBot.CallbackQuery) => {
    void handleIncomingCallbackQuery(bot, store, query).catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to handle Telegram callback query", error);
    });
  });
}
