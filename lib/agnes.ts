import { AgentResult } from "./types";

type ChatMessage = {
  role: "system" | "user";
  content: string | Array<Record<string, unknown>>;
};

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

function demoResult(): AgentResult {
  const now = new Date();
  const friday = new Date(now);
  const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(23, 59, 0, 0);

  const thursdaySessionStart = new Date(friday);
  thursdaySessionStart.setDate(friday.getDate() - 1);
  thursdaySessionStart.setHours(16, 0, 0, 0);
  const thursdaySessionEnd = new Date(thursdaySessionStart);
  thursdaySessionEnd.setHours(18, 0, 0, 0);

  const fridaySessionStart = new Date(friday);
  fridaySessionStart.setHours(19, 0, 0, 0);
  const fridaySessionEnd = new Date(fridaySessionStart);
  fridaySessionEnd.setHours(20, 0, 0, 0);

  const oneDayBefore = new Date(friday);
  oneDayBefore.setDate(friday.getDate() - 1);
  oneDayBefore.setHours(9, 0, 0, 0);

  const twoHoursBefore = new Date(friday);
  twoHoursBefore.setHours(friday.getHours() - 2, friday.getMinutes(), 0, 0);

  return {
    items: [
      {
        title: "2D Project Final Submission",
        type: "submission",
        course: "2D Design",
        deadline: friday.toISOString(),
        deadline_text: "Friday, 11:59 PM",
        required_action: "Submit final PDF, source files, and process board before the LMS closes.",
        source_quote: "Your 2D project submission is due Friday at 11:59 PM. Upload final files to LMS.",
        estimated_effort_hours: 4,
        priority: "high",
        confidence: 0.92
      },
      {
        title: "Studio Peer Review Form",
        type: "form",
        course: "Design Studio",
        deadline: new Date(friday.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        deadline_text: "Saturday, 12:00 PM",
        required_action: "Complete the peer review form after checking groupmates’ submissions.",
        source_quote: "Please complete the peer review form by Saturday noon.",
        estimated_effort_hours: 0.5,
        priority: "medium",
        confidence: 0.81
      }
    ],
    study_plan: [
      {
        task_title: "2D Project Final Submission",
        start: thursdaySessionStart.toISOString(),
        end: thursdaySessionEnd.toISOString(),
        reason: "Final edits and prepare files for submission."
      },
      {
        task_title: "2D Project Final Submission",
        start: fridaySessionStart.toISOString(),
        end: fridaySessionEnd.toISOString(),
        reason: "Upload early, verify files, and keep a screenshot of confirmation."
      }
    ],
    reminders: [
      {
        task_title: "2D Project Final Submission",
        send_at: oneDayBefore.toISOString(),
        message: "2D project is due tomorrow. Plan one final edit session and check your submission files."
      },
      {
        task_title: "2D Project Final Submission",
        send_at: twoHoursBefore.toISOString(),
        message: "2D project is due in 2 hours. Upload now if your files are ready."
      }
    ],
    warnings: ["Demo mode is active because Agnes API environment variables are not configured."]
  };
}

export async function callAgnes(messages: ChatMessage[]): Promise<AgentResult> {
  const apiKey = optionalEnv("AGNES_API_KEY");
  const base = optionalEnv("AGNES_API_BASE")?.replace(/\/$/, "");
  const model = optionalEnv("AGNES_MODEL");

  if (!apiKey || !base || !model) {
    return demoResult();
  }

  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Agnes API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Agnes returned an empty or unsupported response.");
  }

  const parsed = extractJson(content) as AgentResult;
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
    study_plan: Array.isArray(parsed.study_plan) ? parsed.study_plan : [],
    reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : []
  };
}
