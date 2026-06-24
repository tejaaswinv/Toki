export type ExtractedItem = {
  title: string;
  type: "assignment" | "exam" | "submission" | "form" | "meeting" | "deadline" | "class_event" | "other";
  course?: string | null;
  deadline?: string | null;
  deadline_text?: string | null;
  required_action?: string | null;
  source_quote?: string | null;
  estimated_effort_hours?: number | null;
  priority?: "high" | "medium" | "low" | null;
  confidence?: number | null;
};

export type WorkPlanSlot = {
  task_title: string;
  start: string;
  end: string;
  reason?: string | null;
};

export type Reminder = {
  task_title: string;
  send_at: string;
  message: string;
};

export type AgentResult = {
  items: ExtractedItem[];
  study_plan: WorkPlanSlot[];
  reminders: Reminder[];
  warnings: string[];
};
