# System Specification Document: StudySync Academic & Routine Management Platform

**Document Version:** 1.0.0  
**Status:** Draft / Proposed Architecture  
**Target Platform:** Web Application (Responsive Desktop & Mobile) / PWA  

---

## 1. Executive Summary & Objectives

### 1.1 Overview
**StudySync** is a comprehensive academic management and daily routine scheduling web application designed specifically for university students. The platform unifies deadline tracking (quizzes, assignments, midterm/final papers) with an intelligent study schedule generator, course analytics, and attendance tracking to prevent academic burnout and maximize productivity.

### 1.2 Key Objectives
* **Centralize Deadlines:** Eliminate missed assignments and surprise quizzes with automated, multi-tiered reminders.
* **Optimize Daily Study Routines:** Smartly convert remaining course requirements into manageable daily study blocks using workload-balancing algorithms.
* **Enhance Academic Visibility:** Provide clear visual insights into course weightage, grade targets, and daily time usage.

---

## 2. Core Functional Requirements

### 2.1 Reminders & Assessment Tracking (User Required)
* **Assessment Categorization:** Support for Quizzes, Homework Assignments, Lab Reports, Midterm Exams, Final Papers, and Group Projects.
* **Flexible Deadline Configuration:** Date, exact time, submission portal link (e.g., Canvas, Blackboard, Moodle), and weightage percentage towards final grade.
* **Multi-Channel Notifications:**
  * **Browser / PWA Push Notifications:** 24h, 3h, and 1h prior to deadlines.
  * **Email Alerts:** Daily summary digest sent every morning at 7:00 AM.
  * **Optional Third-Party Webhooks:** Integration with Discord, Telegram, or WhatsApp for instant notification alerts.
* **Submission Status Tracking:** Multi-state task workflows (*Not Started*, *In Progress*, *Submitted*, *Graded*).

### 2.2 Daily Routine & Study Schedule Planner (User Required)
* **Fixed Timetable vs. Dynamic Study Slots:**
  * **Fixed Schedule:** Import/Input weekly class lectures, lab sessions, sleep hours, meal times, and personal commitments.
  * **Dynamic Study Blocks:** Automatically fill remaining open time slots with scheduled study blocks based on pending assignment urgency and paper difficulty.
* **Integrated Pomodoro & Focus Timer:**
  * Built-in focus session timer (25/5 or customizable intervals).
  * Task-linked focus sessions to track exact hours spent per course or paper draft.
* **Routine Templates:** Ability to toggle between *Standard Week*, *Exam Season*, and *Holiday/Break* daily routines.

---

## 3. Additional & Value-Added Features (Identified Requirements)

### 3.1 Course & Attendance Management
* **Course Hub:** Store course codes, instructor emails, office hours, syllabus attachments, and grading criteria.
* **Attendance Counter & Threshold Warnings:** Track present/absent days against university mandatory attendance policies (e.g., alert if attendance drops near 75%).

### 3.2 GPA Predictor & "What-If" Grade Analytics
* **Grade Weight Calculator:** Input achieved marks to calculate current course standing.
* **"What-If" Scenario Engine:** Calculate required scores on upcoming quizzes/final papers to maintain or achieve a target GPA.

### 3.3 Two-Way Calendar Synchronization
* Real-time `.ics` subscription feeds and direct OAuth integration with Google Calendar, Apple Calendar, and Microsoft Outlook.

### 3.4 Syllabus Breakdown & Sub-Task Generator
* Break complex final papers and large assignments into auto-scheduled sub-tasks (e.g., *Literature Review* -> *First Draft* -> *Proofreading* -> *Final Submission*).

### 3.5 Course Resource & Past Paper Archive
* Attach study material links, digital notes (Notion/Google Docs links), and past exam paper references directly to specific courses or exam entries.

---

## 4. System Architecture & Tech Stack

```
           +---------------------------------------------------+
           |                  React / Next.js                  |
           |             (TypeScript, Tailwind CSS)            |
           +-------------------------+-------------------------+
                                     |
                                     v
           +---------------------------------------------------+
           |                 REST / GraphQL API                |
           |              (Node.js / Express or FastAPI)       |
           +------------+-------------------------+------------+
                        |                         |
                        v                         v
           +------------------------+  +-----------------------+
           | PostgreSQL Database    |  | Redis Queue (BullMQ)  |
           | (User Data, Schedules) |  | (Notification Engine) |
           +------------------------+  +-----------------------+
```

