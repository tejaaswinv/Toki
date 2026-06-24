import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { callAgnes } from "../../../lib/agnes";

export const runtime = "nodejs";
export const maxDuration = 60;

type UploadInfo = {
  mode: "text" | "image";
  text?: string;
  imageDataUrl?: string;
  filename: string;
  mime: string;
};

async function fileToUploadInfo(file: File): Promise<UploadInfo> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";

  if (mime.includes("pdf") || file.name.toLowerCase().endsWith(".pdf")) {
    const parsed = await pdfParse(bytes);
    return {
      mode: "text",
      text: parsed.text.slice(0, 20000),
      filename: file.name,
      mime
    };
  }

  if (mime.startsWith("image/")) {
    return {
      mode: "image",
      imageDataUrl: `data:${mime};base64,${bytes.toString("base64")}`,
      filename: file.name,
      mime
    };
  }

  return {
    mode: "text",
    text: bytes.toString("utf8").slice(0, 20000),
    filename: file.name,
    mime
  };
}

function systemPrompt(todayIso: string) {
  return `You are Deadline Agent, an AI assistant for students.
Today's date/time is ${todayIso}.

Your job:
1. Detect assignments, exams, submissions, forms, meetings, LMS announcements, and deadlines.
2. Extract only actionable student tasks.
3. Normalize deadline dates to ISO 8601 when possible.
4. Use source quotes so the student can verify your extraction.
5. If date/time is ambiguous, keep deadline null and explain in warnings.
6. Create a realistic work or study plan using the user's calendar availability.
7. Create reminder messages before each deadline.

Strict evidence rules:
- Do NOT invent course, venue, room, meeting link, platform, submission method, deliverables, or agenda.
- If the source does not explicitly show a course, return course as null.
- Use the user's Course/context only as optional background. Do not force it into the extracted item unless the source clearly belongs to that course.
- If the source is a meeting invite or booking confirmation, use type "meeting", not "class_event".
- If the source does not show a venue/location/join link, do not mention any venue. Add a warning such as "Meeting location or join link was not provided."
- Source quotes must be short exact text copied from the uploaded source. Do not paraphrase inside source_quote.
- Confidence should drop when important fields are missing or inferred.

Return ONLY valid JSON with this exact shape:
{
  "items": [
    {
      "title": "string",
      "type": "assignment|exam|submission|form|meeting|deadline|class_event|other",
      "course": "string or null",
      "deadline": "ISO 8601 string or null",
      "deadline_text": "original deadline phrase or null",
      "required_action": "string or null",
      "source_quote": "short exact quote from the source or null",
      "estimated_effort_hours": 0,
      "priority": "high|medium|low",
      "confidence": 0.0
    }
  ],
  "study_plan": [
    {
      "task_title": "string",
      "start": "ISO 8601 string",
      "end": "ISO 8601 string",
      "reason": "string"
    }
  ],
  "reminders": [
    {
      "task_title": "string",
      "send_at": "ISO 8601 string",
      "message": "string"
    }
  ],
  "warnings": ["string"]
}`;
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const course = String(form.get("course") || "");
    const calendar = String(form.get("calendar") || "");
    const timezone = String(form.get("timezone") || "Asia/Singapore");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a screenshot, image, PDF, or text file." }, { status: 400 });
    }

    const upload = await fileToUploadInfo(file);
    const todayIso = new Date().toISOString();
    const userContext = `Course/context: ${course || "Not specified"}\nUser timezone: ${timezone}\nCalendar availability or busy slots: ${calendar || "Not provided. Make conservative suggestions."}\nUploaded file: ${upload.filename} (${upload.mime})`;

    const messages: Parameters<typeof callAgnes>[0] = [
      { role: "system", content: systemPrompt(todayIso) }
    ];

    if (upload.mode === "image") {
      messages.push({
        role: "user" as const,
        content: [
          { type: "text", text: `${userContext}\n\nRead the screenshot/image carefully and extract deadlines or meetings. Follow the strict evidence rules exactly: if a course, venue, meeting link, or agenda is not visible, return it as missing/unknown and warn the user.` },
          { type: "image_url", image_url: { url: upload.imageDataUrl } }
        ]
      });
    } else {
      messages.push({
        role: "user" as const,
        content: `${userContext}\n\nDocument text:\n${upload.text || ""}`
      });
    }

    const result = await callAgnes(messages);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
