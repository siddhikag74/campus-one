# CampusOne — Centralized College Campus Discovery & Opportunities Platform

> **AI/ML Full-Stack Prototype** built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB (Mongoose), JWT Authentication, and Meta API integration layers.

---

## 1. Project Overview

**CampusOne** is a mobile-first campus discovery and opportunity management platform tailored for university students. It empowers students to discover upcoming hackathons, tech workshops, cultural nights, and athletic tournaments, track multi-round competition progression, register with pre-filled academic credentials, submit verified peer reviews on concluded events, and receive personalized recommendations driven by behavioral campus signals.

### Key Features
- **Mobile-First Responsive Phone Frame**: Seamless native mobile experience on phones, and an elegant simulated iPhone 16 Pro bezel (390×844px tablet / 410×870px desktop) on larger displays set against a radial indigo mesh background.
- **AI/ML Recommendation Engine (`/api/recommendations`)**: Rule-based multi-signal scoring engine (analyzing followed clubs, saved events, category affinity, urgent deadlines, and popularity) architected for zero-friction drop-in replacement with production ML models.
- **Real-Time Unified Search & Status Filters**: Instantaneous client-side filtering across event names, organizing clubs, campus venues, categories, and tags.
- **Multi-Round Competition Tracker**: Visual round progression timelines (completed, in-progress, upcoming) and profile shortlist milestones.
- **Strict Post-Event Review System**: Interactive 4-aspect 5-star ratings (Content, Organisation, Venue, Overall) restricted exclusively to concluded/missed events (`event.status === 'missed'`).
- **Interactive Calendar (September 2026)**: Month navigation with color-coded classification dots:
  - 🟢 **Green**: Registered event
  - 🔴 **Red**: Registration deadline approaching
  - 🟣 **Indigo**: Other campus event
- **Meta Integration Architecture**: Official Graph API abstractions for Instagram content extraction and WhatsApp Cloud API event confirmations with fallback demo simulation mode.

---

## 2. Architecture & Directory Layout

The repository maintains strict separation between client, server, models, and third-party integrations:

```
campus-one/
├── .env.example                     # Environment template
├── package.json                     # Root orchestrator scripts (concurrently)
├── README.md                        # Documentation & setup guide
├── server/                          # Backend API (Node.js + Express)
│   ├── .env                         # Server environment configuration
│   ├── package.json
│   ├── server.js                    # Express bootstrap & auto-seeder
│   ├── config/
│   │   └── db.js                    # Mongoose connection with MongoMemoryServer fallback
│   ├── models/
│   │   ├── User.js                  # Student profile & academic identifiers
│   │   ├── Club.js                  # Campus society data & follower counters
│   │   ├── Event.js                 # Event schema with alerts, rounds, and media
│   │   ├── Registration.js          # Student event & team registrations
│   │   ├── Notification.js          # Categorized student alerts
│   │   ├── Review.js                # 4-category 5-star student reviews
│   │   ├── SavedEvent.js            # User favorites mapping
│   │   └── ImportantEvent.js        # User watchlist mapping
│   ├── middleware/
│   │   ├── auth.js                  # JWT bearer verification & demo fallback
│   │   └── errorHandler.js          # Centralized error handler
│   ├── routes/
│   │   ├── auth.js                  # Demo login & JWT issuance
│   │   ├── events.js                # Events CRUD, register, favorites, reviews
│   │   ├── clubs.js                 # Club directories & follow toggle
│   │   ├── notifications.js         # In-app notifications & read states
│   │   ├── calendar.js              # Date-indexed month event dots
│   │   ├── profile.js               # User stats & 5-tab aggregation
│   │   ├── recommendations.js       # AI/ML signal ranking
│   │   └── webhooks.js              # Meta Instagram & WhatsApp webhooks
│   ├── services/
│   │   └── recommendationEngine.js  # Pluggable relevance scoring logic
│   ├── integrations/
│   │   └── meta/
│   │       ├── instagram.js         # Meta Instagram Graph API client
│   │       └── whatsapp.js          # Meta WhatsApp Cloud API dispatcher
│   └── seeds/
│       ├── seedData.js              # Sample clubs definition
│       └── seed.js                  # Complete database seed script
└── client/                          # Frontend SPA (React + Vite + Tailwind)
    ├── index.html                   # Nunito & Inter typography imports
    ├── package.json
    ├── vite.config.js               # Proxy setup to port 5050
    ├── tailwind.config.js           # Design system palette & shadows
    └── src/
        ├── index.css                # Global Tailwind directives & phone frame styles
        ├── App.jsx                  # Client routing & sub-screen state
        ├── main.jsx
        ├── context/
        │   ├── AuthContext.jsx      # Demo login & session synchronization
        │   ├── AppDataContext.jsx   # Shared state for favorites, follows, badges
        │   └── ToastContext.jsx     # Floating toast alert banners
        ├── services/
        │   └── api.js               # REST client for backend endpoints
        ├── components/
        │   ├── layout/ (AppShell, BottomNavigation, Header)
        │   ├── common/ (SearchBar, StatusTabs, CategoryChips, AlertBanner, RatingStars, Skeletons)
        │   ├── events/ (EventCard, EventGrid, EventInfoChip, RoundCard)
        │   └── clubs/  (ClubCard)
        └── screens/
            ├── HomeScreen.jsx
            ├── ExploreScreen.jsx
            ├── CalendarScreen.jsx
            ├── ProfileScreen.jsx
            ├── NotificationsScreen.jsx
            ├── EventDetailsScreen.jsx
            ├── RegistrationScreen.jsx
            ├── ClubDetailsScreen.jsx
            └── ReviewScreen.jsx
```

