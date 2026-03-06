import { DateTime } from "luxon";
import { ADDIS_ZONE } from "./schedule";

export type EthiopianDayPart = "morning" | "afternoon" | "evening";

export function ethiopianDayPart(dt: DateTime): EthiopianDayPart {
  const addis = dt.setZone(ADDIS_ZONE);
  const hour24 = addis.hour;
  if (hour24 < 12) return "morning";
  if (hour24 < 18) return "afternoon";
  return "evening";
}

export function formatEthiopianTime(dt: DateTime): string {
  const addis = dt.setZone(ADDIS_ZONE);
  const hour24 = addis.hour;
  const ethHour = (hour24 + 6) % 12;
  const hour12 = ethHour === 0 ? 12 : ethHour;
  const minute = String(addis.minute).padStart(2, "0");
  return `${hour12}:${minute}`;
}

