import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { outageForDate, pickNextOutage, ADDIS_ZONE } from "../src/core/schedule";

describe("schedule", () => {
  it("alternates daily from an 18:30 anchor", () => {
    const anchor = { anchorDate: "2026-03-06", anchorTime: "18:30" as const };
    expect(outageForDate(anchor, "2026-03-06").offTime).toBe("18:30");
    expect(outageForDate(anchor, "2026-03-07").offTime).toBe("19:30");
    expect(outageForDate(anchor, "2026-03-08").offTime).toBe("18:30");
  });

  it("works across negative day differences", () => {
    const anchor = { anchorDate: "2026-03-06", anchorTime: "19:30" as const };
    expect(outageForDate(anchor, "2026-03-05").offTime).toBe("18:30");
    expect(outageForDate(anchor, "2026-03-04").offTime).toBe("19:30");
  });

  it("pickNextOutage returns today if before outage start", () => {
    const anchor = { anchorDate: "2026-03-06", anchorTime: "18:30" as const };
    const now = DateTime.fromISO("2026-03-06T17:00:00", { zone: ADDIS_ZONE });
    const next = pickNextOutage(anchor, now);
    expect(next.offStart.setZone(ADDIS_ZONE).toISODate()).toBe("2026-03-06");
    expect(next.offTime).toBe("18:30");
  });

  it("pickNextOutage returns tomorrow if after outage start", () => {
    const anchor = { anchorDate: "2026-03-06", anchorTime: "18:30" as const };
    const now = DateTime.fromISO("2026-03-06T18:45:00", { zone: ADDIS_ZONE });
    const next = pickNextOutage(anchor, now);
    expect(next.offStart.setZone(ADDIS_ZONE).toISODate()).toBe("2026-03-07");
    expect(next.offTime).toBe("19:30");
  });
});
