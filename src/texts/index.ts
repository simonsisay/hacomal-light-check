import am from "./am.json";

type TextDict = typeof am;

function getPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const value = getPath(am, key);
  if (typeof value !== "string") {
    throw new Error(`Missing text key: ${key}`);
  }
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (_m, name) => String(vars[name] ?? `{${name}}`));
}

export const labels = {
  today: () => t("buttons.today"),
  tomorrow: () => t("buttons.tomorrow"),
  next: () => t("buttons.next"),
  setToday: () => t("buttons.set_today"),
  status: () => t("buttons.status"),
  reset: () => t("buttons.reset")
};

export type _TextDict = TextDict;

