export type OffTime = "18:30" | "19:30";

export function parseOffTime(input: string): OffTime | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "18:30" || trimmed === "6:30" || trimmed === "6:30pm" || trimmed === "6:30 pm") return "18:30";
  if (trimmed === "19:30" || trimmed === "7:30" || trimmed === "7:30pm" || trimmed === "7:30 pm") return "19:30";
  return null;
}

export function flipOffTime(time: OffTime): OffTime {
  return time === "18:30" ? "19:30" : "18:30";
}
