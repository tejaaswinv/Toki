# Deadline Agent — Next Build Steps

## What was added in this version

This version moves the MVP from a static high-fidelity concept into a more demo-ready prototype.

- Review cards can now be edited inline before saving.
- Users can dismiss or restore extracted items.
- “Ignore unclear” removes low-confidence items from the save set.
- “Save confirmed tasks” persists tasks to local storage.
- Task filters now work for All, High, and This week.
- Reminder setup now lets the user choose a task and reminder options.
- The app falls back to demo data when Agnes API variables are not configured, so the hackathon demo does not break.

## Agnes AI integration path

The app calls `POST /api/extract`, which reads an uploaded screenshot/PDF/text file and then calls `callAgnes()` from `lib/agnes.ts`.

The expected Agnes endpoint shape is OpenAI-compatible:

```txt
POST {AGNES_API_BASE}/chat/completions
Authorization: Bearer {AGNES_API_KEY}
```

Once the official hackathon values are available, fill:

```txt
AGNES_API_KEY=
AGNES_API_BASE=
AGNES_MODEL=
```

If any value is blank, the app uses demo extraction output.

## Next feature priorities

### 1. Real screenshot OCR and image extraction

Current image uploads are passed to the model as a base64 image. This works only if the Agnes model supports vision input. If not, add OCR before calling Agnes.

Recommended implementation:

- Use Agnes vision model if available.
- If not available, use a browser-side or server-side OCR fallback.
- Always pass both OCR text and file metadata to the extraction prompt.

### 2. Real calendar-aware planning

Current calendar input is free-text availability. For demo, this is enough. For a stronger build:

- Connect Google Calendar.
- Read busy slots for the next 7–14 days.
- Ask Agnes to place work sessions only in free time.
- Keep sessions editable and optional.

### 3. Reminder delivery

For MVP, reminder cards are created in the UI. For real reminders:

- Store reminders in a database.
- Run a scheduled job every few minutes.
- Send reminders through email, Telegram, WhatsApp, or push notifications.
- For PWA push notifications, add service-worker push subscription storage.

### 4. Database

Use Supabase or Firebase for fastest hackathon setup.

Tables:

- users
- sources
- tasks
- work_sessions
- reminders

### 5. Demo script

1. Open dashboard.
2. Upload an LMS announcement screenshot or PDF.
3. Show extracted deadlines.
4. Point out confidence and source quote.
5. Edit one detail to show user control.
6. Dismiss an unclear item.
7. Save confirmed tasks.
8. Show generated work plan.
9. Create reminders.
10. Open task detail and show evidence.

## Pitch line

Deadline Agent is an Agnes-powered student co-pilot that turns messy LMS announcements, screenshots, PDFs, and emails into verified tasks, study plans, and reminders — without saving anything until the student reviews it.
