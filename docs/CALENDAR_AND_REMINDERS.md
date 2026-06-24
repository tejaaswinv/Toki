# Calendar Export and Reminder Strategy

## What this version adds

This version adds demo-friendly reminder and calendar capabilities without requiring a backend database yet.

### 1. Downloadable calendar file

Users can export a `.ics` calendar file containing:

- Deadline events
- Suggested work sessions
- Reminder events
- A 2-hour alarm attached to deadline events

This is useful for the hackathon demo because it proves the product can move from AI extraction into the student's actual workflow.

### 2. Browser notification demo

The Reminder Setup screen includes:

- Enable browser notifications
- Send test reminder

This demonstrates the reminder experience immediately. It is intentionally labelled as demo behaviour because reliable scheduled reminders need a backend scheduler or push notification service.

## Recommended production reminder architecture

For a real version, use:

1. Database table for reminders
2. Scheduled worker or cron job
3. Delivery channel: email, Telegram, WhatsApp, or PWA push notification
4. Reminder status tracking: pending, sent, failed, cancelled

## Minimal database schema

```sql
reminders (
  id uuid primary key,
  user_id uuid,
  task_id uuid,
  send_at timestamptz,
  channel text,
  message text,
  status text,
  created_at timestamptz
)
```

## Demo talking point

"For the MVP, Deadline Agent exports confirmed tasks and work blocks into the student's calendar. The notification buttons demonstrate how reminders will feel, while a production version would use a scheduled backend job for reliable delivery."
