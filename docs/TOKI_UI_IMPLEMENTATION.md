# Toki UI Implementation Notes

The app now follows the uploaded Toki planner taste reference.

## Visual system

- Dark moss/charcoal background using OKLCH variables.
- Soft green accent for positive actions and calm highlights.
- Compact cards, thin borders, and low visual noise.
- Serif display typography for headings and brand personality.
- System sans-serif for UI readability.
- Small monospace chips for confidence values.

## Screens implemented

- Dashboard
- Upload and extract
- Loading state
- Extraction review
- Task list
- Work plan
- Reminder setup
- Task detail

## Product behavior

- The AI extracts deadlines from file uploads or pasted text.
- Every extracted task shows source evidence and confidence.
- Users confirm or dismiss before saving.
- Low-confidence items are highlighted as ambiguous.
- Work sessions are labelled as suggestions.
- Reminders can be selected per task.
- Calendar `.ics` export remains available.
- PWA files are retained for installable demo flow.
