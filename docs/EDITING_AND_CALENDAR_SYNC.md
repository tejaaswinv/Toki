# Editing Tasks, Work Sessions, Reminders, and Calendar Exports

This version of Toki supports a full MVP-level edit flow before calendar export.

## What users can edit

### Tasks
Open a task from the Tasks screen, then edit:

- title
- description
- course
- task type
- due date/time
- priority
- deliverables
- submission method
- required action

Deleting a task also removes related reminders and work sessions inside Toki.

### Work sessions
Open the Plan screen to edit:

- session title
- linked task
- start time
- end time
- goal

Work sessions remain suggestions. Users can remove or change them freely.

### Reminders
Open the Reminders screen to:

- create reminders from preset chips
- edit reminder type
- edit linked task
- edit send time
- edit reminder message
- remove reminders

Browser notifications in this MVP are only a demo. Real scheduled reminders need a backend scheduler, push service, or calendar integration.

## Calendar export behavior

The `.ics` export includes:

- deadline events
- suggested work sessions
- reminder events
- stable event UIDs for cleaner re-import/update behavior

Important limitation: importing an `.ics` file creates a copy inside the user's calendar app. If the user removes an item in Toki after importing, it may not automatically delete the already-imported calendar event. For the MVP, the safest wording is:

> Edit your tasks, work sessions, and reminders in Toki first. Then export the latest calendar file.

## Future production upgrade

Use the Google Calendar API or Microsoft Graph Calendar API for true sync:

- create event
- update event
- delete event
- store calendar event IDs
- background reminder scheduler
