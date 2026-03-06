import fs from "node:fs";
import path from "node:path";
import type { SettingsStore, UserSettings } from "./types";

type JsonDb = {
  version: 1;
  users: Record<string, { anchorDate: string; anchorTime: "18:30" | "19:30" }>;
};

function ensureDirForFile(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath: string): JsonDb {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as JsonDb;
    if (!parsed || parsed.version !== 1 || typeof parsed.users !== "object") return { version: 1, users: {} };
    return parsed;
  } catch {
    return { version: 1, users: {} };
  }
}

function atomicWrite(filePath: string, contents: string) {
  ensureDirForFile(filePath);
  const tmp = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, contents, "utf8");
  fs.renameSync(tmp, filePath);
}

export function openJsonStore(filePath: string): SettingsStore {
  const db = readJson(filePath);

  const flush = () => atomicWrite(filePath, `${JSON.stringify(db, null, 2)}\n`);

  return {
    getUserSettings(telegramUserId: number): UserSettings | null {
      const entry = db.users[String(telegramUserId)];
      if (!entry) return null;
      return {
        telegramUserId,
        anchorDate: entry.anchorDate,
        anchorTime: entry.anchorTime
      };
    },
    upsertUserSettings(settings: UserSettings) {
      db.users[String(settings.telegramUserId)] = {
        anchorDate: settings.anchorDate,
        anchorTime: settings.anchorTime
      };
      flush();
    },
    resetUserSettings(telegramUserId: number) {
      delete db.users[String(telegramUserId)];
      flush();
    }
  };
}

