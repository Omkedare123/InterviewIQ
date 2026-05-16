# Interview Master — AI-Powered Interview Preparation Platform

Interview Master is a full-stack web application that helps job seekers prepare for interviews using **Google Gemini AI**. Users paste a target job description, upload a resume (PDF) or write a short self-summary, and the app generates a personalized interview strategy: technical and behavioral questions, skill-gap analysis, a day-by-day preparation roadmap, and an optional tailored resume PDF.

---

## Problem It Solves

Preparing for a specific role usually means guessing what interviewers will ask and how well your profile fits the job. Interview Master automates that work by analyzing the **job description** against the **candidate’s resume or self-description**, then producing structured, actionable prep material in one place.

---

## Key Features

### Authentication
- User registration and login (email + password)
- JWT stored in **HTTP-only cookies** for secure sessions
- Protected routes — dashboard and interview pages require login
- Logout with token blacklisting

### AI Interview Plan Generator
- Paste a **target job description** (required)
- Provide a **PDF resume** and/or **self-description** (at least one required)
- Gemini generates:
  - **Match score** (0–100) — how well the profile fits the role
  - **Technical questions** — with interviewer intention and model answers
  - **Behavioral questions** — with intention and suggested responses
  - **Skill gaps** — skills to improve, tagged by severity (low / medium / high)
  - **Preparation roadmap** — multi-day plan with focus areas and daily tasks
  - **Job title** — inferred from the job description

### Interview Report Dashboard
- View generated plans in three sections: Technical, Behavioral, Road Map
- Expandable question cards (question, intention, answer)
- Match score visualization and skill-gap tags
- **Download Resume** — AI-generated, job-tailored resume as PDF (Puppeteer)

### History
- List of past interview plans on the home page
- Click any plan to reopen the full report

---

## Tech Stack

| Layer | Technologies |
|--------|----------------|
| **Frontend** | React 19, Vite, React Router 7, Axios, SCSS |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB (Mongoose) |
| **AI** | Google Gemini API (`@google/genai`) — structured JSON output |
| **Auth** | JWT, bcrypt, cookie-parser, CORS with credentials |
| **File handling** | Multer (in-memory PDF upload), pdf-parse v2 |
| **PDF export** | Puppeteer (HTML → PDF for tailored resumes) |
| **Validation** | Zod (server-side response validation) |

---

## Architecture

```
┌─────────────────┐     HTTP + cookies      ┌─────────────────┐
│  React (Vite)   │ ◄──────────────────────►│  Express API    │
│  localhost:5173 │                         │  localhost:5000 │
└────────┬────────┘                         └────────┬────────┘
         │                                           │
         │  AuthContext / InterviewContext           │  Controllers
         │  Protected routes                         │  ├── auth
         │                                           │  └── interview
         │                                           │
         │                                    ┌──────▼──────┐
         │                                    │  MongoDB    │
         │                                    └─────────────┘
         │                                           │
         │                                    ┌──────▼──────┐
         └────────────────────────────────────│  Gemini API │
                                              └─────────────┘
```

### Frontend structure (`Frontend/src/`)
- **Feature-based folders** under `features/auth` and `features/interview`
- **Auth**: Login, Register, `AuthProvider`, `useAuth`, `Protected` route guard
- **Interview**: Home (generator), Interview (report view), `InterviewProvider`, `useInterview`
- **Routing**: `app.routes.jsx` with public auth routes and protected app routes

### Backend structure (`Backend/src/`)
- **Routes** → **Controllers** → **Services** / **Models**
- `auth.routes.js` — register, login, logout, get current user
- `interview.route.js` — create report, list reports, get by ID, generate resume PDF
- `ai.service.js` — Gemini prompts, JSON schema, response normalization
- `auth.middleware.js` — JWT verification from cookies

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Create account |
| POST | `/login` | Sign in (sets cookie) |
| GET | `/logout` | Sign out (blacklists token) |
| GET | `/get-me` | Current user (protected) |

### Interview (`/api/interview`) — all protected
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Generate new interview report (multipart: jobDescription, selfDescription, resume PDF) |
| GET | `/` | List user’s past reports (summary fields) |
| GET | `/report/:interviewId` | Full report by ID |
| POST | `/resume/pdf/:interviewReportId` | Download tailored resume PDF |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas or local MongoDB
- [Google AI Studio](https://aistudio.google.com/) API key

### 1. Clone and install

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

### 2. Environment variables

Create `Backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key

# Optional — defaults to gemini-2.5-flash
GEMINI_MODEL=gemini-3-flash-preview
```

### 3. Run development servers

```bash
# Terminal 1 — Backend (port 5000)
cd Backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd Frontend
npm run dev
```

Open **http://localhost:5173** → register → create an interview plan.

---

## User Flow

1. **Register / Login** → session cookie set  
2. **Home** → enter job description + resume PDF or self-description → **Generate**  
3. Backend parses PDF text, calls Gemini with structured JSON schema, saves report to MongoDB  
4. **Interview page** → browse technical / behavioral questions, roadmap, match score, skill gaps  
5. Optional: **Download Resume** → AI writes HTML → Puppeteer exports PDF  

---

## Data Model (Interview Report)

Each saved report includes:
- `jobDescription`, `resume`, `selfDescription`
- `title`, `matchScore`
- `technicalQuestions[]`, `behavioralQuestions[]`
- `skillGaps[]`, `preparationPlan[]`
- `user` (reference), `createdAt` / `updatedAt`

---

## Security Notes

- Passwords hashed with **bcrypt**
- JWT in **httpOnly**, **sameSite: lax** cookies
- Invalid/logged-out tokens stored in a **blacklist**
- Interview APIs scoped to the authenticated user’s reports
- CORS restricted to `http://localhost:5173` in development

---

## Project Structure

```
Yt_genai/
├── Backend/
│   ├── server.js
│   └── src/
│       ├── app.js
│       ├── config/database.js
│       ├── controllers/     # auth, interview
│       ├── middlewares/     # auth, file upload
│       ├── models/          # user, interviewReport, blacklist
│       ├── routes/
│       └── services/        # ai.service.js (Gemini + Puppeteer)
├── Frontend/
│   └── src/
│       ├── app.routes.jsx
│       ├── App.jsx
│       └── features/
│           ├── auth/
│           └── interview/
└── README.md
```

---

## Short Descriptions (for portfolio / resume)

**One line:**  
AI-powered interview prep app that generates tailored questions, skill gaps, and a study roadmap from your resume and a job description.

**Paragraph:**  
Interview Master is a MERN-style application (React + Express + MongoDB) integrated with Google Gemini. Users authenticate securely, submit a job posting and their profile, and receive a structured interview preparation report with technical and behavioral Q&A, match scoring, and a multi-day roadmap. The platform also generates job-specific resume PDFs using Gemini and Puppeteer.

---

## Author

Built as a full-stack learning / portfolio project demonstrating REST APIs, JWT auth, file uploads, AI structured output, and modern React patterns.
