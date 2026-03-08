import path from "node:path";
import type { SettingsStore } from "./types";
import { openJsonStore } from "./jsonStore";
import { openSqliteStore } from "./sqliteStore";

export type StoreBackend = "auto" | "sqlite" | "json";

function deriveJsonPath(fromPath: string): string {
  const parsed = path.parse(fromPath);
  if (parsed.ext) return path.join(parsed.dir, `${parsed.name}.json`);
  return `${fromPath}.json`;
}

export function openSettingsStore(backend: StoreBackend, storePath: string): SettingsStore {
  if (backend === "json") {
    // eslint-disable-next-line no-console
    console.log(`Settings store: json (${storePath})`);
    return openJsonStore(storePath);
  }
  if (backend === "sqlite") {
    // eslint-disable-next-line no-console
    console.log(`Settings store: sqlite (${storePath})`);
    return openSqliteStore(storePath);
  }

  // auto
  if (storePath.endsWith(".json")) return openJsonStore(storePath);

  try {
    // eslint-disable-next-line no-console
    console.log(`Settings store: sqlite (${storePath})`);
    return openSqliteStore(storePath);
  } catch (err) {
    const jsonPath = deriveJsonPath(storePath);
    // eslint-disable-next-line no-console
    console.warn(
      `SQLite unavailable (better-sqlite3 native bindings not found). Falling back to JSON store at: ${jsonPath}`
    );
    // eslint-disable-next-line no-console
    console.warn(err instanceof Error ? err.message : String(err));
    // eslint-disable-next-line no-console
    console.log(`Settings store: json (${jsonPath})`);
    return openJsonStore(jsonPath);
  }
}
