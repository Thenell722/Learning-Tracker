# LearnTrack — Personal Learning Tracker

A modern, production-ready personal learning tracker that helps you manage courses, topics, study sessions, notes, quiz scores, and spaced-repetition review scheduling.

## Features

- **Dashboard** — Overview with stats, weekly study chart, reviews due, recent sessions, and low-confidence topics
- **Course Management** — Create, edit, delete courses with custom colors, icons, and target hours
- **Topic Management** — Track topics within courses with confidence levels (1-5), status, and review dates
- **Study Sessions** — Log study time with confidence before/after ratings, built-in study timer
- **Notes** — Add searchable notes to topics or specific study sessions
- **Quiz Scores** — Record quiz scores per topic with percentage calculation and trend tracking
- **Review Scheduling** — Spaced repetition auto-suggests next review dates based on confidence level
- **Calendar View** — Visual calendar showing study sessions and review dates
- **Statistics** — Charts for weekly/monthly study time, quiz trends, confidence growth, and time per course
- **Dark Mode** — Full dark/light theme toggle
- **Responsive** — Mobile-first design that works on all screen sizes

## Tech Stack

- **Frontend**: Next.js 13 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Recharts
- **Backend**: Next.js API Route Handlers, Supabase (PostgreSQL)
- **Validation**: Zod (server-side and client-side)
- **Date handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

The project uses Supabase as its database backend. The following variables are pre-configured in the `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

If you're using your own Supabase instance, replace these values with your project's credentials.

### Database Setup

The database schema is managed through Supabase migrations. The schema includes:

- `users` — single seeded user for the personal app
- `courses` — learning courses with color, icon, status, and target hours
- `topics` — topics within courses with confidence levels and review dates
- `study_sessions` — logged study time with confidence before/after ratings
- `notes` — notes attached to topics and optionally to study sessions
- `quiz_scores` — quiz results with score and total questions

All tables have Row Level Security (RLS) enabled with `anon, authenticated` policies since this is a single-user app with no login.

The schema is automatically applied via the Supabase MCP migration tool. A default user and sample data (3 courses, topics, study sessions, notes, and quiz scores) are seeded automatically.

### Running the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── api/              # API route handlers
│   │   ├── courses/      # Course CRUD endpoints
│   │   ├── topics/       # Topic CRUD endpoints
│   │   ├── sessions/     # Study session CRUD endpoints
│   │   ├── notes/        # Note CRUD endpoints
│   │   ├── quizzes/      # Quiz score CRUD endpoints
│   │   ├── reviews/      # Review scheduling endpoints
│   │   ├── dashboard/    # Aggregated dashboard data
│   │   └── statistics/   # Aggregated statistics data
│   ├── courses/          # Courses list + course detail pages
│   ├── topics/           # Topic detail page
│   ├── sessions/         # Study sessions page with timer
│   ├── reviews/          # Reviews page
│   ├── notes/            # Notes page with search
│   ├── calendar/         # Calendar view page
│   ├── statistics/       # Statistics page with charts
│   ├── globals.css       # Global styles + theme variables
│   ├── layout.tsx        # Root layout with sidebar + theme
│   └── page.tsx          # Dashboard page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── *.tsx             # Custom reusable components
├── lib/
│   ├── supabase/         # Supabase client + server + user helper
│   ├── api.ts            # Client-side API helpers
│   ├── constants.ts      # Color, icon, and status constants
│   ├── format.ts         # Formatting utilities
│   ├── spaced-repetition.ts  # Review scheduling logic
│   ├── streaks.ts        # Streak calculation
│   └── utils.ts          # General utilities
├── types/
│   └── index.ts          # TypeScript type definitions
└── supabase/
    └── migrations/       # Database migration SQL files
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| POST | `/api/courses` | Create a course |
| GET | `/api/courses/[id]` | Get a single course |
| PUT | `/api/courses/[id]` | Update a course |
| DELETE | `/api/courses/[id]` | Delete a course |
| GET | `/api/topics` | List topics (optional `course_id` filter) |
| POST | `/api/topics` | Create a topic |
| PUT | `/api/topics/[id]` | Update a topic |
| DELETE | `/api/topics/[id]` | Delete a topic |
| GET | `/api/sessions` | List sessions (optional `topic_id` filter) |
| POST | `/api/sessions` | Create a session |
| PUT | `/api/sessions/[id]` | Update a session |
| DELETE | `/api/sessions/[id]` | Delete a session |
| GET | `/api/notes` | List notes (optional `topic_id`, `search` filters) |
| POST | `/api/notes` | Create a note |
| PUT | `/api/notes/[id]` | Update a note |
| DELETE | `/api/notes/[id]` | Delete a note |
| GET | `/api/quizzes` | List quiz scores (optional `topic_id` filter) |
| POST | `/api/quizzes` | Create a quiz score |
| PUT | `/api/quizzes/[id]` | Update a quiz score |
| DELETE | `/api/quizzes/[id]` | Delete a quiz score |
| GET | `/api/reviews` | List reviews (`filter=due|overdue|upcoming`) |
| POST | `/api/reviews/complete` | Mark review complete + schedule next |
| GET | `/api/dashboard` | Aggregated dashboard data |
| GET | `/api/statistics` | Aggregated statistics data |

## Spaced Repetition

The app uses a simplified Leitner-style spaced repetition algorithm. When you mark a review as complete, the next review date is automatically calculated based on your confidence level:

| Confidence | Days Until Next Review |
|------------|----------------------|
| 1 — Very Low | 1 day |
| 2 — Low | 2 days |
| 3 — Medium | 4 days |
| 4 — High | 7 days |
| 5 — Very High | 14 days |

## License

This is a personal project. Feel free to use and modify it.
