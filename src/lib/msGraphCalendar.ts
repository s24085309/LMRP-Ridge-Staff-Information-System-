// Fetches the signed-in staff member's own Outlook calendar via Microsoft
// Graph, using the access token captured in the NextAuth session (see
// src/auth.ts). Read-only — we never write back to Outlook.

export type OutlookEvent = {
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
};

type GraphEvent = {
  id: string;
  subject: string;
  bodyPreview?: string;
  isAllDay: boolean;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName?: string };
};

export async function fetchOutlookEvents(
  accessToken: string,
  fromISO: string,
  toISO: string
): Promise<OutlookEvent[]> {
  const url = new URL("https://graph.microsoft.com/v1.0/me/calendarview");
  url.searchParams.set("startDateTime", fromISO);
  url.searchParams.set("endDateTime", toISO);
  url.searchParams.set("$orderby", "start/dateTime");
  url.searchParams.set("$top", "100");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
    // Calendar data changes independently of our own DB — never cache.
    cache: "no-store",
  });

  if (!res.ok) {
    // Expired/insufficient-scope token, throttling, etc. — degrade to no
    // Outlook events rather than breaking the whole calendar page.
    return [];
  }

  const data = (await res.json()) as { value: GraphEvent[] };
  return data.value.map((e) => ({
    externalId: e.id,
    title: e.subject || "(No title)",
    description: e.bodyPreview || null,
    location: e.location?.displayName || null,
    startAt: new Date(e.start.dateTime + "Z"),
    endAt: new Date(e.end.dateTime + "Z"),
    allDay: e.isAllDay,
  }));
}
