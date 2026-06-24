# Deadline Agent MVP UI Design System

## Product Positioning

**Product name:** Deadline Agent  
**Tagline:** Turn messy announcements into clear next steps.  
**Core promise:** Students stay in control. The AI extracts deadlines, explains uncertainty, suggests plans, and asks for review before saving anything.

## Why PWA

Build the MVP as a lightweight PWA. It is valuable for a student deadline tool because students can install it on their phone, open it quickly before or after class, view cached tasks, and later receive reminder notifications. For the hackathon demo, implement installability and an offline fallback first. Add real push notifications only after the core extraction flow works.

## Design Principles

1. **Review before save:** The AI should never silently create tasks.
2. **Calm urgency:** Use priority to guide attention, not create anxiety.
3. **Confidence is visible:** Make uncertain extractions obvious and editable.
4. **Suggested, not forced:** Work sessions are recommendations, not commands.
5. **One action per screen:** Avoid dashboards filled with too many panels.
6. **Dark, spacious, demo-ready:** Use deep backgrounds, glass cards, generous spacing, and crisp typography.

## Visual Direction

- **Theme:** Dark mode by default.
- **Mood:** Calm, intelligent, premium, student-friendly.
- **Style:** Glassmorphism panels, soft blue/purple gradients, rounded cards, high contrast text.
- **Avoid:** Cartoon clutter, too many charts, warning-heavy red UI, dense tables.

## Color Tokens

| Token | Hex | Usage |
|---|---:|---|
| Background | `#070712` | App base |
| Background 2 | `#0B1020` | Secondary gradient base |
| Panel | `rgba(18, 24, 43, 0.78)` | Main cards |
| Text | `#F7F7FF` | Primary text |
| Muted | `#A5ABC3` | Supporting text |
| Accent Purple | `#8B5CF6` | Primary action, active nav |
| Accent Cyan | `#35D5FF` | AI/evidence highlight |
| Success | `#43E6A1` | High confidence, completed |
| Warning | `#FFCA68` | Medium confidence, review needed |
| Danger | `#FF6B8A` | High priority, unclear deadline |

## Typography

- **Font:** Inter or system sans-serif.
- **Hero title:** 64–76px desktop, tight letter spacing.
- **Section title:** 32–42px.
- **Card title:** 18–22px.
- **Body:** 15–16px, line height 1.6.
- **Labels:** 12px uppercase with letter spacing.

## Component System

### Primary Button
Use for one major action per screen.

Examples:
- Upload source
- Extract deadlines
- Save confirmed tasks
- Create reminders

### Secondary Button
Use for safe alternatives.

Examples:
- See work plan
- Regenerate plan
- Edit task

### Ghost Button
Use for low-pressure actions.

Examples:
- View details
- Dismiss
- Edit session

### Confidence Chip
Show both score and interpretation.

- `85–100%`: High confidence
- `65–84%`: Needs quick check
- `<65%`: Unclear

### Priority Chip
- High: danger chip
- Medium: warning chip
- Low: success/neutral chip

### Review Card
Must include:
- Task title
- Required action
- Due date/time
- Source sentence
- Confidence score
- Edit and dismiss controls

### Work Session Card
Must include:
- Session title
- Linked task
- Start time
- End time
- Goal
- Edit button

### Reminder Option Row
Options:
- 3 days before
- 1 day before
- Morning of deadline
- 2 hours before
- Custom reminder time

## Screens

### 1. Dashboard
Purpose: Give the student a clear snapshot.

Must show:
- Today’s focus card
- Number of detected tasks
- High priority count
- Average confidence
- Upcoming timeline
- Safety note: “Review-first workflow is on.”

Primary CTA: Upload source  
Secondary CTA: See work plan

### 2. Upload Flow
Purpose: Let the student provide a source with minimal friction.

Must show:
- Drag-and-drop upload card
- Supported formats: PDF, PNG, JPG, TXT
- Course/context field
- Availability field
- Timezone field
- Extract deadlines button

Copy:
> Use a screenshot, PDF, or copied LMS text. The agent extracts only deadline-related actions.

### 3. Extraction Review
Purpose: Make the AI feel safe and controlled.

Must show:
- “We found X possible deadlines”
- Review-first reassurance
- Each extracted item as a card
- Confidence ring
- Source quote
- Edit, dismiss, save controls

Copy:
> Nothing is added automatically. Check the date, action, and confidence first.

### 4. Task List
Purpose: Show confirmed deadlines clearly.

Must show:
- Filters: All, High, This week
- Task cards with title, action, course, due date, priority, confidence
- View details button

### 5. Work Plan
Purpose: Suggest practical work blocks before deadlines.

Must show:
- Suggested sessions
- Linked task
- Start and end time
- Goal
- Edit button
- Regenerate plan button

Copy:
> These are calm suggestions based on deadline urgency and your availability. Move, edit, or delete any session.

Example:
> Thursday 4:00–6:00 PM: Final edits and prepare files for submission.

### 6. Reminder Setup
Purpose: Let users create reminders per task.

Must show:
- Reminder options
- Message preview
- Create reminders button
- Clear anti-spam copy

Copy:
> No spam. Pick only the nudges that will help you act early.

### 7. Task Detail
Purpose: Give full transparency for one task.

Must show:
- Title
- Description
- Course
- Task type
- Due date
- Due time
- Status
- Priority
- Deliverables
- Submission method
- Source sentence
- Source document
- Confidence score
- Reminders
- Suggested work sessions

## MVP Navigation

Use left sidebar tabs for hackathon demo clarity:

1. Dashboard
2. Upload
3. Review
4. Tasks
5. Work Plan
6. Reminders
7. Task Detail

## PWA MVP Scope

Include now:
- Web app manifest
- App icon
- Installable display mode
- Offline fallback page
- Cache app shell

Later:
- Push notifications
- Calendar sync
- LMS login integrations
- Background deadline scans
- Cross-device sync