| Component | Recommended Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (React / TypeScript) | Server-Side Rendering (SSR) for speed, excellent PWA support. |
| **UI Library** | Tailwind CSS + Shadcn UI / Lucide | Modern, accessible, lightweight component styling. |
| **State & Calendar** | TanStack Query + FullCalendar.js | High-performance calendar drag-and-drop & asynchronous data sync. |
| **Backend API** | Node.js (NestJS) or Python (FastAPI) | Asynchronous task handling, clean routing architecture. |
| **Database** | PostgreSQL + Prisma ORM | Relational integrity for complex schedules, user settings, and courses. |
| **Background Jobs** | Redis + BullMQ / Celery | Reliable scheduled notification dispatching and calendar syncing. |
| **Authentication** | NextAuth.js / Supabase Auth | Supports Email/Password, Google OAuth, and SAML/SSO. |

---

## 5. Database Data Schema (Conceptual)

### 5.1 `users`
* `id` (UUID, Primary Key)
* `email` (String, Unique)
* `name` (String)
* `target_gpa` (Float)
* `created_at` (Timestamp)

### 5.2 `courses`
* `id` (UUID, Primary Key)
* `user_id` (Foreign Key -> users.id)
* `course_code` (String, e.g., "CS301")
* `course_name` (String)
* `color_hex` (String)
* `credit_hours` (Integer)

### 5.3 `academic_tasks`
* `id` (UUID, Primary Key)
* `course_id` (Foreign Key -> courses.id)
* `title` (String)
* `type` (Enum: `QUIZ`, `ASSIGNMENT`, `PAPER`, `MIDTERM`, `FINAL`)
* `due_date` (Timestamp)
* `weight_percentage` (Float)
* `status` (Enum: `PENDING`, `IN_PROGRESS`, `SUBMITTED`, `GRADED`)
* `grade_achieved` (Float, Nullable)

### 5.4 `study_schedules`
* `id` (UUID, Primary Key)
* `user_id` (Foreign Key -> users.id)
* `title` (String)
* `start_time` (Timestamp)
* `end_time` (Timestamp)
* `is_recurring` (Boolean)
* `related_task_id` (Foreign Key -> academic_tasks.id, Nullable)

---

## 6. Key User Interface Screens

1. **Dashboard Overview:**
   * High-level summary of upcoming items in the next 24 hours.
   * Daily progress bar (Tasks completed vs. study hours remaining).
   * Current estimated GPA widget.
2. **Interactive Schedule Matrix (Calendar View):**
   * Combined timetable displaying fixed classes, dynamic study blocks, and hard deadlines.
   * Drag-and-drop adjustment of study slots.
3. **Task & Deadline Hub:**
   * Kanban board view or list view with sorting by due date, weightage, or course.
4. **Course Detail & Resource Repository:**
   * Individual course breakdown showing syllabus, grade breakdown, attendance history, and past papers.
5. **Focus Timer / Study Mode:**
   * Distraction-free full-screen timer with optional ambient sound background and active task tracker.

---

## 7. Implementation Roadmap

```
+-------------------------------------------------------------------+
| Phase 1: MVP Core (Weeks 1 - 4)                                   |
| - Authentication & User Profiles                                  |
| - Course Setup & Academic Task Management (Quizzes/Assignments)   |
| - Basic Fixed Weekly Timetable & Task Checklist                   |
| - Email & Browser Push Reminders                                  |
+-------------------------------------------------------------------+
                                 |
                                 v
+-------------------------------------------------------------------+
| Phase 2: Smart Scheduling & Integrations (Weeks 5 - 8)            |
| - Dynamic Study Slot Auto-allocation                              |
| - Two-Way Google Calendar / Apple Calendar Sync                   |
| - Built-in Focus Timer & Study Session Analytics                  |
+-------------------------------------------------------------------+
                                 |
                                 v
+-------------------------------------------------------------------+
| Phase 3: Advanced Analytics & Collaboration (Weeks 9 - 12)        |
| - GPA "What-If" Calculator & Target Tracker                       |
| - Attendance Tracker with Minimum-Policy Alerts                   |
| - Group Study / Shared Project Deadlines                          |
+-------------------------------------------------------------------+
```

---

## 8. Non-Functional & Quality Requirements

* **Performance:** Dashboard load time under 1.2 seconds; instantaneous notification queue triggering.
* **Reliability:** Background job retry policies for failed notification dispatches.
* **Usability:** Mobile-first responsive UX with dark mode support.
* **Security:** End-to-end HTTPS, encrypted OAuth tokens, and strict GDPR/FERPA compliant data handling.
