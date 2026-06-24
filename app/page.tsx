"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { AgentResult, ExtractedItem } from "../lib/types";

type ScreenKey = "dashboard" | "upload" | "loading" | "review" | "tasks" | "calendar" | "plan" | "reminders" | "connect" | "detail";
type TaskFilter = "all" | "today" | "week" | "overdue" | "high";
type CalendarProvider = "toki" | "google" | "microsoft" | "apple" | "ics";

type UiTask = ExtractedItem & {
  id: string;
  description: string;
  status: "needs_review" | "saved" | "in_progress" | "done";
  deliverables: string[];
  submission_method: string;
  source_document: string;
};

type UiSession = {
  id: string;
  title: string;
  taskTitle: string;
  start: string;
  end: string;
  goal: string;
  startIso?: string;
  endIso?: string;
};

type UiReminder = {
  id: string;
  taskTitle: string;
  option: string;
  sendAt: string;
  message: string;
  sendAtIso?: string;
};

type CalendarItem = {
  id: string;
  kind: "deadline" | "session" | "reminder";
  title: string;
  subtitle: string;
  startIso?: string | null;
  endIso?: string | null;
  taskId?: string;
  screen: ScreenKey;
};

type CalendarDay = {
  key: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  items: CalendarItem[];
};

const STORAGE_KEY = "toki-deadline-agent-tasks-v3";
const REMINDERS_STORAGE_KEY = "toki-deadline-agent-reminders-v3";
const SESSIONS_STORAGE_KEY = "toki-deadline-agent-sessions-v3";
const PROVIDER_STORAGE_KEY = "toki-calendar-provider-v1";
const SENT_ALARMS_STORAGE_KEY = "toki-sent-alarms-v1";

const sampleText = `Hi everyone,\n\nReminders for this week:\n\n1. The 2D Project is due this Friday at 11:59 PM. Please submit both the PDF and Rhino file to the LMS submission folder.\n\n2. EM Quiz 3 will open on Canvas this Wednesday at 8:00 PM. You'll have 45 minutes to complete it.\n\n3. Don't forget to submit the internship declaration form by Monday 5:00 PM via the Student Portal.\n\n4. HASS group presentations start Thursday at 2:00 PM. Please have your slides ready.\n\n5. Physics lab report draft is due next week via Google Classroom - exact date TBD.`;

const demoTasks: UiTask[] = [
  {
    id: "task-2d-project",
    title: "2D Project Submission",
    type: "submission",
    course: "Design Studio",
    deadline: nextWeekdayIso(5, 23, 59),
    deadline_text: "Friday, 11:59 PM",
    required_action: "Submit both the final PDF and Rhino file to the LMS submission folder.",
    source_quote: "The 2D Project is due this Friday at 11:59 PM. Please submit both the PDF and Rhino file to the LMS submission folder.",
    estimated_effort_hours: 4,
    priority: "high",
    confidence: 0.94,
    description: "Finalise the project package, export the PDF, check the Rhino file, and submit to LMS before the deadline.",
    status: "needs_review",
    deliverables: ["Final PDF", "Rhino file"],
    submission_method: "LMS submission folder",
    source_document: "Canvas announcement"
  },
  {
    id: "task-em-quiz",
    title: "EM Quiz 3",
    type: "exam",
    course: "Electromagnetism",
    deadline: nextWeekdayIso(3, 20, 0),
    deadline_text: "Wednesday, 8:00 PM",
    required_action: "Complete Quiz 3 on Canvas within the 45 minute window.",
    source_quote: "EM Quiz 3 will open on Canvas this Wednesday at 8:00 PM. You'll have 45 minutes to complete it.",
    estimated_effort_hours: 2,
    priority: "medium",
    confidence: 0.89,
    description: "Revise the key topics and be ready to start the Canvas quiz on time.",
    status: "needs_review",
    deliverables: ["Canvas quiz attempt"],
    submission_method: "Canvas quiz",
    source_document: "Canvas announcement"
  },
  {
    id: "task-internship-form",
    title: "Internship Form",
    type: "form",
    course: "Career Office",
    deadline: nextWeekdayIso(1, 17, 0),
    deadline_text: "Monday, 5:00 PM",
    required_action: "Submit the internship declaration form through the Student Portal.",
    source_quote: "Don't forget to submit the internship declaration form by Monday 5:00 PM via the Student Portal.",
    estimated_effort_hours: 0.5,
    priority: "medium",
    confidence: 0.86,
    description: "Complete the declaration form and verify submission status.",
    status: "saved",
    deliverables: ["Declaration form"],
    submission_method: "Student Portal",
    source_document: "Canvas announcement"
  },
  {
    id: "task-hass-presentation",
    title: "HASS Presentation",
    type: "class_event",
    course: "Humanities",
    deadline: nextWeekdayIso(4, 14, 0),
    deadline_text: "Thursday, 2:00 PM",
    required_action: "Prepare presentation slides and be ready for group presentation.",
    source_quote: "HASS group presentations start Thursday at 2:00 PM. Please have your slides ready.",
    estimated_effort_hours: 2,
    priority: "high",
    confidence: 0.81,
    description: "Prepare and rehearse group slides before presentation time.",
    status: "needs_review",
    deliverables: ["Group slides", "Speaking notes"],
    submission_method: "In-class presentation",
    source_document: "Canvas announcement"
  },
  {
    id: "task-lab-report-draft",
    title: "Lab Report Draft",
    type: "assignment",
    course: "Physics Lab",
    deadline: null,
    deadline_text: "next week — exact date TBD",
    required_action: "Prepare the lab report draft for Google Classroom submission once the exact date is confirmed.",
    source_quote: "Physics lab report draft is due next week via Google Classroom - exact date TBD.",
    estimated_effort_hours: 3,
    priority: "medium",
    confidence: 0.62,
    description: "Draft the report early, but confirm the exact deadline before creating reminders.",
    status: "needs_review",
    deliverables: ["Lab report draft"],
    submission_method: "Google Classroom",
    source_document: "Canvas announcement"
  }
];

