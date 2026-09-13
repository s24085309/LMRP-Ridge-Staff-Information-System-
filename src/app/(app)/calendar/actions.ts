"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

function parseDateTime(dateStr: string, timeStr: string, allDay: boolean): Date {
  if (allDay) return new Date(`${dateStr}T00:00:00`);
  return new Date(`${dateStr}T${timeStr || "00:00"}:00`);
}

export async function createEvent(formData: FormData) {
  const session = await requireAdmin();
  const userId = (session.user as { id?: string })?.id;

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? startDate);
  const allDay = formData.get("allDay") === "on";
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!title || !startDate) return;

  const startAt = parseDateTime(startDate, startTime, allDay);
  const endAt = parseDateTime(endDate || startDate, endTime || startTime, allDay);

  await prisma.event.create({
    data: {
      title,
      description,
      location,
      startAt,
      endAt: endAt < startAt ? startAt : endAt,
      allDay,
      source: "MANUAL",
      createdById: userId ?? null,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  await prisma.event.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
