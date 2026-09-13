import { auth } from "@/auth";
import { isMicrosoftAuthConfigured } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchOutlookEvents, type OutlookEvent } from "@/lib/msGraphCalendar";
import { createEvent, deleteEvent } from "./actions";

const ADMIN_ROLES = new Set(["ADMINISTRATOR", "SUPER_ADMIN"]);

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  source: "MANUAL" | "OUTLOOK";
};

function monthRange(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0, 23, 59, 59);
  return { first, last };
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const isAdmin = !!role && ADMIN_ROLES.has(role);

  const params = await searchParams;
  const now = new Date();
  const year = params.y ? parseInt(params.y, 10) : now.getFullYear();
  const month = params.m ? parseInt(params.m, 10) - 1 : now.getMonth();
  const { first, last } = monthRange(year, month);

  const schoolEvents = await prisma.event.findMany({
    where: { source: "MANUAL", startAt: { gte: first }, endAt: { lte: last } },
    orderBy: { startAt: "asc" },
  });

  let outlookEvents: OutlookEvent[] = [];
  const msAccessToken = (session as { msGraphAccessToken?: string } | null)?.msGraphAccessToken;
  if (isMicrosoftAuthConfigured && msAccessToken) {
    outlookEvents = await fetchOutlookEvents(msAccessToken, first.toISOString(), last.toISOString());
  }

  const events: CalendarEvent[] = [
    ...schoolEvents.map((e) => ({ ...e, source: "MANUAL" as const })),
    ...outlookEvents.map((e) => ({
      id: `outlook-${e.externalId}`,
      title: e.title,
      description: e.description,
      location: e.location,
      startAt: e.startAt,
      endAt: e.endAt,
      allDay: e.allDay,
      source: "OUTLOOK" as const,
    })),
  ].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = toDateKey(e.startAt);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  const firstWeekday = first.getDay();
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const prevMonth = month === 0 ? { y: year - 1, m: 12 } : { y: year, m: month };
  const nextMonth = month === 11 ? { y: year + 1, m: 1 } : { y: year, m: month + 2 };
  const monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">📅 Calendar</h1>
          <p className="mt-1 text-sm text-slate-400">
            School events and notices{isMicrosoftAuthConfigured ? ", plus your Outlook calendar" : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <a
            href={`/calendar?y=${prevMonth.y}&m=${prevMonth.m}`}
            className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-slate-200 hover:bg-white/5"
          >
            ← Prev
          </a>
          <span className="min-w-[9rem] text-center font-medium text-white">{monthLabel}</span>
          <a
            href={`/calendar?y=${nextMonth.y}&m=${nextMonth.m}`}
            className="ro-focus-ring rounded-lg border border-white/10 px-3 py-1.5 text-slate-200 hover:bg-white/5"
          >
            Next →
          </a>
        </div>
      </div>

      {isMicrosoftAuthConfigured && !msAccessToken && (
        <p className="rounded-lg border border-white/10 bg-ro-navy-900 px-4 py-2.5 text-xs text-slate-400">
          Sign in with Microsoft to see your Outlook events here too.
        </p>
      )}

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = toDateKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = toDateKey(now) === key;
          return (
            <div
              key={i}
              className={`min-h-[6rem] rounded-lg border p-2 text-left ${
                isToday ? "border-ro-teal-500/60 bg-ro-teal-500/5" : "border-white/10 bg-ro-navy-900"
              }`}
            >
              <p className="text-xs font-medium text-slate-300">{day.getDate()}</p>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    title={e.title}
                    className={`truncate rounded px-1.5 py-0.5 text-[11px] ${
                      e.source === "OUTLOOK"
                        ? "bg-blue-500/20 text-blue-200"
                        : "bg-ro-teal-500/20 text-ro-teal-300"
                    }`}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[11px] text-slate-500">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <section className="rounded-xl border border-white/10 bg-ro-navy-900 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Add a school event
          </h2>
          <form action={createEvent} className="grid gap-3 sm:grid-cols-2">
            <input
              name="title"
              required
              placeholder="Event title"
              className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 sm:col-span-2"
            />
            <input
              name="location"
              placeholder="Location (optional)"
              className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
              <input type="checkbox" name="allDay" className="rounded" /> All day
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Start</label>
              <input type="date" name="startDate" required className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-950 px-2 py-1.5 text-sm text-white" />
              <input type="time" name="startTime" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-950 px-2 py-1.5 text-sm text-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">End</label>
              <input type="date" name="endDate" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-950 px-2 py-1.5 text-sm text-white" />
              <input type="time" name="endTime" className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-950 px-2 py-1.5 text-sm text-white" />
            </div>
            <textarea
              name="description"
              placeholder="Description (optional)"
              rows={2}
              className="ro-focus-ring rounded-lg border border-white/10 bg-ro-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 sm:col-span-2"
            />
            <button
              type="submit"
              className="ro-focus-ring rounded-lg bg-ro-teal-500 px-4 py-2 text-sm font-semibold text-ro-navy-950 hover:brightness-110 sm:col-span-2 sm:w-fit"
            >
              Add event
            </button>
          </form>

          {schoolEvents.length > 0 && (
            <div className="mt-4 space-y-2">
              {schoolEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-ro-navy-950 px-4 py-2.5 text-sm"
                >
                  <div>
                    <p className="text-slate-200">{e.title}</p>
                    <p className="text-xs text-slate-500">
                      {e.startAt.toLocaleDateString()}{e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  <form action={async () => { "use server"; await deleteEvent(e.id); }}>
                    <button type="submit" className="ro-focus-ring text-xs text-red-300 hover:underline">
                      Delete
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
