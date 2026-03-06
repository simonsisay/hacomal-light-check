import fs from "node:fs";
import path from "node:path";
import type { SettingsStore, UserSettings } from "./types";

type BetterSqlite3Database = {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...params: unknown[]): any;
    run(...params: unknown[]): any;
  };
};

function ensureDirForFile(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function openSqliteStore(sqlitePath: string): SettingsStore {
  ensureDirForFile(sqlitePath);

  // Import at runtime so this project can still run without native bindings.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require("better-sqlite3");
  const db: BetterSqlite3Database = new Database(sqlitePath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      telegram_user_id INTEGER PRIMARY KEY,
      anchor_date TEXT NOT NULL,
      anchor_time TEXT NOT NULL CHECK(anchor_time IN ('18:30','19:30')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const getStmt = db.prepare(
    `SELECT telegram_user_id, anchor_date, anchor_time FROM user_settings WHERE telegram_user_id = ?`
  );
  const upsertStmt = db.prepare(`
    INSERT INTO user_settings (telegram_user_id, anchor_date, anchor_time, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(telegram_user_id) DO UPDATE SET
      anchor_date=excluded.anchor_date,
      anchor_time=excluded.anchor_time,
      updated_at=excluded.updated_at
  `);
  const resetStmt = db.prepare(`DELETE FROM user_settings WHERE telegram_user_id = ?`);

  return {
    getUserSettings(telegramUserId: number): UserSettings | null {
      const row = getStmt.get(telegramUserId);
      if (!row) return null;
      return {
        telegramUserId: Number(row.telegram_user_id),
        anchorDate: String(row.anchor_date),
        anchorTime: row.anchor_time
      } as UserSettings;
    },
    upsertUserSettings(settings: UserSettings, nowIso: string) {
      upsertStmt.run(settings.telegramUserId, settings.anchorDate, settings.anchorTime, nowIso, nowIso);
    },
    resetUserSettings(telegramUserId: number) {
      resetStmt.run(telegramUserId);
    }
  };
}

