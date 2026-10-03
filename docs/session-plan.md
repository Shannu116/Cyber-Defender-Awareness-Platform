# Architecture & Implementation Plan: Unique Registration & Resumable Sessions

## Microcare Cyber Defender Platform

---

### 1. Overview & Goals
Currently, user identification (`participantName` and `department`) is collected strictly in React state on `WelcomeScreen.tsx` and submitted only upon finishing the final challenge. A page refresh, browser crash, or closed tab loses all in-progress progress, and duplicate names within the same department cannot be detected until completion.

This implementation introduces:
1. **Atomic Uniqueness Guard**: Every participant within a department possesses a unique identity key (`normalize(name) + department`) enforced by a MongoDB unique index.
2. **Persistent Resumable Sessions**: A server-backed `QuizSession` state machine tracks in-progress challenges, answers, active duration, and current index.
3. **Same-Device Auto-Resume**: Seamless restoration upon app load via stored `sessionId` + `deviceToken` in `localStorage`.
4. **Cross-Device / Staged Resume**: An 8-character unambiguous resume code (e.g. `K7M2-QX4P`) or optional private email allows resuming on any device.
5. **Absolute Email Privacy**: Optional email is used solely as an out-of-band resume credential. It is configured with `select: false` in Mongoose and is never returned in any API response or rendered in any user or admin UI.
6. **Practice Replay Isolation**: Replay modes ("Try Again", "Practice Weak Areas") run in practice mode (`isPracticeQuiz: true`), bypassed from session uniqueness and filtered out of admin analytics.

---

### 2. Data Model Design

#### 2.1 `QuizSession` Model (`server/models/QuizSession.js`)
```javascript
import mongoose from 'mongoose';

const SessionAnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  questionTitle: { type: String },
  category: { type: String },
  userResponse: { type: mongoose.Schema.Types.Mixed },
  timeSpentSeconds: { type: Number, default: 0 },
  answeredAt: { type: Date, default: Date.now }
}, { _id: false });

const QuizSessionSchema = new mongoose.Schema({
  nameKey: { 
    type: String, 
    required: true, 
    index: true 
  },
  participantName: { 
    type: String, 
    required: true, 
    trim: true,
    minlength: 2, 
    maxlength: 60 
  },
  department: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    lowercase: true, 
    trim: true, 
    select: false // NEVER returned in normal queries
  },
  status: { 
    type: String, 
    enum: ['in_progress', 'completed'], 
    default: 'in_progress', 
    index: true 
  },
  questionIds: [{ type: String }],
  currentIndex: { type: Number, default: 0 },
  answers: [SessionAnswerSchema],
  activeSeconds: { type: Number, default: 0 },
  resumeCode: { 
    type: String, 
    required: true, 
    index: true 
  },
  deviceTokenHash: { 
    type: String, 
    required: true, 
    index: true 
  },
  startedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  attemptId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'QuizAttempt', 
    default: null 
  }
}, {
  timestamps: true
});

// Enforce identity uniqueness on non-completed sessions or overall identity per department
QuizSessionSchema.index({ nameKey: 1, department: 1 }, { unique: true });
```

#### 2.2 Shared Department Constants
Shared department list moved to centralized constants:
`['Operations', 'Finance & Accounting', 'Human Resources', 'Sales & Marketing', 'Customer Support', 'Legal & Compliance', 'IT & Engineering', 'Executive & Management', 'General Staff']`
- Client: `client/src/constants/departments.ts`
- Server: `server/constants/departments.js`

#### 2.3 `QuizAttempt` Model Updates (`server/models/QuizAttempt.js`)
- Add optional `sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizSession', index: true }`.
- Ensure no email field exists on `QuizAttempt` to maintain zero-leakage compliance.

---

### 3. API Endpoints Specification

