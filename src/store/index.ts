import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { userSettingsTable } from "../db/schema";
import type { SettingsStore, UserSettings } from "./types";

export function openSettingsStore(): SettingsStore {
  return {
    async getUserSettings(telegramUserId: number): Promise<UserSettings | null> {
      const db = await getDb();
      const [row] = await db
        .select({
          telegramUserId: userSettingsTable.telegramUserId,
          anchorDate: userSettingsTable.anchorDate,
          anchorTime: userSettingsTable.anchorTime
        })
        .from(userSettingsTable)
        .where(eq(userSettingsTable.telegramUserId, telegramUserId))
        .limit(1);

      if (!row) {
        return null;
      }

      return {
        telegramUserId: row.telegramUserId,
        anchorDate: row.anchorDate,
        anchorTime: row.anchorTime as UserSettings["anchorTime"]
      };
    },

    async upsertUserSettings(
      settings: UserSettings,
      nowIso: string
    ): Promise<void> {
      const db = await getDb();
      const now = new Date(nowIso);

      await db
        .insert(userSettingsTable)
        .values({
          telegramUserId: settings.telegramUserId,
          anchorDate: settings.anchorDate,
          anchorTime: settings.anchorTime,
          createdAt: now,
          updatedAt: now
        })
        .onConflictDoUpdate({
          target: userSettingsTable.telegramUserId,
          set: {
            anchorDate: settings.anchorDate,
            anchorTime: settings.anchorTime,
            updatedAt: now
          }
        });
    },

    async resetUserSettings(telegramUserId: number): Promise<void> {
      const db = await getDb();
      await db
        .delete(userSettingsTable)
        .where(eq(userSettingsTable.telegramUserId, telegramUserId));
    }
  };
}
