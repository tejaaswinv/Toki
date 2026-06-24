# Deadline Agent Demo Checklist

## Before demo

- Run `npm install`
- Run `cp .env.example .env.local`
- Add Agnes AI credentials if available
- Run `npm run dev`
- Keep one real LMS screenshot or PDF ready
- Keep the built-in demo source as backup

## Demo route

1. Open Dashboard
2. Say: "Students miss deadlines because important tasks are buried in messy LMS announcements, PDFs, emails, and screenshots."
3. Go to Upload
4. Upload a source or click **Use demo source**
5. Click **Extract deadlines**
6. Open Review
7. Point out confidence, source quote, edit controls, and dismiss/restore
8. Save confirmed tasks
9. Open Task List
10. Export `.ics` calendar file
11. Open Work Plan
12. Show suggested sessions as editable recommendations
13. Open Reminder Setup
14. Create reminders, enable browser notifications, and send test reminder
15. Open Task Detail
16. Show evidence, confidence, source document, deliverables, reminders, and sessions

## Judge-facing lines

- **Problem understanding:** Students do not need another to-do app; they need deadlines extracted from where announcements already live.
- **Innovation:** The agent does not just summarize. It converts messy sources into structured tasks, plans, reminders, and calendar events.
- **Feasibility:** The MVP uses file upload, structured JSON extraction, local persistence, PWA installability, and `.ics` export.
- **Safety:** Nothing is saved automatically. The student reviews every deadline before confirming.
