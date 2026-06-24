# Toki In-App Calendar and Calendar Sync

This version adds a first-class calendar inside the PWA.

## What is included now

- Calendar screen with month grid.
- Deadline, work-session, and reminder event types.
- Today panel and next-up panel.
- Click a calendar item to jump to task details, work plan, or reminders.
- Editable reminders and work sessions.
- Browser notification permission flow.
- Demo alarm that fires after 15 seconds while Toki is open.
- Saved calendar provider preference: Toki, Google, Microsoft, Apple, or ICS/Webcal.
- Downloadable `.ics` export.
- Demo `webcal`/ICS feed route at `/api/calendar/feed?demo=true`.

## Important PWA reminder limitation

A PWA cannot reliably wake itself at an exact future time using only frontend JavaScript. The current demo alarm works when the app is open/installed and notifications are enabled.

For production-quality alarms when the app is closed, add:

1. User accounts.
2. Database tables for tasks, reminders, calendar connections, and push subscriptions.
3. Web Push subscription flow.
4. Vercel Cron or another scheduled worker that checks due reminders.
5. A push sender using VAPID keys.
6. Service worker `push` listener, already scaffolded in `public/sw.js`.

## Calendar provider strategy

### Toki PWA only

Use Toki as the student's main calendar. Good for hackathon demo and works without OAuth.

### Google Calendar

Production plan:

- Sign in with Google OAuth.
- Store Google refresh token securely.
- Create deadline events and work sessions using Google Calendar API.
- Store Google event IDs against Toki task/session IDs.
- Update/delete Google events when the user edits/deletes in Toki.
- Use free/busy data to plan work sessions.

### Microsoft Outlook / Teams

Production plan:

- Sign in with Microsoft OAuth.
- Use Microsoft Graph Calendar events.
- For Teams meeting support, create calendar-backed online meetings rather than standalone meetings.
- Store Microsoft event IDs against Toki task/session IDs.
- Update/delete synced events when Toki changes.

### Apple Calendar

Best PWA approach:

- `.ics` download.
- `webcal` subscription link.

Apple native write access requires a native iOS/macOS app using EventKit, so it should be a later native-app feature rather than part of the web MVP.

## Demo script

1. Upload or use sample text.
2. Extract deadlines.
3. Save tasks.
4. Open Calendar.
5. Show due dates, work blocks, and reminders in the month view.
6. Enable alarms and click Demo alarm.
7. Open Connect and choose Google/Microsoft/Apple/ICS preference.
8. Export `.ics` or copy the webcal link.