---

## 3. Tech Stack

- **Frontend**: React 18, Vite 5, Lucide React icons
- **Styling**: Tailwind CSS 3 (Palette: Primary `#5B4CF0`, Background `#F1F3F8`, Surface `#FFFFFF`)
- **Typography**: Nunito (`font-heading`), Inter (`font-body`)
- **Backend**: Node.js, Express 4
- **Database**: MongoDB using Mongoose 8 (with automated `mongodb-memory-server` fallback)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **API Standard**: REST with JSON payloads

---

## 4. Environment Variables

Create `.env` in `server/` or copy from `.env.example`:

```env
PORT=5050
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/campusone
JWT_SECRET=campusone_super_secure_jwt_secret_token_2026
NODE_ENV=development

# Meta Graph API Integration (Production / Optional)
# Leave blank to operate in simulated demo mode automatically
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
META_WEBHOOK_VERIFY_TOKEN=campusone_webhook_secret_2026
```

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js v18+ and npm installed

### Step 1: Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or navigate individually into `server` and `client` and run `npm install`)*

### Step 2: Seed the Database
Populate all 10 campus clubs, 27 realistic events across all categories, demo notifications, and Arjun Sharma's student profile:
```bash
npm run seed
```
> **Note**: If no local MongoDB daemon is running on port 27017, the server automatically starts an in-memory database using `mongodb-memory-server` and auto-seeds itself on initial launch!

### Step 3: Run the Development Server
Launch both backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5050/api`

---

## 6. Demo Login Credentials

For evaluation and hackathon testing, the application automatically authorizes as the default student persona:

- **Student**: Arjun Sharma
- **Email**: `arjun.sharma@dtu.ac.in`
- **Roll Number**: `23BCS1042`
- **Year & Branch**: 3rd Year, Computer Science & Engineering
- **College**: Delhi Technological University (DTU)
- **Password**: `campusone123`

The authentication middleware automatically provisions this session so you can immediately test favorites, registrations, club follows, and reviews without manual credential entry.

---

## 7. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/demo-login` | Authenticate as demo user Arjun Sharma |
| `GET` | `/api/auth/me` | Fetch authenticated student profile |
| `GET` | `/api/events` | List events (supports `?search=`, `?category=`, `?status=`) |
| `GET` | `/api/events/:id` | Get single event details with club & user states |
| `POST` | `/api/events/:id/register` | Register student or team for an event |
| `POST` | `/api/events/:id/save` | Add event to favorites |
| `DELETE` | `/api/events/:id/save` | Remove event from favorites |
| `POST` | `/api/events/:id/important` | Mark event as Important (Profile → Pending) |
| `DELETE` | `/api/events/:id/important` | Remove event from Important |
| `POST` | `/api/events/:id/reviews` | Submit 4-aspect review (Missed events ONLY) |
| `GET` | `/api/events/:id/reviews` | Retrieve student reviews for an event |
| `GET` | `/api/clubs` | List all clubs with upcoming event counts |
| `GET` | `/api/clubs/:id` | Get club details with upcoming & past events |
| `POST` | `/api/clubs/:id/follow` | Follow a campus club |
| `DELETE` | `/api/clubs/:id/follow` | Unfollow a campus club |
| `GET` | `/api/notifications` | Get notifications grouped by New and Earlier |
| `PATCH` | `/api/notifications/:id/read`| Mark specific notification as read |
| `PATCH` | `/api/notifications/read-all`| Mark all notifications as read |
| `GET` | `/api/calendar` | Get date-indexed events & classification dots (`?year=2026&month=9`) |
| `GET` | `/api/profile` | Get stats & 5 tabs (Registered, Pending, Shortlisted, Rejected, Saved) |
| `PUT` | `/api/profile` | Update student profile attributes |
| `GET` | `/api/recommendations` | AI/ML relevance scoring recommendations |
| `POST` | `/api/webhooks/meta/instagram` | Incoming Instagram Graph API webhook |
| `POST` | `/api/webhooks/meta/whatsapp` | Incoming WhatsApp Cloud API webhook |

---

## 8. Meta & WhatsApp Integration Setup

### Instagram Graph API Layer (`server/integrations/meta/instagram.js`)
1. Create a Meta Developer App at [developers.facebook.com](https://developers.facebook.com).
2. Add Instagram Graph API and configure permissions: `instagram_basic`, `pages_read_engagement`.
3. Set `META_APP_ID`, `META_APP_SECRET`, and `META_ACCESS_TOKEN` in `server/.env`.
4. Subscribe webhook endpoints to `POST /api/webhooks/meta/instagram`.

### WhatsApp Business Cloud API Layer (`server/integrations/meta/whatsapp.js`)
1. In the Meta Developer App, add WhatsApp product.
2. Retrieve your **Phone Number ID** and **System User Access Token**.
3. Set `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` in `server/.env`.
4. When students register for events via `/api/events/:id/register`, `sendWhatsAppNotification()` dispatches confirmation alerts directly to the student's phone. In demo mode (missing credentials), dispatch actions are logged cleanly to the console without interrupting application flow.

---

## 9. Known Limitations & Future Improvements

- **Production ML Scoring Model**: The recommendation engine currently operates on a transparent multi-factor rule-based scoring function (category affinity, club follows, saved signals, upcoming deadlines, popularity). Future iterations can connect an embeddings-based vector model (e.g. pgvector or Pinecone) via the existing `generateRecommendations()` function signature.
- **Push Notifications**: In-app notifications are fully operational; Web Push API / service workers can be added for mobile push notifications.
- **Live Payment Gateway**: Paid festival passes or ticketing can be integrated via Razorpay / Stripe.
