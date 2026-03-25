import { bigint, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userSettingsTable = pgTable("user_settings", {
  telegramUserId: bigint("telegram_user_id", { mode: "number" }).primaryKey(),
  anchorDate: text("anchor_date").notNull(),
  anchorTime: varchar("anchor_time", { length: 5 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull()
});

export type UserSettingsRow = typeof userSettingsTable.$inferSelect;