function nextWeekdayIso(day: number, hour: number, minute: number) {
  const date = new Date();
  const diff = (day - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function formatDate(value?: string | null) {
  if (!value) return "Date needed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function fullDate(value?: string | null) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function shortLocal(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
}

function isToday(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isThisWeek(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(now.getDate() + 7);
  return date >= now && date <= weekLater;
}

function isOverdue(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date < new Date();
}

function priorityClass(priority?: string | null) {
  if (priority === "high") return "badge-high";
  if (priority === "medium") return "badge-medium";
  return "badge-low";
}

function dueClass(task: UiTask) {
  if (!task.deadline) return "warning";
  if (task.priority === "high" || isToday(task.deadline)) return "urgent";
  if ((task.confidence ?? 1) < 0.7) return "warning";
  return "";
}

function confidenceClass(confidence?: number | null) {
  return (confidence ?? 0) >= 0.75 ? "conf-high" : "conf-low";
}

function displayType(type?: string | null) {
  if (!type) return "Deadline";
  return type.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function safeText(value?: string | null, fallback = "Not specified") {
  const cleaned = value?.trim();
  return cleaned && cleaned.toLowerCase() !== "unknown" ? cleaned : fallback;
}

function defaultDeliverablesFor(item: ExtractedItem) {
  if (item.type === "meeting" || item.type === "class_event") return ["No deliverables listed"];
  if (item.type === "exam") return ["No deliverables listed"];
  if (item.type === "form") return ["Completed form"];
  return ["Check source for deliverables"];
}

function inferSubmissionOrVenue(item: ExtractedItem) {
  const text = `${item.required_action || ""} ${item.source_quote || ""}`;
  const viaMatch = text.match(/(?:via|through|on|to)\s+([A-Za-z][A-Za-z0-9 .&/-]{1,40})(?:\.|,|$)/i);
  if (viaMatch) return viaMatch[1].trim();
  if (item.type === "meeting" || item.type === "class_event") return "No venue provided";
  return "Not specified";
}

function mapResultToTasks(result: AgentResult | null, fileName: string): UiTask[] {
  if (!result?.items?.length) return demoTasks;
  return result.items.map((item, index) => ({
    ...item,
    id: `${item.title || "task"}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    title: item.title || "Untitled task",
    type: item.type || "deadline",
    course: safeText(item.course),
    description: item.required_action || "Review the source and confirm the exact action needed.",
    status: "needs_review",
    deliverables: defaultDeliverablesFor(item),
    submission_method: inferSubmissionOrVenue(item),
    source_document: fileName || "Uploaded source"
  }));
}

function mapResultToSessions(result: AgentResult | null): UiSession[] {
  if (!result?.study_plan?.length) {
    return [
      { id: "s1", title: "2D Project — final draft", taskTitle: "2D Project Submission", start: "Today 7:00 PM", end: "Today 9:00 PM", goal: "Complete composition, test Rhino export, create PDF.", startIso: nextWeekdayIso(2, 19, 0), endIso: nextWeekdayIso(2, 21, 0) },
      { id: "s2", title: "EM Quiz 3 — revision", taskTitle: "EM Quiz 3", start: "Wed 6:30 PM", end: "Wed 7:30 PM", goal: "Chapters 4–6, 10 practice problems, formulas.", startIso: nextWeekdayIso(3, 18, 30), endIso: nextWeekdayIso(3, 19, 30) },
      { id: "s3", title: "Final edits & submission prep", taskTitle: "2D Project Submission", start: "Thu 4:00 PM", end: "Thu 6:00 PM", goal: "Review deliverables, prepare backup files.", startIso: nextWeekdayIso(4, 16, 0), endIso: nextWeekdayIso(4, 18, 0) },
      { id: "s4", title: "Internship form", taskTitle: "Internship Form", start: "Sun 3:00 PM", end: "Sun 4:00 PM", goal: "Complete declaration, upload docs, submit via Student Portal.", startIso: nextWeekdayIso(0, 15, 0), endIso: nextWeekdayIso(0, 16, 0) }
    ];
  }
  return result.study_plan.map((slot, index) => ({
    id: `session-${index}`,
    title: slot.reason || "Suggested work block",
    taskTitle: slot.task_title,
    start: fullDate(slot.start),
    end: fullDate(slot.end),
    goal: slot.reason || "Make steady progress before the deadline.",
    startIso: slot.start,
    endIso: slot.end
  }));
}

function mapResultToReminders(result: AgentResult | null): UiReminder[] {
  if (!result?.reminders?.length) {
    return [
      { id: "r1", taskTitle: "2D Project Submission", option: "3 days before", sendAt: "Tue 9:00 AM", message: "2D Project is due soon. Start final edits early.", sendAtIso: nextWeekdayIso(2, 9, 0) },
      { id: "r2", taskTitle: "2D Project Submission", option: "1 day before", sendAt: "Thu 9:00 AM", message: "2D Project is due tomorrow. Check PDF and Rhino files.", sendAtIso: nextWeekdayIso(4, 9, 0) },
      { id: "r3", taskTitle: "2D Project Submission", option: "2 hours before", sendAt: "Fri 9:59 PM", message: "2D Project is due in 2 hours. Upload now if ready.", sendAtIso: nextWeekdayIso(5, 21, 59) }
    ];
  }
  return result.reminders.map((reminder, index) => ({
    id: `reminder-${index}`,
    taskTitle: reminder.task_title,
    option: "Suggested",
    sendAt: fullDate(reminder.send_at),
    message: reminder.message,
    sendAtIso: reminder.send_at
  }));
}

function buildReminder(task: UiTask, option: string, customTime: string): UiReminder | null {
  if (!task.deadline) return null;
  const due = new Date(task.deadline);
  if (Number.isNaN(due.getTime())) return null;
  const send = new Date(due);
  if (option === "3 days before") send.setDate(due.getDate() - 3);
  if (option === "1 day before") send.setDate(due.getDate() - 1);
  if (option === "Morning of deadline") send.setHours(8, 0, 0, 0);
  if (option === "2 hours before") send.setTime(due.getTime() - 2 * 60 * 60 * 1000);
  if (option === "Custom reminder time" && !customTime) return null;
  if (option === "Custom reminder time" && customTime) {
    const custom = new Date(customTime);
    if (!Number.isNaN(custom.getTime())) send.setTime(custom.getTime());
  }
  return {
    id: `${task.id}-${option}`.replace(/\s+/g, "-"),
    taskTitle: task.title,
    option,
    sendAt: fullDate(send.toISOString()),
    message: `${task.title} is due ${task.deadline_text || fullDate(task.deadline)}. ${task.required_action || "Check the task and act early."}`,
    sendAtIso: send.toISOString()
  };
}

function toIcsDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function makeIcsEvent(uid: string, title: string, start: string, end: string, description: string, alarm?: string) {
  const stamp = toIcsDate(new Date().toISOString());
  const lines = ["BEGIN:VEVENT", `UID:${escapeIcs(uid)}`, `DTSTAMP:${stamp}`, `LAST-MODIFIED:${stamp}`, "SEQUENCE:0", `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${escapeIcs(title)}`, `DESCRIPTION:${escapeIcs(description)}`];
  if (alarm) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeIcs(title)}`, `TRIGGER:${alarm}`, "END:VALARM");
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

function buildIcs(tasks: UiTask[], sessions: UiSession[], reminders: UiReminder[]) {
  const events: string[] = [];
  tasks.forEach((task) => {
    const start = toIcsDate(task.deadline);
    if (!start || !task.deadline) return;
    const end = toIcsDate(new Date(new Date(task.deadline).getTime() + 30 * 60 * 1000).toISOString());
    if (!end) return;
    const detailLines = [
      task.required_action || "Review details.",
      task.course && task.course !== "Not specified" ? `Course: ${task.course}` : null,
      task.submission_method && task.submission_method !== "Not specified" ? `Submission/venue: ${task.submission_method}` : null,
      `Source: ${task.source_document || "Toki"}`
    ].filter(Boolean).join("\n");
    events.push(makeIcsEvent(`task-${task.id}@toki`, `${task.type === "meeting" ? "Meeting" : "Deadline"}: ${task.title}`, start, end, detailLines, "-PT2H"));
  });
  sessions.forEach((session) => {
    const start = toIcsDate(session.startIso);
    const end = toIcsDate(session.endIso);
    if (!start || !end) return;
    events.push(makeIcsEvent(`session-${session.id}@toki`, `Work block: ${session.title}`, start, end, `Linked task: ${session.taskTitle}\nGoal: ${session.goal}`));
  });
  reminders.forEach((reminder) => {
    const start = toIcsDate(reminder.sendAtIso);
    if (!start || !reminder.sendAtIso) return;
    const end = toIcsDate(new Date(new Date(reminder.sendAtIso).getTime() + 15 * 60 * 1000).toISOString());
    if (!end) return;
    events.push(makeIcsEvent(`reminder-${reminder.id}@toki`, `Reminder: ${reminder.taskTitle}`, start, end, reminder.message));
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Toki Deadline Agent//Agnes AI Hackathon MVP//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", ...events, "END:VCALENDAR"].join("\r\n");
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(value: Date) {
  return value.toLocaleString([], { month: "long", year: "numeric" });
}

function buildCalendarItems(tasks: UiTask[], sessions: UiSession[], reminders: UiReminder[]): CalendarItem[] {
  const taskItems: CalendarItem[] = tasks
    .filter((task) => Boolean(task.deadline))
    .map((task) => ({
      id: `cal-deadline-${task.id}`,
      kind: "deadline",
      title: task.title,
      subtitle: `${displayType(task.type)} · ${task.course || "Not specified"}`,
      startIso: task.deadline,
      endIso: task.deadline,
      taskId: task.id,
      screen: "detail"
    }));

  const sessionItems: CalendarItem[] = sessions
    .filter((session) => Boolean(session.startIso))
    .map((session) => ({
      id: `cal-session-${session.id}`,
      kind: "session",
      title: session.title,
      subtitle: `Work block · ${session.taskTitle}`,
      startIso: session.startIso,
      endIso: session.endIso,
      screen: "plan"
    }));

  const reminderItems: CalendarItem[] = reminders
    .filter((reminder) => Boolean(reminder.sendAtIso))
    .map((reminder) => ({
      id: `cal-reminder-${reminder.id}`,
      kind: "reminder",
      title: reminder.taskTitle,
      subtitle: `Alarm · ${reminder.option}`,
      startIso: reminder.sendAtIso,
      endIso: reminder.sendAtIso,
      screen: "reminders"
    }));

  return [...taskItems, ...sessionItems, ...reminderItems].sort((a, b) => {
    const left = a.startIso ? new Date(a.startIso).getTime() : 0;
    const right = b.startIso ? new Date(b.startIso).getTime() : 0;
    return left - right;
  });
}

function buildMonthGrid(month: Date, items: CalendarItem[]): CalendarDay[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const today = new Date();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const dayItems = items.filter((item) => item.startIso && sameLocalDay(new Date(item.startIso), date));
    return { key: dayKey(date), date, inMonth: date.getMonth() === month.getMonth(), isToday: sameLocalDay(date, today), items: dayItems };
  });
}

function providerLabel(provider: CalendarProvider) {
  const labels: Record<CalendarProvider, string> = {
    toki: "Toki PWA calendar",
    google: "Google Calendar",
    microsoft: "Microsoft Outlook / Teams",
    apple: "Apple Calendar",
    ics: "ICS / Webcal"
  };
  return labels[provider];
}

export default function Home() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("dashboard");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [course, setCourse] = useState("");
  const [availability, setAvailability] = useState("Tue 7-9 PM free, Thu 4-6 PM free, Sunday afternoon free");
  const [timezone, setTimezone] = useState("Asia/Singapore");
  const [result, setResult] = useState<AgentResult | null>(null);
  const [draftTasks, setDraftTasks] = useState<UiTask[]>(demoTasks);
  const [savedTasks, setSavedTasks] = useState<UiTask[]>([]);
  const [approvedIds, setApprovedIds] = useState<Record<string, boolean>>(Object.fromEntries(demoTasks.map((task) => [task.id, true])));
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [selectedTaskId, setSelectedTaskId] = useState(demoTasks[0].id);
  const [reminderTaskId, setReminderTaskId] = useState(demoTasks[0].id);
  const [selectedReminderOptions, setSelectedReminderOptions] = useState(["3 days before", "1 day before", "2 hours before"]);
  const [customReminderTime, setCustomReminderTime] = useState("");
  const [manualReminders, setManualReminders] = useState<UiReminder[]>(() => mapResultToReminders(null));
  const [workSessions, setWorkSessions] = useState<UiSession[]>(() => mapResultToSessions(null));
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("Not enabled");
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>("toki");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [sentAlarmIds, setSentAlarmIds] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const storedTasks = window.localStorage.getItem(STORAGE_KEY);
      const storedReminders = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
      const storedSessions = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
      const storedProvider = window.localStorage.getItem(PROVIDER_STORAGE_KEY) as CalendarProvider | null;
      const storedSentAlarms = window.localStorage.getItem(SENT_ALARMS_STORAGE_KEY);

      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks) as UiTask[];
        if (Array.isArray(parsedTasks) && parsedTasks.length) {
          setSavedTasks(parsedTasks);
          setDraftTasks(parsedTasks);
          setSelectedTaskId(parsedTasks[0].id);
          setReminderTaskId(parsedTasks[0].id);
        }
      }
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders) as UiReminder[];
        if (Array.isArray(parsedReminders)) setManualReminders(parsedReminders);
      }
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions) as UiSession[];
        if (Array.isArray(parsedSessions)) setWorkSessions(parsedSessions);
      }
      if (storedProvider && ["toki", "google", "microsoft", "apple", "ics"].includes(storedProvider)) {
        setCalendarProvider(storedProvider);
      }
      if (storedSentAlarms) {
        const parsedSentAlarms = JSON.parse(storedSentAlarms) as Record<string, boolean>;
        if (parsedSentAlarms && typeof parsedSentAlarms === "object") setSentAlarmIds(parsedSentAlarms);
      }
    } catch {
      // Keep demo data if localStorage is unavailable or corrupted.
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedTasks));
  }, [mounted, savedTasks]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(manualReminders));
  }, [mounted, manualReminders]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(workSessions));
  }, [mounted, workSessions]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(PROVIDER_STORAGE_KEY, calendarProvider);
  }, [mounted, calendarProvider]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(SENT_ALARMS_STORAGE_KEY, JSON.stringify(sentAlarmIds));
  }, [mounted, sentAlarmIds]);

  useEffect(() => {
    if (!mounted || notificationStatus !== "Enabled for demo") return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      manualReminders.forEach((reminder) => {
        if (!reminder.sendAtIso || sentAlarmIds[reminder.id]) return;
        const sendTime = new Date(reminder.sendAtIso).getTime();
        if (!Number.isNaN(sendTime) && sendTime <= now && sendTime > now - 90_000) {
          new Notification("Toki reminder", { body: reminder.message, icon: "/icon.svg", tag: reminder.id });
          setSentAlarmIds((current) => ({ ...current, [reminder.id]: true }));
        }
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [mounted, manualReminders, notificationStatus, sentAlarmIds]);

  const tasks = savedTasks.length ? savedTasks : draftTasks;
  const sessions = workSessions;
  const reminders = manualReminders;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0];
  const reminderTask = tasks.find((task) => task.id === reminderTaskId) || tasks[0];
  const averageConfidence = Math.round(tasks.reduce((sum, task) => sum + (task.confidence ?? 0), 0) / Math.max(tasks.length, 1) * 100);
  const highCount = tasks.filter((task) => task.priority === "high").length;
  const approvedCount = draftTasks.filter((task) => approvedIds[task.id]).length;
  const warnings = result?.warnings?.length ? result.warnings : ["“Due next week” is ambiguous. Confirm before saving."];
  const calendarItems = useMemo(() => buildCalendarItems(tasks, sessions, reminders), [tasks, sessions, reminders]);
  const monthDays = useMemo(() => buildMonthGrid(calendarMonth, calendarItems), [calendarMonth, calendarItems]);
  const todayItems = calendarItems.filter((item) => item.startIso && isToday(item.startIso));
  const nextItems = calendarItems.filter((item) => item.startIso && new Date(item.startIso) >= new Date()).slice(0, 6);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (filter === "today") return isToday(task.deadline);
    if (filter === "week") return isThisWeek(task.deadline);
    if (filter === "overdue") return isOverdue(task.deadline);
    if (filter === "high") return task.priority === "high";
    return true;
  }), [filter, tasks]);

  function showScreen(screen: ScreenKey) {
    setActiveScreen(screen);
    setToast("");
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function startExtract(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    let source = file;
    if (!source && pastedText.trim()) {
      source = new File([pastedText], "pasted-lms-announcement.txt", { type: "text/plain" });
      setFile(source);
    }
    if (!source) {
      setError("Add a file or paste an announcement first.");
      return;
    }
    showScreen("loading");
    const form = new FormData();
    form.append("file", source);
    form.append("course", course);
    form.append("calendar", availability);
    form.append("timezone", timezone);
    try {
      const response = await fetch("/api/extract", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Extraction failed.");
      const nextTasks = mapResultToTasks(data, source.name);
      setResult(data);
      setDraftTasks(nextTasks);
      setSavedTasks([]);
      setWorkSessions(mapResultToSessions(data));
      setManualReminders(mapResultToReminders(data));
      setApprovedIds(Object.fromEntries(nextTasks.map((task) => [task.id, (task.confidence ?? 0) >= 0.65])));
      if (nextTasks[0]) {
        setSelectedTaskId(nextTasks[0].id);
        setReminderTaskId(nextTasks[0].id);
      }
      showScreen("review");
    } catch (err) {
      setResult(null);
      setDraftTasks(demoTasks);
      setWorkSessions(mapResultToSessions(null));
      setManualReminders(mapResultToReminders(null));
      setApprovedIds(Object.fromEntries(demoTasks.map((task) => [task.id, true])));
      setError(err instanceof Error ? err.message : "Extraction failed.");
      showScreen("review");
    }
  }

  function fillSample() {
    setPastedText(sampleText);
    setCourse("Design Studio + EM + HASS");
    setAvailability("Today 7-9 PM free, Wed 6:30-7:30 PM free, Thu 4-6 PM free, Sun 3-4 PM free");
    showToast("Sample announcement loaded.");
  }

  function openDetail(taskId?: string) {
    if (taskId) setSelectedTaskId(taskId);
    showScreen("detail");
  }

  function saveAll() {
    const confirmed = draftTasks.filter((task) => approvedIds[task.id]).map((task) => ({ ...task, status: "saved" as const }));
    setSavedTasks(confirmed);
    if (confirmed[0]) {
      setSelectedTaskId(confirmed[0].id);
      setReminderTaskId(confirmed[0].id);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(confirmed));
    showToast(`${confirmed.length} tasks saved.`);
    showScreen("tasks");
  }

  function updateTaskField(id: string, field: "title" | "course" | "deadline_text" | "required_action", value: string) {
    setDraftTasks((current) => current.map((task) => task.id === id ? { ...task, [field]: value } : task));
    setSavedTasks((current) => current.map((task) => task.id === id ? { ...task, [field]: value } : task));
  }

  function updateTaskPatch(id: string, patch: Partial<UiTask>) {
    setDraftTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
    setSavedTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  function deleteTask(id: string) {
    const task = tasks.find((item) => item.id === id);
    const nextTasks = tasks.filter((item) => item.id !== id);
    setDraftTasks((current) => current.filter((item) => item.id !== id));
    setSavedTasks((current) => current.filter((item) => item.id !== id));
    setApprovedIds((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
    if (task) {
      setManualReminders((current) => current.filter((reminder) => reminder.taskTitle !== task.title));
      setWorkSessions((current) => current.filter((session) => session.taskTitle !== task.title));
    }
    if (nextTasks[0]) {
      setSelectedTaskId(nextTasks[0].id);
      setReminderTaskId(nextTasks[0].id);
    }
    showToast("Task, related reminders, and related work sessions removed.");
    showScreen("tasks");
  }

  function updateSessionField(id: string, patch: Partial<UiSession>) {
    setWorkSessions((current) => current.map((session) => session.id === id ? { ...session, ...patch } : session));
  }

  function updateSessionTime(id: string, field: "startIso" | "endIso", value: string) {
    const iso = fromDateTimeLocal(value) || undefined;
    setWorkSessions((current) => current.map((session) => {
      if (session.id !== id) return session;
      if (field === "startIso") return { ...session, startIso: iso, start: iso ? shortLocal(iso) : "Not set" };
      return { ...session, endIso: iso, end: iso ? shortLocal(iso) : "Not set" };
    }));
  }

  function deleteSession(id: string) {
    setWorkSessions((current) => current.filter((session) => session.id !== id));
    showToast("Work session removed from the plan.");
  }

  function updateReminder(id: string, patch: Partial<UiReminder>) {
    setManualReminders((current) => current.map((reminder) => reminder.id === id ? { ...reminder, ...patch } : reminder));
  }

  function updateReminderTime(id: string, value: string) {
    const iso = fromDateTimeLocal(value);
    if (!iso) return;
    updateReminder(id, { sendAtIso: iso, sendAt: fullDate(iso) });
  }

  function deleteReminder(id: string) {
    setManualReminders((current) => current.filter((reminder) => reminder.id !== id));
    showToast("Reminder removed.");
  }

  function toggleReminderOption(option: string) {
    setSelectedReminderOptions((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  }

  function createReminders() {
    const generated = selectedReminderOptions.map((option) => buildReminder(reminderTask, option, customReminderTime)).filter((item): item is UiReminder => Boolean(item));
    setManualReminders((current) => [...current.filter((item) => item.taskTitle !== reminderTask.title), ...generated.map((item, index) => ({ ...item, id: `${item.id}-${Date.now()}-${index}` }))]);
    showToast(`${generated.length} reminders prepared.`);
  }

  function exportCalendar() {
    downloadText("toki-current-deadline-plan.ics", buildIcs(tasks, sessions, reminders), "text/calendar;charset=utf-8");
  }

  function goToMonth(delta: number) {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function openCalendarItem(item: CalendarItem) {
    if (item.taskId) setSelectedTaskId(item.taskId);
    showScreen(item.screen);
  }

  function selectProvider(provider: CalendarProvider) {
    setCalendarProvider(provider);
    showToast(`${providerLabel(provider)} selected.`);
  }

  async function copySubscriptionLink() {
    const base = window.location.origin;
    const url = `${base}/api/calendar/feed?demo=true`;
    try {
      await navigator.clipboard.writeText(url.replace(/^https?:/, "webcal:"));
      showToast("Webcal subscription link copied.");
    } catch {
      showToast("Subscription link ready: /api/calendar/feed?demo=true");
    }
  }

  function createDemoAlarm() {
    const send = new Date(Date.now() + 15_000);
    const reminder: UiReminder = {
      id: `demo-alarm-${Date.now()}`,
      taskTitle: selectedTask?.title || "Toki demo alarm",
      option: "Demo alarm",
      sendAt: fullDate(send.toISOString()),
      sendAtIso: send.toISOString(),
      message: `Demo alarm: ${selectedTask?.title || "check your deadline"}.`
    };
    setManualReminders((current) => [reminder, ...current]);
    showToast("Demo alarm scheduled in 15 seconds. Keep Toki open.");
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotificationStatus("Unsupported in this browser");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission === "granted" ? "Enabled for demo" : "Permission not granted");
  }

  function testNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      setNotificationStatus("Enable notifications first");
      return;
    }
    new Notification("Toki", { body: reminders[0]?.message || "Demo reminder: check your deadline early.", icon: "/icon.svg" });
  }

  if (!mounted) {
    return <div className="app-container" aria-hidden="true" />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <button className="logo" type="button" onClick={() => showScreen("dashboard")} aria-label="Open dashboard">
          <span className="logo-mark">T</span>
          <span>Toki</span>
        </button>
        <nav className="nav" aria-label="Main screens">
          <button className={activeScreen === "dashboard" ? "active" : ""} onClick={() => showScreen("dashboard")}>Dashboard</button>
          <button className={activeScreen === "upload" ? "active" : ""} onClick={() => showScreen("upload")}>Upload</button>
          <button className={activeScreen === "tasks" ? "active" : ""} onClick={() => showScreen("tasks")}>Tasks</button>
          <button className={activeScreen === "calendar" ? "active" : ""} onClick={() => showScreen("calendar")}>Calendar</button>
          <button className={activeScreen === "plan" ? "active" : ""} onClick={() => showScreen("plan")}>Plan</button>
          <button className={activeScreen === "reminders" ? "active" : ""} onClick={() => showScreen("reminders")}>Reminders</button>
          <button className={activeScreen === "connect" ? "active" : ""} onClick={() => showScreen("connect")}>Connect</button>
        </nav>
      </header>

      {activeScreen === "dashboard" && (
        <section className="screen active">
          <div className="stats">
            <div className="stat"><div className="num overdue">{tasks.filter((task) => isOverdue(task.deadline)).length}</div><div className="lbl">Overdue</div></div>
            <div className="stat"><div className="num today">{tasks.filter((task) => isToday(task.deadline)).length}</div><div className="lbl">Due today</div></div>
            <div className="stat"><div className="num">{tasks.filter((task) => isThisWeek(task.deadline)).length}</div><div className="lbl">This week</div></div>
            <div className="stat"><div className="num upcoming">{tasks.length}</div><div className="lbl">Upcoming</div></div>
          </div>

          <div className="grid-2">
            <div>
              <div className="section-header"><div><h3>Due Today</h3><div className="sub">Focus on the urgent few.</div></div><button className="btn btn-sm btn-primary" onClick={() => showScreen("upload")}>Add</button></div>
              {tasks.slice(0, 3).map((task) => (
                <button className="task" key={task.id} onClick={() => openDetail(task.id)}>
                  <div className="info"><div className="name">{task.title}</div><div className="course">{task.course}</div></div>
                  <div className={`due ${dueClass(task)}`}>{task.deadline ? formatDate(task.deadline) : "Date needed"}</div>
                  <span className={`badge ${priorityClass(task.priority)}`}>{task.priority || "Medium"}</span>
                </button>
              ))}
            </div>
            <div>
              <div className="section-header"><div><h3>This Week</h3><div className="sub">Extracted from announcements.</div></div></div>
              {tasks.slice(3, 6).map((task) => (
                <button className="task" key={task.id} onClick={() => openDetail(task.id)}>
                  <div className="info"><div className="name">{task.title}</div><div className="course">{task.course}</div></div>
                  <div className={`due ${dueClass(task)}`}>{task.deadline ? formatDate(task.deadline) : "Date needed"}</div>
                  <span className={`badge ${priorityClass(task.priority)}`}>{task.priority || "Medium"}</span>
                </button>
              ))}
              <div className="card-bg mini-safe"><strong>Review-first is on.</strong><p>Nothing is saved silently. Toki shows the source sentence and confidence before creating tasks.</p></div>
            </div>
          </div>

          <div className="section-spacer">
            <div className="section-header"><div><h3>Work Sessions</h3><div className="sub">Suggested, not forced.</div></div><button className="btn btn-sm btn-secondary" onClick={() => showScreen("plan")}>Open plan</button></div>
            {sessions.slice(0, 3).map((session) => (
              <div className="session" key={session.id}>
                <div className="time">{session.start}–{session.end}</div>
                <div className="title">{session.title}</div>
                <div className="goal">{session.goal}</div>
              </div>
            ))}
          </div>

          <div className="section-spacer calendar-preview">
            <div className="section-header"><div><h3>Calendar & alarms</h3><div className="sub">{providerLabel(calendarProvider)} · {notificationStatus}</div></div><div className="button-row"><button className="btn btn-sm btn-secondary" onClick={() => showScreen("calendar")}>Open calendar</button><button className="btn btn-sm btn-ghost" onClick={() => showScreen("connect")}>Connect</button></div></div>
            <div className="grid-2">
              <div className="card-bg"><strong>Today</strong><p className="tiny-copy">Deadlines, work blocks, and alarms in one place.</p>{todayItems.length ? todayItems.slice(0, 3).map((item) => <button className={`calendar-list-item ${item.kind}`} key={item.id} onClick={() => openCalendarItem(item)}><span>{shortLocal(item.startIso)}</span><strong>{item.title}</strong></button>) : <p className="tiny-copy">No calendar items today.</p>}</div>
              <div className="card-bg"><strong>Next up</strong><p className="tiny-copy">Toki reminders work inside the PWA. For closed-app alarms, connect push backend later.</p>{nextItems.slice(0, 3).map((item) => <button className={`calendar-list-item ${item.kind}`} key={item.id} onClick={() => openCalendarItem(item)}><span>{fullDate(item.startIso)}</span><strong>{item.title}</strong></button>)}</div>
            </div>
          </div>
        </section>
      )}

      {activeScreen === "upload" && (
        <section className="screen active">
          <div className="section-header"><div><h3>Upload & Extract</h3><div className="sub">Screenshot, PDF, pasted LMS text.</div></div><button className="btn btn-sm btn-secondary" onClick={() => showScreen("dashboard")}>Cancel</button></div>
          <form className="grid-2" onSubmit={startExtract}>
            <div>
              <label className="upload-zone">
                <p>{file ? file.name : <>Drop a file or <span className="hl">browse</span></>}</p>
                <div className="formats">PDF, PNG, JPG, WebP, TXT</div>
                <input type="file" accept="image/*,.pdf,.txt" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
              <div className="textarea-wrap"><textarea value={pastedText} onChange={(event) => setPastedText(event.target.value)} placeholder="Paste an announcement..." /></div>
              <div className="form-row">
                <label>Optional course/context<input value={course} onChange={(event) => setCourse(event.target.value)} placeholder="Leave blank if not shown" /></label>
                <label>Timezone<input value={timezone} onChange={(event) => setTimezone(event.target.value)} /></label>
              </div>
              <div className="textarea-wrap"><textarea value={availability} onChange={(event) => setAvailability(event.target.value)} placeholder="When are you free to work?" /></div>
              <div className="button-row"><button className="btn btn-primary" type="submit">Extract deadlines</button><button className="btn btn-ghost" type="button" onClick={fillSample}>Use sample text</button></div>
              {error && <p className="error-copy">{error}</p>}
              <p className="tiny-copy">Agnes AI extracts deadline-related actions. Toki asks you to review before saving.</p>
            </div>
            <div className="card-bg preview-card">
              <h2>Calm deadline capture.</h2>
              <p>Click <strong>Use sample text</strong>, then <strong>Extract deadlines</strong> to show the hackathon demo flow.</p>
              <div className="preview-line"><span>Detected pattern</span><strong>due Friday 11:59 PM</strong></div>
              <div className="preview-line"><span>Action</span><strong>Submit PDF + Rhino</strong></div>
              <div className="preview-line"><span>Safety</span><strong>Review before save</strong></div>
            </div>
          </form>
        </section>
      )}

      {activeScreen === "loading" && (
        <section className="screen active"><div className="loading"><div className="spinner" /><p>Extracting deadlines…</p><p className="tiny-copy">Parsing announcement for dates, actions, source evidence, and study sessions.</p></div></section>
      )}

      {activeScreen === "review" && (
        <section className="screen active">
          <div className="section-header"><div><h3>Review extracted tasks</h3><div className="sub">{approvedCount} selected · nothing saved yet</div></div><div className="button-row"><button className="btn btn-sm btn-secondary" onClick={() => showScreen("upload")}>Back</button><button className="btn btn-sm btn-primary" onClick={saveAll}>Save</button></div></div>
          {warnings.map((warning, index) => <div className="alert alert-warning" key={index}>⚠️ {warning}</div>)}
          {draftTasks.map((task) => {
            const approved = approvedIds[task.id];
            return (
              <article className={`review ${(task.confidence ?? 0) < 0.7 ? "ambiguous" : ""}`} key={task.id}>
                <div className="review-mainline">
                  <input className="title edit-title" value={task.title} onChange={(event) => updateTaskField(task.id, "title", event.target.value)} aria-label="Task title" />
                  <span className={`badge ${priorityClass(task.priority)}`}>{task.priority || "Medium"}</span>
                </div>
                <div className="meta"><span className="badge badge-low">{displayType(task.type)}</span><input value={task.course || ""} onChange={(event) => updateTaskField(task.id, "course", event.target.value)} aria-label="Course" /> · <input value={task.deadline_text || ""} onChange={(event) => updateTaskField(task.id, "deadline_text", event.target.value)} aria-label="Deadline" /> · <span className={`conf ${confidenceClass(task.confidence)}`}>{(task.confidence ?? 0).toFixed(2)}</span></div>
                <input className="edit-action" value={task.required_action || ""} onChange={(event) => updateTaskField(task.id, "required_action", event.target.value)} aria-label="Required action" />
                <div className="src">“{task.source_quote || "Source sentence not available."}”</div>
                <div className="actions"><button className="btn btn-sm btn-ghost" onClick={() => setApprovedIds((current) => ({ ...current, [task.id]: !approved }))}>{approved ? "Confirmed" : "Restore"}</button><button className="btn btn-sm btn-ghost" onClick={() => openDetail(task.id)}>Details</button>{(task.confidence ?? 0) < 0.7 && <span className="badge badge-medium">Needs confirmation</span>}</div>
              </article>
            );
          })}
        </section>
      )}

      {activeScreen === "tasks" && (
        <section className="screen active">
          <div className="section-header"><div><h3>All Tasks</h3><div className="sub">{averageConfidence}% average confidence</div></div><button className="btn btn-sm btn-secondary" onClick={exportCalendar}>Export .ics</button></div>
          <div className="filters">
            {(["all", "today", "week", "overdue", "high"] as TaskFilter[]).map((item) => <button key={item} className={filter === item ? "filter active" : "filter"} onClick={() => setFilter(item)}>{item === "week" ? "Week" : item.charAt(0).toUpperCase() + item.slice(1)}</button>)}
          </div>
          {filteredTasks.map((task) => (
            <button className="task" key={task.id} onClick={() => openDetail(task.id)}>
              <div className="info"><div className="name">{task.title}</div><div className="course">{task.course}</div></div>
              <div className={`due ${dueClass(task)}`}>{task.deadline ? formatDate(task.deadline) : "Needs date"}</div>
              <span className={`badge ${priorityClass(task.priority)}`}>{task.priority || "Medium"}</span>
              <span className={`conf ${confidenceClass(task.confidence)}`}>{(task.confidence ?? 0).toFixed(2)}</span>
            </button>
          ))}
          <ReminderSetup tasks={tasks} reminders={reminders} reminderTaskId={reminderTaskId} setReminderTaskId={setReminderTaskId} selectedReminderOptions={selectedReminderOptions} toggleReminderOption={toggleReminderOption} customReminderTime={customReminderTime} setCustomReminderTime={setCustomReminderTime} createReminders={createReminders} />
        </section>
      )}

      {activeScreen === "calendar" && (
        <section className="screen active">
          <div className="section-header">
            <div><h3>Calendar</h3><div className="sub">In-app calendar for deadlines, work blocks, and reminder alarms.</div></div>
            <div className="button-row"><button className="btn btn-sm btn-secondary" onClick={() => goToMonth(-1)}>Prev</button><button className="btn btn-sm btn-ghost" onClick={() => setCalendarMonth(new Date())}>{monthLabel(calendarMonth)}</button><button className="btn btn-sm btn-secondary" onClick={() => goToMonth(1)}>Next</button></div>
          </div>
          <div className="calendar-layout">
            <div className="calendar-card">
              <div className="calendar-weekheads"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
              <div className="calendar-grid">
                {monthDays.map((day) => (
                  <div className={`calendar-day ${day.inMonth ? "" : "muted-day"} ${day.isToday ? "today-cell" : ""}`} key={day.key}>
                    <div className="day-number">{day.date.getDate()}</div>
                    <div className="day-items">
                      {day.items.slice(0, 3).map((item) => <button key={item.id} className={`day-pill ${item.kind}`} onClick={() => openCalendarItem(item)}>{item.kind === "deadline" ? "Due" : item.kind === "session" ? "Work" : "Alarm"}: {item.title}</button>)}
                      {day.items.length > 3 && <span className="more-pill">+{day.items.length - 3} more</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="calendar-side">
              <div className="card-bg"><div className="detail-section"><h4>Today</h4></div>{todayItems.length ? todayItems.map((item) => <button className={`calendar-list-item ${item.kind}`} key={item.id} onClick={() => openCalendarItem(item)}><span>{shortLocal(item.startIso)}</span><strong>{item.title}</strong><small>{item.subtitle}</small></button>) : <p className="tiny-copy">No deadlines, work blocks, or alarms today.</p>}</div>
              <div className="card-bg section-card"><div className="detail-section"><h4>Alarm control</h4></div><p className="tiny-copy">Toki can show PWA notifications while installed/open. For reliable closed-app alarms, the next production step is Web Push + Vercel Cron/Supabase.</p><div className="button-row"><button className="btn btn-sm btn-primary" onClick={enableNotifications}>Enable alarms</button><button className="btn btn-sm btn-secondary" onClick={createDemoAlarm}>Demo alarm</button><button className="btn btn-sm btn-ghost" onClick={() => showScreen("reminders")}>Edit reminders</button></div><p className="tiny-copy">Status: {notificationStatus}</p></div>
              <div className="card-bg section-card"><div className="detail-section"><h4>External calendar</h4></div><p className="tiny-copy">Current preference: {providerLabel(calendarProvider)}</p><div className="button-row"><button className="btn btn-sm btn-secondary" onClick={() => showScreen("connect")}>Choose provider</button><button className="btn btn-sm btn-ghost" onClick={exportCalendar}>Export .ics</button></div></div>
            </div>
          </div>
        </section>
      )}

      {activeScreen === "connect" && (
        <section className="screen active">
          <div className="section-header"><div><h3>Connect calendar</h3><div className="sub">Choose how students want Toki to sign up and sync.</div></div><button className="btn btn-sm btn-secondary" onClick={() => showScreen("calendar")}>Back to calendar</button></div>
          <div className="provider-grid">
            <ProviderCard id="toki" active={calendarProvider === "toki"} title="Toki PWA only" description="Use the in-app calendar, local reminders, offline access, and installable PWA. Best for MVP demo." action="Use Toki" onSelect={selectProvider} />
            <ProviderCard id="google" active={calendarProvider === "google"} title="Google Calendar" description="Future full sync using Google OAuth: create, update, delete events and read availability." action="Choose Google" onSelect={selectProvider} />
            <ProviderCard id="microsoft" active={calendarProvider === "microsoft"} title="Microsoft / Teams" description="Future Microsoft Graph sync for Outlook calendar and Teams meeting-backed events." action="Choose Microsoft" onSelect={selectProvider} />
            <ProviderCard id="apple" active={calendarProvider === "apple"} title="Apple Calendar" description="Best web route: subscribe using webcal or download .ics. Edit inside Toki, view in Apple Calendar." action="Choose Apple" onSelect={selectProvider} />
            <ProviderCard id="ics" active={calendarProvider === "ics"} title="ICS / Webcal" description="Universal export/subscription option for most calendar apps without OAuth complexity." action="Use ICS" onSelect={selectProvider} />
          </div>
          <div className="grid-2 section-spacer">
            <div className="card-bg"><h2>{providerLabel(calendarProvider)}</h2><p className="tiny-copy">This preference is saved locally for the demo. Production signup should ask this after account creation and store it in the user profile.</p><div className="button-row"><button className="btn btn-sm btn-primary" onClick={exportCalendar}>Download latest .ics</button><button className="btn btn-sm btn-secondary" onClick={copySubscriptionLink}>Copy webcal link</button></div></div>
            <div className="card-bg"><h2>Production roadmap</h2><div className="sync-step"><strong>Google</strong><span>OAuth + Calendar API events.insert/update/delete + freebusy.</span></div><div className="sync-step"><strong>Microsoft</strong><span>OAuth + Graph Calendar + onlineMeeting for Teams-backed meetings.</span></div><div className="sync-step"><strong>Apple</strong><span>Webcal/ICS for PWA. Native EventKit only if we later build an iOS/macOS app.</span></div></div>
          </div>
        </section>
      )}

      {activeScreen === "plan" && (
        <section className="screen active">
          <div className="section-header"><div><h3>Work Plan</h3><div className="sub">Suggested, editable work blocks. You stay in control.</div></div><div className="button-row"><button className="btn btn-sm btn-ghost" onClick={() => showToast("Plan kept as suggested")}>Keep suggested</button><button className="btn btn-sm btn-secondary" onClick={exportCalendar}>Export</button></div></div>
          <div className="alert alert-warning">Calendar export is a copy. Edit here first, then export the latest plan.</div>
          {sessions.map((session) => (
            <div className="session editable-session" key={session.id}>
              <div className="form-row compact-grid">
                <label>Session title<input value={session.title} onChange={(event) => updateSessionField(session.id, { title: event.target.value })} /></label>
                <label>Linked task<select value={session.taskTitle} onChange={(event) => updateSessionField(session.id, { taskTitle: event.target.value })}>{tasks.map((task) => <option value={task.title} key={task.id}>{task.title}</option>)}</select></label>
              </div>
              <div className="form-row compact-grid">
                <label>Start<input type="datetime-local" value={toDateTimeLocal(session.startIso)} onChange={(event) => updateSessionTime(session.id, "startIso", event.target.value)} /></label>
                <label>End<input type="datetime-local" value={toDateTimeLocal(session.endIso)} onChange={(event) => updateSessionTime(session.id, "endIso", event.target.value)} /></label>
              </div>
              <label className="full-editor">Goal<textarea value={session.goal} onChange={(event) => updateSessionField(session.id, { goal: event.target.value })} /></label>
              <div className="actions"><span className="badge badge-low">Suggested</span><span className="time">{session.start}–{session.end}</span><button className="btn btn-sm btn-ghost danger-action" onClick={() => deleteSession(session.id)}>Remove</button></div>
            </div>
          ))}
        </section>
      )}

      {activeScreen === "reminders" && (
        <section className="screen active">
          <div className="section-header"><div><h3>Reminder Setup</h3><div className="sub">Pick, edit, or remove only the nudges that help.</div></div><div className="button-row"><button className="btn btn-sm btn-secondary" onClick={enableNotifications}>Enable</button><button className="btn btn-sm btn-ghost" onClick={testNotification}>Test</button></div></div>
          <div className="grid-2">
            <ReminderSetup tasks={tasks} reminders={reminders} reminderTaskId={reminderTaskId} setReminderTaskId={setReminderTaskId} selectedReminderOptions={selectedReminderOptions} toggleReminderOption={toggleReminderOption} customReminderTime={customReminderTime} setCustomReminderTime={setCustomReminderTime} createReminders={createReminders} />
            <div className="card-bg">
              <h2>Reminder preview</h2>
              <p>Status: {notificationStatus}. These reminders are editable before export. Browser notifications here are a demo only.</p>
              <div className="alert alert-warning">After importing an .ics file, calendar apps keep their own copy. To change future exports, edit reminders here and export again.</div>
              {reminders.map((reminder) => (
                <div className="reminder-card editable-reminder" key={reminder.id}>
                  <div className="form-row compact-grid">
                    <label>Reminder type<input value={reminder.option} onChange={(event) => updateReminder(reminder.id, { option: event.target.value })} /></label>
                    <label>Task<select value={reminder.taskTitle} onChange={(event) => updateReminder(reminder.id, { taskTitle: event.target.value })}>{tasks.map((task) => <option value={task.title} key={task.id}>{task.title}</option>)}</select></label>
                  </div>
                  <label>Send at<input type="datetime-local" value={toDateTimeLocal(reminder.sendAtIso)} onChange={(event) => updateReminderTime(reminder.id, event.target.value)} /></label>
                  <label className="full-editor">Message<textarea value={reminder.message} onChange={(event) => updateReminder(reminder.id, { message: event.target.value })} /></label>
                  <div className="actions"><span className="badge badge-low">{reminder.option}</span><small>{reminder.sendAt}</small><button className="btn btn-sm btn-ghost danger-action" onClick={() => deleteReminder(reminder.id)}>Remove</button></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeScreen === "detail" && selectedTask && (
        <section className="screen active">
          <div className="section-header"><div><h3>Task Detail</h3><div className="sub">Edit the task before exporting calendar events.</div></div><button className="btn btn-sm btn-secondary" onClick={() => showScreen("tasks")}>Back</button></div>
          <div className="detail-grid">
            <div>
              <div className="card-bg editor-card"><div className="detail-section"><h4>Task Information</h4></div>
                <label>Title<input value={selectedTask.title} onChange={(event) => updateTaskPatch(selectedTask.id, { title: event.target.value })} /></label>
                <label>Description<textarea value={selectedTask.description} onChange={(event) => updateTaskPatch(selectedTask.id, { description: event.target.value })} /></label>
                <div className="form-row compact-grid">
                  <label>Course<input value={selectedTask.course || ""} onChange={(event) => updateTaskPatch(selectedTask.id, { course: event.target.value })} /></label>
                  <label>Type<select value={selectedTask.type} onChange={(event) => updateTaskPatch(selectedTask.id, { type: event.target.value as UiTask["type"] })}>
                    <option value="assignment">Assignment</option>
                    <option value="submission">Submission</option>
                    <option value="exam">Exam</option>
                    <option value="form">Form</option>
                    <option value="meeting">Meeting</option>
                    <option value="class_event">Class event</option>
                    <option value="deadline">Deadline</option>
                    <option value="other">Other</option>
                  </select></label>
                </div>
                <div className="form-row compact-grid">
                  <label>Due date/time<input type="datetime-local" value={toDateTimeLocal(selectedTask.deadline)} onChange={(event) => { const iso = fromDateTimeLocal(event.target.value); updateTaskPatch(selectedTask.id, { deadline: iso, deadline_text: iso ? fullDate(iso) : "Date needed" }); }} /></label>
                  <label>Priority<select value={selectedTask.priority || "medium"} onChange={(event) => updateTaskPatch(selectedTask.id, { priority: event.target.value as UiTask["priority"] })}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select></label>
                </div>
                <label>Deliverables<input value={selectedTask.deliverables.join(", ")} onChange={(event) => updateTaskPatch(selectedTask.id, { deliverables: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
                <label>Submission / venue<input value={selectedTask.submission_method} onChange={(event) => updateTaskPatch(selectedTask.id, { submission_method: event.target.value })} /></label>
                <label>Required action<textarea value={selectedTask.required_action || ""} onChange={(event) => updateTaskPatch(selectedTask.id, { required_action: event.target.value })} /></label>
                <div className="actions"><span className={`badge ${priorityClass(selectedTask.priority)}`}>{selectedTask.priority || "Medium"}</span><span className={`conf ${confidenceClass(selectedTask.confidence)}`}>{(selectedTask.confidence ?? 0).toFixed(2)}</span><button className="btn btn-sm btn-ghost danger-action" onClick={() => deleteTask(selectedTask.id)}>Delete task</button></div>
              </div>
              <div className="card-bg section-card"><div className="detail-section"><h4>Source</h4></div>
                <div className="detail-field column"><span className="l">From announcement</span><span className="v source-quote">“{selectedTask.source_quote || "No source quote available."}”</span></div>
                <DetailField label="Document" value={selectedTask.source_document} />
                <div className="detail-field"><span className="l">Confidence</span><span className="v"><span className={`conf ${confidenceClass(selectedTask.confidence)}`}>{(selectedTask.confidence ?? 0).toFixed(2)}</span></span></div>
              </div>
            </div>
            <div>
              <div className="card-bg"><div className="detail-section"><h4>Reminders</h4></div><div className="chip-row">{reminders.filter((reminder) => reminder.taskTitle === selectedTask.title).map((reminder) => <button className="r-chip on" key={reminder.id} onClick={() => deleteReminder(reminder.id)}>{reminder.option} ×</button>)}</div><div className="button-row"><button className="btn btn-sm btn-secondary" onClick={() => { setReminderTaskId(selectedTask.id); showScreen("reminders"); }}>Manage</button></div></div>
              <div className="card-bg section-card"><div className="detail-section"><h4>Related Sessions</h4></div>{sessions.filter((session) => session.taskTitle === selectedTask.title).map((session) => <div className="session compact" key={session.id}><div className="time">{session.start}–{session.end}</div><div className="title">{session.title}</div><div className="actions"><button className="btn btn-sm btn-ghost" onClick={() => showScreen("plan")}>Edit</button><button className="btn btn-sm btn-ghost danger-action" onClick={() => deleteSession(session.id)}>Remove</button></div></div>)}</div>
              <div className="card-bg section-card"><div className="detail-section"><h4>Calendar Export</h4></div><p className="tiny-copy">Export creates or updates a calendar copy using stable IDs. Remove/edit items here before exporting the latest .ics.</p><div className="button-row"><button className="btn btn-sm btn-secondary" onClick={exportCalendar}>Export latest .ics</button><button className="btn btn-sm btn-ghost" onClick={() => showScreen("tasks")}>Done</button></div></div>
            </div>
          </div>
        </section>
      )}

      {toast && <div className="toast-wrap"><div className="toast">{toast}</div></div>}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div className="detail-field"><span className="l">{label}</span><span className="v">{value}</span></div>;
}

function ReminderSetup({ tasks, reminders, reminderTaskId, setReminderTaskId, selectedReminderOptions, toggleReminderOption, customReminderTime, setCustomReminderTime, createReminders }: {
  tasks: UiTask[];
  reminders: UiReminder[];
  reminderTaskId: string;
  setReminderTaskId: (id: string) => void;
  selectedReminderOptions: string[];
  toggleReminderOption: (option: string) => void;
  customReminderTime: string;
  setCustomReminderTime: (value: string) => void;
  createReminders: () => void;
}) {
  const options = ["3 days before", "1 day before", "Morning of deadline", "2 hours before", "Custom reminder time"];
  const task = tasks.find((item) => item.id === reminderTaskId) || tasks[0];
  return (
    <div className="reminder-block">
      <div className="section-header"><span className="name">{task?.title || "Select a task"}</span><span className="sub">{task?.deadline ? fullDate(task.deadline) : "Date not set"}</span></div>
      <label className="select-label">Task<select value={reminderTaskId} onChange={(event) => setReminderTaskId(event.target.value)}>{tasks.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <div className="chip-row">{options.map((option) => <button className={selectedReminderOptions.includes(option) ? "r-chip on" : "r-chip"} key={option} onClick={() => toggleReminderOption(option)} type="button">{option}</button>)}</div>
      {selectedReminderOptions.includes("Custom reminder time") && <input className="custom-time" type="datetime-local" value={customReminderTime} onChange={(event) => setCustomReminderTime(event.target.value)} />}
      <button className="btn btn-sm btn-primary" onClick={createReminders} type="button">Create reminders</button>
      <p className="tiny-copy">Prepared reminders: {reminders.length}. No spam — choose what feels useful.</p>
    </div>
  );
}
function ProviderCard({ id, title, description, action, active, onSelect }: {
  id: CalendarProvider;
  title: string;
  description: string;
  action: string;
  active: boolean;
  onSelect: (provider: CalendarProvider) => void;
}) {
  return (
    <article className={active ? "provider-card active" : "provider-card"}>
      <div>
        <span className="badge badge-low">{active ? "Selected" : "Available"}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <button className={active ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"} onClick={() => onSelect(id)}>{action}</button>
    </article>
  );
}

