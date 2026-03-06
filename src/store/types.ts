import type { OffTime } from "../core/parse";

export type UserSettings = {
  telegramUserId: number;
  anchorDate: string; // YYYY-MM-DD in Addis local date
  anchorTime: OffTime;
};

export type SettingsStore = {
  getUserSettings(telegramUserId: number): UserSettings | null;
  upsertUserSettings(settings: UserSettings, nowIso: string): void;
  resetUserSettings(telegramUserId: number): void;
};
