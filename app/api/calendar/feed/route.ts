import { NextResponse } from "next/server";

function icsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function addDays(date: Date, days: number, hour: number, minute: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function event(uid: string, summary: string, start: Date, end: Date, description: string) {
  const stamp = icsDate(new Date());
  return [
    "BEGIN:VEVENT",
    `UID:${escapeIcs(uid)}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT"
  ].join("\r\n");
}

export async function GET() {
  const now = new Date();
  const deadlineStart = addDays(now, 3, 23, 59);
  const deadlineEnd = new Date(deadlineStart.getTime() + 30 * 60 * 1000);
  const workStart = addDays(now, 1, 19, 0);
  const workEnd = addDays(now, 1, 21, 0);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Toki//Demo Webcal Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Toki Deadline Plan",
    "X-WR-TIMEZONE:Asia/Singapore",
    event("demo-deadline@toki", "Deadline: 2D Project Submission", deadlineStart, deadlineEnd, "Demo webcal feed. Production should load user-specific tasks by secure token."),
    event("demo-workblock@toki", "Work block: 2D Project final draft", workStart, workEnd, "Suggested Toki work session."),
    "END:VCALENDAR"
  ].join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=60"
    }
  });
}
