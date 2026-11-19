# Campus Study Hub AI

An AI-assisted academic resource-sharing platform built with the MERN stack. Students can organize and share study materials, discover verified campus resources, discuss notes, and turn documents into summaries, quizzes, flashcards and an AI Q&A experience. Teachers can publish official resources and assignments; administrators can moderate content and manage the platform.

> This is a substantial, runnable project scaffold intended for local development and academic demonstration. Before public production deployment, complete the hardening checklist below and test it with real accounts, documents and a configured mail/AI provider.

## Technology

**Client:** React 19, Vite, React Router, Axios, Lucide React, standard CSS.

**Server:** Node.js 20+, Express, MongoDB, Mongoose, JWT access/refresh sessions, bcryptjs, Zod, Multer, Helmet, CORS, express-rate-limit, Winston, Nodemailer, Gemini SDK, PDF/DOCX/PPTX text extraction.

## Features included

### Accounts and access control
- Student registration and login.
- Short-lived JWT access tokens and rotating, HTTP-only refresh-token cookies.
- Logout and password reset OTP endpoints.
- Password hashing with bcrypt.
- Student, teacher and admin roles. Public registration can only create student accounts; role assignment is restricted to admins.
- Profile, academic details, public profile summaries, following/follower relationships.

### Student workspace
- Dashboard statistics, recent uploads, trending resources, activity history, bookmarks and unread notification count.
- Personal notes library with upload, edit metadata, soft-delete and public/private visibility.
- PDF, DOCX, PPT, PPTX and TXT file upload (20 MB default limit).
- Extracted text is retained for AI features when supported by the parser.
- Community library with search, subject/branch/semester/tag/type filters and sorting.
- Resource details, downloads, bookmarks, ratings, comments and reports.
- Study-session streak and contribution points.

### AI study tools
- Summaries, concept explanations, question answering against a selected document, important-topic suggestions, MCQ quiz generation and flashcard generation.
- Quiz attempts and score recording; saved flashcard sets.
- Uses Gemini through the server. The API key is never sent to the browser.

### Teacher workspace
- Teacher uploads are marked as official and verified.
- Publish, edit and delete assignments.
- Teachers can review and verify student-submitted notes, publish official notes, and create, edit or delete assignments. Syllabus, question papers and lab manuals can be represented as typed resources in the notes library.

### Admin workspace
- User counts, note/download totals, moderation queue, open reports and AI usage counts.
- Promote/demote users and activate/deactivate accounts.
- Verify or reject student uploads.
- Dismiss reports or remove reported resources.

### Platform services
- Layered routes/controllers/services/models architecture.
- Centralized validation, async error handling and structured logging.
- REST API health check, rate limiting and security headers.
- MongoDB indexes for text search and common filters.

## Project layout

```text
campus-study-hub-ai/
├── client/
│   ├── src/components/
│   ├── src/context/
│   ├── src/pages/
│   ├── src/services/
│   └── src/styles/
├── server/
│   ├── scripts/seed.js
│   ├── src/config/
│   ├── src/controllers/
│   ├── src/middlewares/
│   ├── src/models/
│   ├── src/routes/
│   ├── src/services/
│   └── src/utils/
└── README.md
```

## Run locally

### Requirements
- Node.js 20 or newer and npm.
- MongoDB Atlas cluster or local MongoDB.
- Gemini API key for AI features (optional until AI is used).

### 1. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and set `MONGO_URI`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`. Use two different, long, random secrets. Add `GEMINI_API_KEY` when you are ready to test AI features.