| Method | Path | Auth / Headers | Request Body | Success Response | Error Cases |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/session/start` | None (Rate-limited) | `{ participantName, department, email? }` | `201 Created`<br>`{ success: true, sessionId, deviceToken, resumeCode, currentIndex: 0, questionIds }` | `400`: Invalid name/department format.<br>`409`: Unique key collision (friendly message). |
| `GET` | `/api/session/:id` | `Authorization: Bearer <deviceToken>` | None | `200 OK`<br>`{ success: true, session: { id, participantName, department, status, currentIndex, activeSeconds, resumeCode, answers, questionIds, attemptId? }, attempt? }` | `401`: Token mismatch.<br>`404`: Session not found. |
| `PUT` | `/api/session/:id/answer` | `Authorization: Bearer <deviceToken>` | `{ questionId, questionTitle, category, userResponse, timeSpentSeconds }` | `200 OK`<br>`{ success: true, currentIndex, activeSeconds, answersCount }` | `401`: Token mismatch.<br>`400`: Session already completed. |
| `POST` | `/api/session/resume` | None (Rate-limited) | `{ participantName, department, resumeCode?, email? }` | `200 OK`<br>`{ success: true, sessionId, deviceToken, resumeCode, session }` | `401`: Generic "Details do not match any active session" (prevents enumeration). |
| `POST` | `/api/session/:id/complete` | `Authorization: Bearer <deviceToken>` | None | `200 OK`<br>`{ success: true, attempt: { ... } }` | `401`: Token mismatch.<br>`400`: Already completed. |
| `POST` | `/api/quiz/submit` | None | `{ participantName, department, answers, completionTimeSeconds, isPracticeQuiz: true }` | `201 Created`<br>`{ success: true, data: { ... } }` | Kept for practice mode. |
| `POST` | `/api/admin/session/:id/reset` | `requireAdminAuth` (JWT) | None | `200 OK`<br>`{ success: true, message: "Participant session reset." }` | `401/403`: Unauthorized.<br>`404`: Session not found. |
| `GET` | `/api/admin/sessions/in-progress` | `requireAdminAuth` (JWT) | None | `200 OK`<br>`{ success: true, count, data: [ ... ] }` (No emails) | `401/403`: Unauthorized. |

---

### 4. Client State Machine & User Journey

```
                     [ App Mount ]
                           |
             Has localStorage session?
             /                       \
           Yes                        No
            |                          |
    GET /api/session/:id               |
    /         |         \              |
In-Progress Completed  401/404         |
   |          |          |             |
[ResumeCard] [Results] [ClearStorage]  |
   |                                   |
[Continue]                             |
   |                                   |
   v                                   v
[Quiz Step N] <---------------- [WelcomeScreen]
                                       |
                              User inputs Name,
                              Dept, optional Email
                                       |
                              POST /api/session/start
                              /                      \
                         409 Conflict             201 Created
                              |                        |
                       Show friendly help        Store session,
                       + Resume shortcut         go to Briefing
