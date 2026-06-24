
## Best Version Notes

This build includes editable tasks, editable work sessions, editable reminders, reminder deletion, task deletion, localStorage persistence, and stable `.ics` event IDs for cleaner calendar re-imports. The package lock file is intentionally omitted so `npm install` uses the public npm registry on your machine.

# Deadline Agent — Agnes AI Hackathon MVP

An AI agent that detects assignments, exams, submissions, forms, and deadlines from screenshots, PDFs, and LMS-style announcements. It converts them into tasks, suggests work slots, and prepares reminders.

## MVP Flow

1. Student uploads an announcement screenshot, PDF, or text file.
2. The app extracts the text or sends the image to Agnes AI.
3. Agnes returns structured JSON: tasks, deadlines, study/work plan, reminders, and warnings.
4. The UI shows a task list and suggested schedule.

## Tech Stack

- Next.js app router
- Agnes AI as the LLM / vision model backend
- `pdf-parse` for text extraction from PDFs
- Simple local UI for MVP demonstration

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open the local app in your browser.

## Environment Variables

Add your Agnes AI credentials from the Agnes platform or hackathon docs:

```bash
AGNES_API_KEY=your_agnes_api_key_here
AGNES_API_BASE=https://replace-with-agnes-api-base/v1
AGNES_MODEL=replace-with-agnes-model-name
```

## Demo Script

1. Upload an LMS announcement screenshot or PDF.
2. Enter a course/context such as `2D Project`.
3. Enter availability such as `Tuesday 7-9 PM free, Thursday 4-6 PM free`.
4. Click **Extract deadlines**.
5. Show extracted tasks, deadlines, plan, and reminders.

## Next Features

- Google Calendar integration for real availability.
- Gmail integration to scan school announcements.
- LMS browser extension / share sheet.
- Push/email reminders.
- Student dashboard with task status.


## New in this version

- Built-in demo source button for safer live pitching.
- Calendar `.ics` export for deadlines, work sessions, and reminders.
- Browser notification permission + test reminder for PWA demo.
- Reminder strategy documentation in `docs/CALENDAR_AND_REMINDERS.md`.
- Hackathon demo checklist in `docs/DEMO_CHECKLIST.md`.

## Demo fallback

If Agnes AI credentials are not configured, the app returns sample extraction data so the demo flow still works.

## UI Direction Update — Toki-style MVP

This build has been updated to match the uploaded Toki planner reference UI:

- compact dark mode layout
- serif display typography
- calm green accent system
- sticky top navigation
- dense but readable task rows
- review-first deadline confirmation
- task confidence chips
- work plan cards that feel suggested, not forced
- reminder setup with gentle nudges
- PWA files retained for installable demo use

Recommended demo flow:

1. Open Dashboard.
2. Go to Upload.
3. Click **Use sample text**.
4. Click **Extract deadlines**.
5. Review confidence and source sentences.
6. Save confirmed tasks.
7. Show Tasks, Plan, Reminders, and Task Detail.
8. Export `.ics` calendar file.


## Source fidelity update

The extraction prompt is strict: Toki should not invent course names, venues, meeting links, agendas, submission methods, or deliverables. If a meeting invite does not show a location, the app shows `No venue provided` and asks the student to verify before saving.

## PWA + Calendar Build

This version is installable as a PWA and now includes an in-app calendar + calendar provider preference flow. It includes:

- Web app manifest
- Service worker
- Offline fallback screen
- Install prompt
- Maskable icons
- Apple home-screen metadata
- In-app calendar month view
- Toki PWA alarms/reminder demo
- Calendar provider preference screen: Toki, Google, Microsoft/Teams, Apple, ICS/Webcal
- Demo webcal feed route at `/api/calendar/feed?demo=true`

To test the PWA behavior, run production mode:

```bash
npm run build
npm start
```

Then open `http://localhost:3000` and check Chrome DevTools → Application → Manifest / Service Workers.

## New in calendar build

- Added **Calendar** screen with month view.
- Added **Connect** screen for choosing Toki / Google / Microsoft / Apple / ICS.
- Added demo PWA alarm flow. Click **Enable alarms**, then **Demo alarm**.
- Added service worker push/notification click scaffold.
- Fixed Next.js manifest typing by using `purpose: "maskable"`.
- See `docs/IN_APP_CALENDAR_AND_SYNC.md` for the sync architecture.
