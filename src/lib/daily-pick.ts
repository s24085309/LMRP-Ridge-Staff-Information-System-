/** Deterministic "pick of the day" so every staff member sees the same
 * Quote/Fun Fact on a given calendar day, without needing a cron job. */
export function pickOfTheDay<T>(items: T[], date = new Date()): T | null {
  if (items.length === 0) return null;
  const dayKey = Number(
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
      date.getDate()
    ).padStart(2, "0")}`
  );
  const index = dayKey % items.length;
  return items[index];
}
