import { DateTime } from "luxon";
import { flipOffTime, type OffTime } from "./parse";

export const ADDIS_ZONE = "Africa/Addis_Ababa";
export const OUTAGE_MINUTES = 60;

export type Anchor = {
  anchorDate: string; // YYYY-MM-DD in Addis local date
  anchorTime: OffTime; // 18:30 or 19:30
};

export type Outage = {
  offStart: DateTime;
  backOn: DateTime;
  offTime: OffTime;
};

export function addisNow(): DateTime {
  return DateTime.now().setZone(ADDIS_ZONE);
}

export function addisTodayDate(now: DateTime = addisNow()): string {
  return now.setZone(ADDIS_ZONE).toFormat("yyyy-LL-dd");
}

export function outageForDate(anchor: Anchor, targetDate: string): Outage {
  const anchorDay = DateTime.fromISO(anchor.anchorDate, { zone: ADDIS_ZONE }).startOf("day");
  const targetDay = DateTime.fromISO(targetDate, { zone: ADDIS_ZONE }).startOf("day");
  const dayDiff = Math.trunc(targetDay.diff(anchorDay, "days").days);

  const offTime: OffTime = dayDiff % 2 === 0 ? anchor.anchorTime : flipOffTime(anchor.anchorTime);
  const [hour, minute] = offTime.split(":").map((n) => Number(n));

  const offStart = targetDay.set({ hour, minute, second: 0, millisecond: 0 });
  const backOn = offStart.plus({ minutes: OUTAGE_MINUTES });

  return { offStart, backOn, offTime };
}

export function pickNextOutage(anchor: Anchor, now: DateTime = addisNow()): Outage {
  const today = addisTodayDate(now);
  const todayOutage = outageForDate(anchor, today);
  if (now < todayOutage.offStart) return todayOutage;
  const tomorrow = now.setZone(ADDIS_ZONE).plus({ days: 1 }).toFormat("yyyy-LL-dd");
  return outageForDate(anchor, tomorrow);
}