```

#### Client States:
1. **`initializing`**:
   - Checks `localStorage.getItem('cyber_defender_session')` (`{ sessionId, deviceToken }`).
   - If found, calls `fetchSession(sessionId, deviceToken)`.
   - On cold-start / slow network, displays `"Waking things up... connecting to secure server"`.
   - If `in_progress`: displays Welcome Back Banner (`"Welcome back, Ravi. You're on question 4 of 10"`).
   - If `completed`: transitions straight to `ResultsScreen`.
   - If invalid/401: clears `localStorage`, shows `WelcomeScreen`.
2. **`welcome`**:
   - **Mandatory Fields**: Full Name (`*`) (validated 2–60 chars, letters/spaces/hyphens/dots) and Department (`*`) (from shared list).
   - **Email Handling**:
     - The label must be clean and professional: **`Work Email`** (NEVER write `Email: (Optional)` or `(Optional)` anywhere in the label).
     - It has NO required asterisk (`*`).
     - If the user enters an email: validate format (max 254 chars), lowercase, and store securely (`select: false`).
     - If the user leaves it blank: completely fine, let them in without any error or warning.
     - Subtle helper text below the input: *"Only used to help you resume your test. Never shown on screen."*
   - Includes a clear link: **"Resume an in-progress test"**, opening a resume modal (Name + Department + Resume Code or Email).
3. **`in-progress`**:
   - Displays current question (`currentIndex`).
   - Displays a small, copyable chip: `"Resume code: K7M2-QX4P"`.
   - On answer submission, triggers `saveSessionAnswer(...)` with optimistic UI and background retry.
   - Shows subtle saving indicator (`"Saving progress..."`).
   - Unanswered questions restart from the beginning if interrupted.
4. **`completed`**:
   - Calls `completeSession(...)`, displays `ResultsScreen`.
   - Clears active session from `localStorage`.
   - "Try Again" or "Practice Weak Areas" runs with `isPracticeQuiz = true`.
5. **`practice`**:
   - Runs purely in memory + submits to `/api/quiz/submit` with `isPracticeQuiz: true`.
   - Bypasses uniqueness index; excluded from admin analytics.

---

### 5. Name Normalization & Resume Code Specs

#### 5.1 Name Normalization Function
```javascript
export function normalizeName(name) {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents
    .replace(/\s+/g, ' ');           // collapse whitespace
}
```

#### 5.2 Resume Code Generator
- **Alphabet**: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (32 characters; excludes ambiguous `0`, `O`, `1`, `I`).
- **Format**: `XXXX-XXXX` (8 characters with a hyphen for readability, e.g. `K7M2-QX4P`).
- **Normalization on lookup**: Strips hyphens and whitespace, converts to uppercase.

---

### 6. Security & Privacy Safeguards

1. **Email Concealment (Zero-Leakage Guarantee)**:
   - Defined with `select: false` on the Mongoose schema.
   - Excluded from all aggregation pipelines, exports, admin APIs, and error messages.
2. **Rate Limiting**:
   - `express-rate-limit` applied to `/api/session/start` and `/api/session/resume` (e.g. max 15 requests / 15 minutes per IP) to prevent name enumeration attacks.
3. **Timing & Device Protection**:
   - Device tokens are hashed using SHA-256 before storing in MongoDB (`deviceTokenHash`).
   - `activeSeconds` is calculated from actual elapsed question time; idle time away is not counted.
4. **Admin Analytics Isolation**:
   - Admin stats aggregation explicitly filters `{ completed: { $ne: false }, isPracticeQuiz: { $ne: true } }`.

---

### 7. Implementation Sequence (Branch: `feat/sessions`)

1. **Server Phase**:
   - Create `server/constants/departments.js` and `client/src/constants/departments.ts`.
   - Create `server/models/QuizSession.js`.
   - Extract `server/services/evaluation.js` (`gradeAnswers`).
   - Add session routes (`/api/session/start`, `/api/session/:id`, `/api/session/:id/answer`, `/api/session/resume`, `/api/session/:id/complete`).
   - Add admin reset routes (`/api/admin/session/:id/reset`, `/api/admin/sessions/in-progress`).
   - Update `server/index.js` admin stats to filter out `isPracticeQuiz`.
2. **Client Services Phase**:
   - Update `client/src/services/api.ts` with session methods (`startSession`, `getSession`, `saveAnswer`, `resumeSession`, `completeSession`, `adminResetSession`).
   - Create `client/src/hooks/useSession.ts`.
3. **Client UI Phase**:
   - Update `WelcomeScreen.tsx`: Mandatory Name & Department with `*`, clean `Work Email` field (no `(Optional)` in label, allows blank submissions), friendly 409 conflict message with resume link, and resume modal.
   - Update `App.tsx`: Auto-resume detection, "Welcome back" card, resume code chip on question view, autosave state indicator.
   - Update `AdminDashboard.tsx`: Add "In Progress Sessions" counter and per-participant reset button (never displaying email).
4. **Verification**:
   - Automated server tests (supertest): session creation, 409 collision, answer idempotency, wrong token 401, email privacy assertion.
   - End-to-end resume verification across reloads and multi-device simulation.