For password-reset email delivery, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM`. During local development only, set `DEV_RETURN_OTP=true` to return the reset code in the API response; never enable that setting in production.

### 2. Install dependencies

From the root folder:

```bash
npm install
npm run install:all
```

Or install separately with `npm install` in `server` and `client`.

### 3. Create the first administrator

Add these temporary values to `server/.env`:

```env
SEED_ADMIN_EMAIL=admin@yourcollege.edu
SEED_ADMIN_PASSWORD=Use-A-Long-Unique-Password
SEED_ADMIN_FIRST_NAME=Campus
```

Then run from the root:

```bash
npm run seed --prefix server
```

Remove the seed password from `.env` after creating the account. Do not commit credentials.

### 4. Start both applications

From the root:

```bash
npm run dev
```

Client: `http://localhost:5173`  
API: `http://localhost:5000`  
Health: `http://localhost:5000/api/health`

You can also start the server and client independently with `npm run dev --prefix server` and `npm run dev --prefix client`.

## API overview

All API paths are prefixed with `/api`. Protected endpoints require `Authorization: Bearer <accessToken>`. The refresh token is stored in an HTTP-only cookie; requests from the browser include credentials.

| Area | Endpoint | Method | Purpose |
|---|---|---:|---|
| Auth | `/auth/register` | POST | Create student account |
| Auth | `/auth/login` | POST | Sign in |
| Auth | `/auth/refresh` | POST | Rotate refresh session |
| Auth | `/auth/logout` | POST | Revoke session |
| Auth | `/auth/me` | GET | Current user |
| Auth | `/auth/forgot-password` | POST | Send reset OTP |
| Auth | `/auth/reset-password` | POST | Reset password with OTP |
| Profile | `/profile/dashboard` | GET | Dashboard summary |
| Profile | `/profile/me` | PATCH | Update own profile |
| Profile | `/profile/:id` | GET | View profile summary |
| Profile | `/profile/:id/follow` | POST | Follow a user |
| Profile | `/profile/study-session` | POST | Record a study session/streak |
| Profile | `/profile/leaderboard` | GET | Points leaderboard |
| Profile | `/profile/notifications` | GET | Notifications |
| Profile | `/profile/notifications/:id/read` | PATCH | Mark notification as read |
| Notes | `/notes` | POST | Upload a note (multipart field `file`) |
| Notes | `/notes/mine` | GET | Personal notes |
| Notes | `/notes/community` | GET | Search/browse verified public notes |
| Notes | `/notes/bookmarks` | GET | Saved notes |
| Notes | `/notes/:id` | GET | Note details |
| Notes | `/notes/:id` | PATCH | Edit note metadata/file |
| Notes | `/notes/:id` | DELETE | Soft-delete note |
| Notes | `/notes/:id/download` | GET | Download file |
| Notes | `/notes/:id/bookmark` | POST | Toggle bookmark |
| Community | `/community/notes/:noteId/comments` | GET/POST | List/create comments |
| Community | `/community/comments/:id` | DELETE | Hide own comment or admin moderation |
| Community | `/community/notes/:noteId/ratings` | GET/POST | List/upsert rating |
| Community | `/community/notes/:noteId/report` | POST | Report a resource |
| AI | `/ai/recommendations` | POST | Generate personalized study recommendations |
| AI | `/ai/notes/:noteId/summary` | POST | Generate summary |
| AI | `/ai/notes/:noteId/chat` | POST | Ask a question about a note |
| AI | `/ai/notes/:noteId/chats` | GET | Read previous conversations for a note |
| AI | `/ai/notes/:noteId/explain` | POST | Explain a concept |
| AI | `/ai/notes/:noteId/quiz` | POST | Generate and save quiz |
| AI | `/ai/notes/:noteId/flashcards` | POST | Generate and save flashcards |
| AI | `/ai/notes/:noteId/important-topics` | POST | Identify important topics |
| AI | `/ai/quizzes` | GET | List own quizzes |
| AI | `/ai/quizzes/:id/submit` | POST | Submit quiz answers |
| AI | `/ai/flashcards` | GET | List own flashcard sets |
| Teacher | `/teacher/notes/pending` | GET | List student notes awaiting teacher verification |
| Teacher | `/teacher/notes/:id/verify` | PATCH | Verify/reject a student note |
| Teacher | `/teacher/assignments` | GET/POST | List/create assignments |
| Teacher | `/teacher/assignments/:id` | PATCH/DELETE | Update/delete own assignment |
| Admin | `/admin/analytics` | GET | Platform analytics |
| Admin | `/admin/users` | GET | List users |
| Admin | `/admin/users/:id` | PATCH | Update role/account state |
| Admin | `/admin/notes/pending` | GET | Moderation queue |
| Admin | `/admin/notes/:id/verification` | PATCH | Verify/reject resource |
| Admin | `/admin/reports` | GET | List reports |
| Admin | `/admin/reports/:id` | PATCH | Resolve report |

