# StudySync — Academic & Routine Management Platform

> Plan your semester, never miss a deadline, and study smarter.

**StudySync** is a full-stack academic management platform for university students. It unifies deadline tracking, an intelligent study-schedule generator, course analytics, attendance records, GPA prediction, and a Pomodoro focus timer in one responsive, dark-mode-ready web app.

🔗 **Live website:** [https://studysync-orpin-six.vercel.app](https://studysync-orpin-six.vercel.app)

---

## ✨ Features

### 📊 Dashboard
- Overview of tasks due in the **next 24 hours**.
- Today's completion progress bar and count of courses.
- Live estimated-GPA widget against your target.
- Quick links to courses, tasks, attendance, and focus mode.

### 📚 Courses & Tasks
- Course hub: course code, credit hours, instructor email, office hours, syllabus URL, and grading criteria.
- Task management for **Quizzes, Assignments, Labs, Papers, Midterms, Finals, and Projects** with:
  - Due dates, submission portal links, weight percentage, and difficulty.
  - Status workflow: *Pending → In Progress → Submitted → Graded*.
  - Sub-task breakdown for large papers and assignments.
- Kanban-style board and per-course task tabs.

### 🗓 Calendar & Smart Scheduling
- Interactive **FullCalendar** view (month / week / day / list) with fixed classes and dynamic study blocks.
- **Auto-schedule** generator that fills free time with study blocks based on workload.
- Recurring weekly schedule support and drag-adjustable blocks.
- **`.ics` export** for external calendar apps.

### 🎯 Focus Timer
- Pomodoro timer with customizable work/break lengths.
- Link focus sessions to a task to track study hours per course.

### 📈 GPA & Attendance
- Estimated GPA calculation with configurable 4.0/5.0 scale.
- Attendance tracking per course (present / absent / excused) with threshold alerts.

### 🔔 Reminders & Notifications
- In-app deadline reminders at **24h / 3h / 1h** before due.
- Configurable 7:00 AM daily digest.
- Multi-channel architecture (in-app, email, push, webhook) ready for provider backends.

### ⚙️ Personalization
- Routine templates: **Standard Week**, **Exam Season**, **Holiday/Break**.
- Timezone, attendance threshold, GPA target, and timer preferences.
- Full **dark mode** and a mobile-first responsive layout.

---

## 🚀 Tech Stack

| Layer       | Technology                                                                 |
| ----------- | -------------------------------------------------------------------------- |
| Framework   | [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19        |
| Language    | TypeScript                                                                 |
| Styling     | Tailwind CSS v4 · shadcn/ui · Radix UI · Lucide icons · tw-animate-css     |
| Data        | PostgreSQL + [Prisma ORM](https://www.prisma.io)                           |
| Data Fetch  | TanStack Query · Server Actions                                            |
| Calendar    | FullCalendar (daygrid · timegrid · list · interaction)                     |
| Auth        | JWT sessions ([jose](https://github.com/panva/jose)) + bcryptjs            |
| Validation  | Zod                                                                        |
| Scheduling  | node-cron (reminder/digest jobs)                                           |
| Dates       | date-fns                                                                   |
| Deployment  | Vercel                                                                    |

---

## 📁 Project Structure

```
prisma/                # Prisma schema, migrations, seed
public/                # Static assets
src/
├─ app/
│  ├─ (auth)/          # Login & register
│  ├─ (main)/          # Authenticated app shell (sidebar + topbar)
│  │  ├─ attendance/   # Attendance tracking
│  │  ├─ calendar/     # FullCalendar + auto-schedule
│  │  ├─ courses/      # Course list + course detail
│  │  ├─ focus/        # Pomodoro focus timer
│  │  ├─ gpa/          # GPA analytics
│  │  ├─ notifications/
│  │  ├─ settings/     # User preferences
│  │  ├─ tasks/        # Task board
│  │  └─ page.tsx      # Dashboard
│  └─ api/             # Route handlers (schedules, tasks, calendar/ics)
├─ components/         # UI + feature components
├─ lib/                # Auth, prisma, validation, actions, constants
└─ middleware.ts       # Auth gate
```

---

## 🛠 Getting Started

### Prerequisites
- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech), Supabase, or local)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/awaisahmed682/StudySync.git
cd StudySync

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
#   - Set DATABASE_URL to your PostgreSQL connection string
#   - Set SESSION_SECRET to a random 32-byte secret:
#     openssl rand -base64 32

# 4. Set up the database schema
npm run db:push

# 5. (Optional) Seed sample data
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful Scripts

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the development server         |
| `npm run build`      | Create a production build            |
| `npm run start`      | Run the production build             |
| `npm run lint`       | Run ESLint                           |
| `npm run typecheck`  | Type-check with `tsc --noEmit`       |
| `npm run db:push`    | Apply the Prisma schema to the DB    |
| `npm run db:migrate` | Create and apply migrations          |
| `npm run db:seed`    | Seed the database                    |

---

## ☁️ Deployment

The app is optimized for [Vercel](https://vercel.com):

```bash
npm i -g vercel
vercel --prod
```

Add `DATABASE_URL` and `SESSION_SECRET` to your Vercel environment variables, then deploy. The production deployment lives at **https://studysync-orpin-six.vercel.app**.

---

## 🗄 Database Model

Core entities (see `prisma/schema.prisma` for the full schema):

- **User** — account, target GPA, relationships.
- **UserSettings** — routine mode, timezone, GPA scale, pomodoro lengths, reminder toggles.
- **Course** — course info, instructor, grading criteria, syllabus.
- **AcademicTask** — assessments with due date, weight, status, difficulty, grade.
- **SubTask** — breakdown steps for larger tasks.
- **StudySchedule** — fixed or dynamic (auto-generated) study blocks.
- **FocusSession** — Pomodoro/work sessions linked to tasks.
- **AttendanceRecord** — per-course attendance history.
- **Resource** — notes, past papers, links per course.
- **Notification** — multi-channel deadline and system notifications.
- **CalendarFeed** — external calendar subscription feeds.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.