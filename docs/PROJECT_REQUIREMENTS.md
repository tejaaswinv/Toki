# Project Requirements — Deadline Agent

## Project Name
Deadline Agent

## Problem Statement
Students often miss important academic deadlines because announcements are scattered across emails, PDFs, screenshots, forms, and LMS pages. Deadline Agent uses Agnes AI to detect deadlines and convert them into an actionable plan.

## Target Users
- University students
- Club/project teams
- Students balancing assignments, exams, and forms

## Core MVP Requirements

### 1. Upload Input
Users can upload:
- Announcement screenshots
- PDF notices
- Text-based LMS announcements

### 2. AI Deadline Extraction
The system extracts:
- Assignment or task title
- Type: assignment, exam, submission, form, deadline, class event, or other
- Course/context
- Due date and time
- Required action
- Source quote
- Confidence score

### 3. Task List Creation
The app displays each extracted deadline as a task card with priority and verification quote.

### 4. Study / Work Plan
The agent suggests work slots based on user-provided availability.

Example: `Your 2D project submission is due Friday. Work on it Tuesday 7–9 PM and Thursday 4–6 PM.`

### 5. Reminders
The app generates reminder messages and suggested reminder timings.

## Non-Functional Requirements
- Must be fast enough for a live hackathon demo.
- Must show source quotes to reduce AI hallucination risk.
- Must handle unclear dates gracefully.
- Must not automatically submit anything on behalf of the student.

## Success Metrics
- Extracts deadlines correctly from at least 3 different sample announcements.
- Generates a useful task plan within 30 seconds.
- Shows uncertainty when the source is ambiguous.
- Demo is clear within 2 minutes.

## Future Scope
- Gmail scanning
- Google Calendar integration
- LMS page extension
- Push notifications
- Task completion tracking