### Other frontend areas

The React app also includes dedicated views for saved notes, notifications, contribution leaderboard, public student profiles and teacher assignments. The teacher view includes a note-verification queue; the admin view includes platform-wide moderation and user management.

### Search query examples

`GET /api/notes/community?q=normalization&subject=DBMS&semester=2&sort=downloads&page=1&limit=12`

Supported community filters include `q`, `subject`, `branch`, `semester`, `tag`, `type`, `uploader`, `sort`, `page` and `limit`. Sort values: `recent`, `downloads`, `rating`, `popular`.

### Example upload request

Send `multipart/form-data` with a file field named `file` and metadata fields: `title`, `subject`, `semester`, `branch`, `description`, `tags`, `visibility`, `type`.

## Important implementation notes

1. **Local file storage:** Multer stores files under `server/uploads/notes`. This is useful for local development and a single-server demo. For production or ephemeral hosting, replace it with S3-compatible object storage and store object keys instead of local paths.
2. **PPT parsing:** PPTX text extraction reads slide XML. Legacy `.ppt` files are accepted and stored, but text extraction for legacy binary PPT is not implemented; AI features need extracted text.
3. **PDF parsing:** Image-only/scanned PDFs do not contain extractable text. Add OCR as a separate, opt-in processing pipeline if scanned documents are a core requirement.
4. **AI privacy:** Selected document text is sent from the server to the configured Gemini model when the user invokes AI features. Tell users this in the product privacy notice and follow applicable provider/data policies.
5. **Email:** Password reset delivery requires SMTP. The API intentionally returns a generic response to prevent account enumeration.
6. **Moderation:** Student uploads default to `pending` and are not shown in the public community list until an admin verifies them. Teacher/admin uploads are marked verified.
7. **Cloud deployment:** The current code is not wired to a cloud file-storage provider. Configure persistent file storage, HTTPS, production CORS origins, secure cookies, database backups and monitoring before deploying publicly.

## Production hardening checklist

- Add email verification and abuse throttling for OTP issuance/verification.
- Move uploaded files to S3/Cloudinary or another durable private object store; scan files and validate MIME signatures, not only extensions.
- Add signed download URLs or authenticated object streaming for private resources.
- Avoid returning quiz answer keys to the browser before submission; keep scoring fully server-side.
- Add CSRF protections appropriate to the chosen cookie/session deployment and configure secure cookies behind HTTPS.
- Add automated unit/integration tests, request schemas for every mutation, audit-log retention policies and database backups.
- Add document-processing queues, file-size/text limits and AI request quotas/cost tracking.
- Add accessible keyboard states, screen-reader testing, localization and a documented privacy/retention policy.

## Academic demo flow

1. Sign in as the seeded admin and open Administration.
2. Register a student in a separate browser/private session.
3. Upload a study note as the student; it enters the verification queue.
4. Verify it as admin.
5. Sign in as a student and browse it in Community Resources.
6. Open the note, rate it, comment, bookmark it and download it.
7. Open AI Study Space, select a document and generate a summary, quiz or flashcards (Gemini key required).
8. Sign in as a teacher account (promote a test account from Administration), upload official material and create an assignment.

---

Built as a learning project: use it to understand the flow from route → middleware → controller → service → model → database, rather than treating the code as a black box.
