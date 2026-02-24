# Campus Event Management System — MERN Full-Stack Application

A full-featured event management platform built for campus environments, handling everything from event creation and registration to merchandise sales, QR-based attendance tracking, discussion forums, and anonymous feedback. The system supports three distinct user roles — Participants, Organizers, and Admins — each with their own dashboards, workflows, and permissions.

Built using the MERN stack (MongoDB, Express.js, React, Node.js) with a focus on building real, production-grade functionality rather than relying on external SaaS integrations.

---

## Table of Contents

1. [Libraries, Frameworks & Modules](#libraries-frameworks--modules)
2. [Advanced Features — Tier Breakdown](#advanced-features--tier-breakdown)
3. [Additional Features & Technical Decisions](#additional-features--technical-decisions)
4. [Setup & Installation](#setup--installation)
5. [Environment Variables](#environment-variables)
6. [API Route Reference](#api-route-reference)
7. [Folder Structure](#folder-structure)

---

## Libraries, Frameworks & Modules

### Frontend

| Library | Why It's Used | How It's Used |
|---------|--------------|---------------|
| **React 19** (`react`, `react-dom`) | Component-based architecture for building reusable UI pieces (event cards, modals, forms, dashboard tabs) that adapt to context (participant vs organizer view). | 19 pages + 4 shared components, all using hooks (`useState`, `useEffect`, `useCallback`, `useContext`) for state and lifecycle management. |
| **Vite 7** (`vite`, `@vitejs/plugin-react`) | Instant HMR during development and smaller production bundles via Rollup. | Dev server for local development, production build output for Vercel deployment. |
| **React Router DOM 7** (`react-router-dom`) | Client-side routing across 18+ routes split between three role-based sections plus public routes. | `BrowserRouter` wraps the app, `Routes`/`Route` for path mapping, `useNavigate` for programmatic redirects, `useParams` for dynamic event/organizer IDs. |
| **html5-qrcode 2.3** (`html5-qrcode`) | Framework-agnostic QR scanner that accesses device camera via HTML5 `getUserMedia`. Other React QR libraries had React 19 compatibility issues. | Used in `QRScanner.jsx` — initialized in a `useEffect` with cleanup (stops camera on unmount). Decodes QR codes in real-time and fires a callback with the ticket ID. |
| **Axios 1.13** (`axios`) | Used for the legacy task CRUD API service. All main application API calls use native `fetch` instead. | Creates a base instance with `baseURL` in `api.js`. Only task-related endpoints use it. |

**State Management:** React Context API (`AuthContext`) — stores auth token, role, email, user type, and preferences status in both React state and `localStorage`. No Redux needed because the only global state is auth data; everything else is page-local state fetched on mount.

**Styling:** All inline styles (JS objects in `style` prop) plus a minimal `auth.css` for login/signup forms. No CSS framework — keeps styles co-located with components and avoids class name conflicts.

### Backend

| Library | Why It's Used | How It's Used |
|---------|--------------|---------------|
| **Express 4.18** (`express`) | Middleware chain pattern for layering auth checks, role guards, CORS, and error handling across 50+ endpoints. | 9 route modules using `express.Router()`. Middleware chain: `cors → json parser → route handlers → global error handler`. |
| **Mongoose 8.1** (`mongoose`) | Schema validation, compound unique indexes, population (joins), and post-save hooks. Raw MongoDB driver doesn't provide any of this out of the box. | 7 models with enforced types, enums, required fields, min/max constraints. Compound unique index on `Registration(user+event)` and `Feedback(event+user)`. `.populate()` for cross-document references. |
| **bcryptjs 3.0** (`bcryptjs`) | Password hashing. Pure JS version chosen over native `bcrypt` to avoid C++ build tool dependencies on deployment platforms like Render. | Hashes passwords with salt round 10 before storage. `bcrypt.compare()` for login verification. |
| **jsonwebtoken 9.0** (`jsonwebtoken`) | Stateless authentication via JWT tokens — avoids server-side session storage. | Signs tokens with user ID payload and 7-day expiry. `protect` middleware extracts, verifies, looks up user, and checks `isDisabled` on every protected request. |
| **nodemailer 6.10** (`nodemailer`) | Sends ticket confirmation emails via any SMTP server (including Gmail) without third-party API keys or paid plans. | Lazy-initialized transporter singleton. Sends HTML emails with event details and QR code as CID inline attachment. |
| **qrcode 1.5** (`qrcode`) | Server-side QR code generation for embedding in confirmation emails, guaranteed to match the ticket ID in the database. | `QRCode.toDataURL(ticketId)` generates base64 PNG. Used during registration and merchandise payment approval. |
| **cors 2.8** (`cors`) | Enables cross-origin requests from the frontend (different port/domain). | `app.use(cors())` at the top of the middleware chain. |
| **dotenv 16.4** (`dotenv`) | Loads environment variables from `.env` so secrets stay out of source code. | `require('dotenv').config()` at the top of `server.js` before any other module loads. |

### Development

| Tool | Why It's Used |
|------|--------------|
| **nodemon 3.0** | Auto-restarts backend server on file changes during development. |
| **ESLint 9** + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` | Catches common React bugs — enforces rules of hooks, proper dependency arrays, and HMR-compatible exports. |

---

## Advanced Features — Tier Breakdown

### Tier A — Core Advanced Features

#### 1. Merchandise Payment Approval Workflow [8 Marks]

**What it does:** Events can be typed as "merchandise" — participants submit payment proof (URL or transaction ID) along with product selections (size, color, variant). Orders enter a "Pending" state. Organizers review payment proofs and approve or reject each order. On approval, the system generates a QR ticket and sends a confirmation email. No QR is shown while payment is pending or rejected.

**How I built it:**

The Event model has a `merchandiseDetails` subdocument with arrays for sizes, colors, variants, a `stockQuantity` counter, and a `purchaseLimitPerParticipant` field. When a participant registers for a merchandise event, the registration is created with `paymentStatus: "pending"` and the uploaded `paymentProof`.

On the organizer side, `OrganizerEventDetail.jsx` has a dedicated Payments tab that only appears for merchandise events. It shows a pending badge count, lists all pending orders with participant details, merchandise selections, and a link to view the payment proof. Each order has Approve and Reject buttons — rejection requires a reason via a modal.

The approval flow in `registrationController.js` (`approvePayment`):
1. Validates the organizer owns the event and payment is still pending
2. Checks that stock isn't exhausted
3. Sets `paymentStatus` to `"approved"`
4. Generates QR code via `QRCode.toDataURL(ticketId)`
5. Sends confirmation email with inline QR using CID attachment
6. Returns success response

On the participant dashboard, merchandise events show status badges — yellow for Pending, green for Approved, red for Rejected with the rejection reason. The QR code is conditionally rendered: only when `paymentStatus === "approved"`. Before approval, a yellow info message explains the payment is being reviewed.

Stock is decremented at registration time, not at approval time. This prevents overselling — if 5 items are available and 5 people register, it shows sold out even if payments haven't been reviewed yet. Per-participant purchase limits are enforced via a `countDocuments` query.

**Key design decisions:**
- Payment proof as a string (URL/transaction ID) rather than file upload avoids file storage infrastructure complexity (S3, Cloudinary) while still giving organizers enough to verify payment
- The Payments tab shows summary stats at the bottom: pending/approved/rejected counts in colored cards
- Stock decrement on registration (not approval) prevents race conditions where multiple people register for the last item

#### 2. QR Scanner & Attendance Tracking [8 Marks]

**What it does:** Organizers scan participant QR codes using their device camera to mark attendance. The system rejects duplicate scans, logs every attendance action with timestamps, provides a live attendance dashboard with scanned vs. not-yet-scanned breakdowns, supports CSV export of attendance data, and has a manual override option with audit logging for edge cases.

**How I built it:**

The scanner page (`QRScanner.jsx`) has two tabs:

**Scan QR tab:** Uses `html5-qrcode` to access the device camera. When a QR code is decoded, it calls `POST /api/registrations/scan/:ticketId`. The backend (`scanQRAttendance` in `registrationController.js`):
1. Looks up the registration by ticket ID, populates event and user
2. Verifies the organizer owns this event
3. For merchandise events, checks that payment has been approved
4. If already attended, returns 409 with the original scan timestamp and method (duplicate rejection)
5. Otherwise, marks `attended: true`, records `attendedAt` timestamp, sets `attendanceMethod: "qr_scan"`, adds an entry to the `attendanceAuditLog` array, and returns participant details

The frontend shows success/duplicate/error states with different colored result cards. A manual ticket ID input field serves as fallback when the camera can't read the code.

**Attendance Dashboard tab:** Shows two lists — attended and not-yet-attended participants — fetched from `GET /api/registrations/attendance/:eventId`. Each list shows participant name, email, ticket ID, check-in time, and method. A progress bar visualizes attendance rate (attended / total registered).

**Manual override:** Each participant row has a Mark/Unmark button. Clicking it calls `PATCH /api/registrations/manual-override/:registrationId` with a required `reason` field. The backend records the action in the `attendanceAuditLog` array with action type, performer ID, timestamp, and reason. This creates a full audit trail.

**CSV export:** Two mechanisms — server-side (`GET /api/registrations/attendance/:eventId/export` sets `Content-Type: text/csv`) and client-side (the scanner page builds a CSV blob from loaded data and triggers a download). The CSV includes name, email, ticket ID, attendance status, check-in time, and check-in method.

**Key design decisions:**
- The `attendanceAuditLog` array on the Registration document stores the complete history of attendance changes for accountability
- Duplicate scan rejection returns 409 with the original timestamp so the organizer knows when the person originally checked in
- Camera cleanup: `html5-qrcode` is initialized in a `useEffect` with a cleanup function that stops the camera stream, preventing the common bug of camera staying active after navigating away
- Live stats at the top of the scanner show scanned count vs total, updating in real-time as scans happen

---

### Tier B — Intermediate Advanced Features

#### 3. Real-Time Discussion Forum [6 Marks]

**What it does:** Every event has a discussion forum accessible from the Event Details page. Registered participants can post messages, ask questions, and reply to each other. Organizers can moderate — delete messages, pin important ones, and post announcements. The system supports nested reply threading, emoji reactions (👍 ❤️ 😂 🎉 🤔 👎), and an unread message notification badge. Messages auto-refresh every 10 seconds.

**How I built it:**

**Backend:** Messages are stored flat in the `DiscussionMessage` collection with a `parentMessage` field for threading. The `getMessages` endpoint builds a recursive reply tree in memory — fetches all messages for the event, creates a Map by ID, attaches each reply to its parent's `replies` array, and returns only root-level messages. Pinned messages sort to the top. Access control: a `verifyEventAccess` helper checks that the user is either the event organizer or a registered participant.

**Frontend (EventDetails.jsx):** Messages are rendered recursively with increasing left-margin indentation. A `maxDepth` of 5 prevents excessive nesting from breaking the layout. The reply flow: clicking "Reply" sets the message as the `replyTo` target, shows a "Replying to..." indicator above the textarea, and submitting sends the `parentMessage` ID.

**Reactions:** Each emoji is a toggle button. Clicking adds the reaction (emoji + user ID) to the message's `reactions` array server-side, clicking again removes it. The frontend highlights reactions the current user has added with a blue border and shows the count next to each emoji.

**Announcements:** Only the event organizer sees a "Mark as Announcement" checkbox. Announcement messages render with a yellow background, gold left border, and "ANNOUNCEMENT" badge.

**Pinning:** Only the organizer sees pin/unpin buttons. Pinned messages get a blue highlight, "📌 Pinned" label, and float to the top of the thread.

**Soft deletion:** Messages are marked `isDeleted: true`. Content is replaced with "[Message deleted]" on the frontend. This preserves the reply tree — hard-deleting a parent would orphan all its replies.

**Unread tracking:** The client stores a `lastVisitedTimestamp` in `localStorage` per event. `GET /api/discussions/:eventId/unread` returns the count of messages created after that timestamp. A red badge next to the "Show Discussion" button shows this count.

**Key design decisions:**
- Polling every 10 seconds instead of WebSockets — the forum doesn't need sub-second latency, and polling is simpler to implement and deploy
- Flat storage with in-memory tree building instead of nested subdocuments — MongoDB has a 16MB document limit, and deeply nested subdocuments are hard to individually query/update
- Client-side last-visited tracking instead of server-side "read receipts" — no extra database writes on every forum view

#### 4. Organizer Password Reset Workflow [6 Marks]

**What it does:** Organizers can't reset their own passwords directly (their accounts are admin-provisioned). Instead, they submit a reset request with a reason, which goes to the admin. The admin sees all pending requests, can approve (system auto-generates a new password) or reject (with a comment). Request history is tracked with status badges.

**How I built it:**

**Backend:** The `PasswordResetRequest` model stores organizer reference, reason, status (`pending`/`approved`/`rejected`), admin comment, processed-by reference, and the generated password. Five endpoints in `adminController.js`:
- `POST /api/admin/reset-request` — organizer submits, rejects if a pending request already exists
- `GET /api/admin/my-reset-requests` — organizer views their request history
- `GET /api/admin/reset-requests` — admin lists all requests
- `PATCH /api/admin/reset-requests/:id/approve` — auto-generates a strong 16-char password with mixed case, digits, and special chars, hashes it, updates the User document, stores plaintext in request for admin to share
- `PATCH /api/admin/reset-requests/:id/reject` — records admin comment

**Frontend — Organizer side (`Profile.jsx`):** A "Password Reset" tab shows a form with a "Reason for Reset" textarea and a request history table with colored status badges.

**Frontend — Admin side (`ManageOrganizers.jsx`):** A "Password Reset Requests" section shows pending requests with a badge count. Approve triggers a modal showing the generated password with a warning to copy it immediately — the password is shown once and can't be retrieved later.

**Key design decisions:**
- Admin-approved resets instead of self-service — in a campus environment, organizer accounts represent clubs/organizations, not individuals; admin approval adds accountability
- Duplicate prevention — rejects a new request if one is already pending
- Strong 16-char password generator (uppercase, lowercase, digits, special characters)

---

### Tier C — Additional Features

#### 5. Anonymous Feedback System [2 Marks]

**What it does:** Participants who attended an event can submit a star rating (1-5) and optional text comment. Feedback is anonymous — organizers see ratings and comments but not who submitted them. The organizer view shows average rating, star distribution bars, and click-to-filter by star rating.

**How I built it:**

**Backend:** The `Feedback` model has `event`, `user`, `rating` (1-5), and `comment` (max 1000 chars) with a compound unique index on `event+user` to enforce one feedback per participant per event. The `submitFeedback` endpoint checks that the participant has `attended: true` before allowing submission. Uses `findOneAndUpdate` with `upsert: true` so resubmitting updates the existing feedback.

The `getEventFeedback` endpoint computes aggregate stats (average rating, per-star counts) and returns individual reviews without any user identifiers. The `getMyFeedback` endpoint lets participants retrieve their own feedback for editing.

**Frontend — Participant (`ParticipantDashboard.jsx`):** Completed events with `attended: true` show a "⭐ Rate this Event" button. Clicking opens a modal with hover-able stars (labels: Terrible/Poor/Average/Good/Excellent), a comment textarea with character counter, and an anonymous indicator. After submitting, the button changes to "✓ Edit Feedback" with pre-filled values.

**Frontend — Organizer (`OrganizerEventDetail.jsx`):** The Feedback tab shows average rating, filled/unfilled stars, total review count, and 5 distribution bars. Bar widths are proportional to the percentage of reviews at that rating. Clicking a bar filters reviews by that star count.

**Key design decisions:**
- Attendance-gated: only people who actually attended can rate, preventing drive-by negative reviews
- Upsert pattern: combined create/edit in one endpoint
- Anonymous by design: the `getEventFeedback` endpoint excludes user data from the response

---

## Additional Features & Technical Decisions

### Role-Based Access Control (Three-Tier)

Three roles — Participant, Organizer, Admin — enforced at three layers:

1. **Backend middleware:** `protect` validates JWT + checks `isDisabled`. `authorize(...roles)` checks `req.user.role`. Every route declares which roles can access it.
2. **Frontend route guards:** `ProtectedRoute` component checks user role against `allowedRoles` prop. Unauthorized users redirect to login.
3. **UI conditional rendering:** Navbar shows different links per role. Features like the announcement checkbox, pin button, and payment tabs only render for the appropriate role.

Organizer accounts are admin-provisioned only (not self-registration). The admin creates accounts with auto-generated credentials. Credentials are shown once and must be copied immediately.

The `isDisabled` flag lets admins temporarily disable organizer accounts without deletion. Disabled users are blocked at the JWT verification level. On the frontend, `AuthContext` verifies the stored token on every app mount by calling `GET /api/auth/verify` — if the account has been disabled since the last visit, the user is auto-logged out.

### Custom Event Registration Forms

Organizers can build custom registration forms using a form builder on the Create Event page. Supports 6 field types: text, email, number, textarea, select (dropdown), and radio buttons — each with configurable labels, required flags, and options. Field reordering via move up/down buttons. Custom forms are stored as an array of field definitions in the Event model's `customForm` field. Participant responses are stored in a `customFormResponses` Map on the Registration document. Forms are locked for editing once the event has registrations.

### Email Notifications

Ticket confirmation emails are sent on registration (normal events) and on merchandise payment approval. Emails include event details and a QR code image embedded as a CID inline attachment — most email clients strip base64 data URIs but correctly render CID-referenced attachments. The transporter uses lazy initialization — if SMTP credentials aren't configured, email sending silently fails without crashing the registration flow.

### Discord Webhook Integration

Organizers can configure a Discord webhook URL in their profile. When an event is published (on creation or when toggling draft to published), the system sends a POST to the webhook with a Discord embed containing event details. Uses Node.js native `fetch` (available since Node 18). Webhook failures are caught and logged but don't affect event creation.

### Event Lifecycle State Machine

Events progress through defined states with enforced transitions:
- `draft` → `published`
- `published` → `draft`, `ongoing`, `closed`
- `ongoing` → `completed`, `closed`
- `completed`, `closed`, `cancelled` → terminal (no transitions out)
- `cancelled` is reachable from any non-terminal state

Transitions are enforced server-side. The frontend shows context-sensitive action buttons per status.

### Participant Preferences & Recommendations

New participants go through an onboarding flow: selecting areas of interest (15 categories) and following organizers. The `getRecommendedEvents` endpoint matches events by followed organizers or keyword matches in title/description (via MongoDB regex). Results are de-duplicated and padded with general published events if fewer than 10 matches. Preferences are editable from the Profile page.

### Eligibility Control

Events can be restricted to IIIT students only or non-IIIT participants only. `userType` is determined at signup based on email domain (`@iiit.ac.in` → `iiit-participant`). Enforced at registration time on the backend.

### Admin Platform Management

First-admin bootstrapping via `POST /api/admin/provision-first-admin` (only works if no admin exists). Admin can create organizers, view platform analytics (total events/registrations/users), enable/disable organizers, delete organizers, and directly reset organizer passwords.

---

## Setup & Installation

### Prerequisites

- **Node.js** v18 or later (v18+ required for native `fetch` used by Discord webhooks)
- **npm** (comes with Node.js)
- **MongoDB** — local instance or MongoDB Atlas cluster
- **Gmail account** with App Password (optional — for email notifications)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd mern-app
```

### Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
PORT=5000

# Email (optional — system works without these, emails just won't send)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=Event Portal <your-email@gmail.com>
```

To get a Gmail App Password:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled
3. Go to App Passwords (search for it in Google Account settings)
4. Generate a password for "Mail" — use this as `SMTP_PASS`

Start the backend:

```bash
npm run dev    # Development (auto-restart on changes)
npm start      # Production
```

The server will start on `http://localhost:5000`.

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The app will open on `http://localhost:5173`.

### Step 4: Bootstrap the Admin Account

```bash
curl -X POST http://localhost:5000/api/admin/provision-first-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@event.com", "password": "Admin@123"}'
```

Log in with these credentials. From the admin panel, create organizer accounts.

### Step 5: Create an Organizer & Start Using

1. Log in as admin → "Manage Clubs/Organizers" → Create organizer → Copy credentials
2. Log in as organizer → Create events
3. Sign up as participant (separate browser/incognito) → Browse events → Register → Test full flow

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `PORT` | No | Server port (default: 5000) |
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP server port |
| `SMTP_SECURE` | No | Use TLS (`true`/`false`) |
| `SMTP_USER` | No | SMTP username/email |
| `SMTP_PASS` | No | SMTP password/app password |
| `EMAIL_FROM` | No | Sender display name and email |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## API Route Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register participant account |
| POST | `/login` | Public | Login and receive JWT |
| GET | `/verify` | Protected | Validate stored token |
| GET | `/profile` | Protected | Get user profile |
| PUT | `/profile` | Protected | Update user profile |
| POST | `/change-password` | Protected | Change password |

### Events (`/api/events`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List published events |
| GET | `/public/:id` | Public | Get single event (public view) |
| POST | `/` | Organizer | Create event |
| GET | `/my-events` | Organizer | List organizer's events |
| PUT | `/:id` | Organizer | Update event |
| GET | `/:id` | Organizer | Get event with analytics |
| DELETE | `/:id` | Organizer | Delete event + registrations |
| POST | `/:id/register` | Participant | Register for event |
| GET | `/:id/attendees` | Organizer | List attendees |
| PATCH | `/:id/status` | Organizer | Change event status |
| PATCH | `/:id/cancel` | Organizer | Cancel event |
| GET | `/analytics` | Admin | Platform analytics |

### Registrations (`/api/registrations`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/my-events` | Participant | My registered events |
| DELETE | `/:eventId` | Participant | Unregister |
| PATCH | `/attend/:ticketId` | Organizer | Mark attendance |
| GET | `/validate/:ticketId` | Organizer | Validate ticket |
| GET | `/payments/pending/:eventId` | Organizer | Pending payments list |
| PATCH | `/payments/approve/:registrationId` | Organizer | Approve payment |
| PATCH | `/payments/reject/:registrationId` | Organizer | Reject payment |
| POST | `/scan/:ticketId` | Organizer | QR scan attendance |
| PATCH | `/manual-override/:registrationId` | Organizer | Manual attendance override |
| GET | `/attendance/:eventId` | Organizer | Attendance dashboard data |
| GET | `/attendance/:eventId/export` | Organizer | Export attendance CSV |

### Discussions (`/api/discussions`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/:eventId` | Participant/Organizer | Get threaded messages |
| POST | `/:eventId` | Participant/Organizer | Post message or reply |
| PATCH | `/message/:messageId/delete` | Participant/Organizer | Soft delete message |
| PATCH | `/message/:messageId/pin` | Organizer | Toggle pin |
| POST | `/message/:messageId/react` | Participant/Organizer | Toggle emoji reaction |
| GET | `/:eventId/unread` | Participant/Organizer | Unread message count |

### Feedback (`/api/feedback`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/:eventId` | Participant | Submit/update feedback |
| GET | `/:eventId` | Organizer | Get feedback with stats |
| GET | `/:eventId/mine` | Participant | Get own feedback |

### Admin (`/api/admin`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/provision-first-admin` | Public (one-time) | Bootstrap admin account |
| POST | `/create-organizer` | Admin | Create organizer account |
| GET | `/organizers` | Admin | List all organizers |
| POST | `/reset-organizer-password` | Admin | Direct password reset |
| PATCH | `/organizers/:id/toggle` | Admin | Enable/disable organizer |
| DELETE | `/organizers/:id` | Admin | Delete organizer |
| POST | `/reset-request` | Organizer | Submit reset request |
| GET | `/my-reset-requests` | Organizer | Own request history |
| GET | `/reset-requests` | Admin | All reset requests |
| PATCH | `/reset-requests/:id/approve` | Admin | Approve reset request |
| PATCH | `/reset-requests/:id/reject` | Admin | Reject reset request |

### Organizers (`/api/organizer`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List all organizers |
| GET | `/:id` | Public | Organizer detail with events |
| GET | `/followed` | Participant | Followed organizers list |
| POST | `/:id/follow` | Participant | Follow organizer |
| DELETE | `/:id/follow` | Participant | Unfollow organizer |

### Preferences (`/api/preferences`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/interests` | Protected | Available interest categories |
| GET | `/organizers` | Protected | Available organizers list |
| GET | `/` | Participant | Current preferences |
| POST | `/update` | Participant | Save preferences |
| POST | `/skip` | Participant | Skip onboarding |
| GET | `/recommended-events` | Participant | Recommended events |

---

## Folder Structure

```
mern-app/
│
├── backend/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── discussionController.js
│   │   ├── eventController.js
│   │   ├── feedbackController.js
│   │   ├── organizerController.js
│   │   ├── preferencesController.js
│   │   ├── registrationController.js
│   │   └── taskController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   │
│   ├── models/
│   │   ├── DiscussionMessage.js
│   │   ├── Event.js
│   │   ├── Feedback.js
│   │   ├── PasswordResetRequest.js
│   │   ├── Registration.js
│   │   ├── Task.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── discussionRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── feedbackRoutes.js
│   │   ├── organizerRoutes.js
│   │   ├── participantRoutes.js
│   │   ├── preferencesRoutes.js
│   │   ├── registrationRoutes.js
│   │   └── testRoutes.js
│   │
│   └── utils/
│       ├── emailService.js
│       ├── emailValidator.js
│       └── generateToken.js
│
├── frontend/
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   ├── vite.config.js
│   │
│   ├── public/
│   │   └── vite.svg
│   │
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       │
│       ├── assets/
│       │   └── react.svg
│       │
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── TaskForm.jsx
│       │   └── TaskItem.jsx
│       │
│       ├── context/
│       │   └── AuthContext.jsx
│       │
│       ├── pages/
│       │   ├── AdminAnalytics.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── BrowseEvents.jsx
│       │   ├── ClubsOrganizers.jsx
│       │   ├── CreateEvent.jsx
│       │   ├── EditEvent.jsx
│       │   ├── EventDetails.jsx
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── ManageOrganizers.jsx
│       │   ├── Onboarding.jsx
│       │   ├── OngoingEvents.jsx
│       │   ├── OrganizerDashboard.jsx
│       │   ├── OrganizerDetail.jsx
│       │   ├── OrganizerEventDetail.jsx
│       │   ├── ParticipantDashboard.jsx
│       │   ├── Profile.jsx
│       │   ├── QRScanner.jsx
│       │   └── Signup.jsx
│       │
│       ├── services/
│       │   └── api.js
│       │
│       ├── styles/
│       │   └── auth.css
│       │
│       └── utils/
│
└── README.md
```
