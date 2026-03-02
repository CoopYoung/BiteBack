# ARCHITECTURE.md — Bite Back Architecture Reference
# Developer maintains this. Agent reads before modifying anything.
# If this file and the actual code disagree, the code is truth —
# update this file to match reality.

---

## Project Overview

**App name:** Bite Back
**Tagline:** "More bread for your bread"
**Purpose:** Crowdsourced calories-per-dollar scoring for restaurant
meals. Users scan receipts, get a value score, compete on leaderboards,
and earn badges for finding deals.
**Status:** Active development — MVP features complete, enhancements in progress
**Primary user:** Budget-conscious restaurant diners who want maximum
nutritional value per dollar spent

**Platform:** React Native with Expo (managed workflow)
**Language:** TypeScript (strict mode)
**Node version:** 16+ (see .nvmrc or package.json engines)
**Package manager:** npm
**Project directory:** `/home/agentuser/projects/BiteBack/`

---

## Repository Structure

```
BiteBack/
├── CLAUDE.md                    ← Agent directive (never modify)
├── GOALS.md                     ← Task list (agent updates)
├── ARCHITECTURE.md              ← This file (developer maintains)
├── CONVENTIONS.md               ← Code style (developer maintains)
├── WORKFLOW.md                  ← Session workflow (never modify)
│
├── app/                         ← Expo Router file-based navigation
│   ├── _layout.tsx              ← Root layout — auth gate lives here
│   ├── +not-found.tsx           ← 404 screen
│   ├── (auth)/                  ← Unauthenticated route group
│   │   ├── _layout.tsx          ← Auth stack layout
│   │   ├── index.tsx            ← Login screen
│   │   └── signup.tsx           ← Registration screen
│   └── (tabs)/                  ← Authenticated route group
│       ├── _layout.tsx          ← Tab bar configuration
│       ├── index.tsx            ← Home dashboard
│       ├── scan.tsx             ← Receipt camera / capture
│       ├── leaderboard.tsx      ← City + global rankings
│       ├── profile.tsx          ← User profile + badges
│       └── results.tsx          ← Receipt details + score
│
├── components/                  ← Shared reusable UI components
│   ├── Button.tsx
│   └── SplashScreen.tsx
│
├── contexts/                    ← React Context providers
│   └── AuthContext.tsx          ← Auth state, login, logout, signup
│
├── lib/                         ← Services and utilities
│   ├── supabase.ts              ← Supabase client (only import point)
│   ├── api.ts                   ← All Supabase queries + badge logic
│   └── utils.ts                 ← Pure helpers (cal/dollar calc, etc.)
│
├── constants/                   ← App-wide constants
│   └── colors.ts                ← Full color palette + heat map thresholds
│
├── types/                       ← TypeScript type definitions
│   ├── index.ts                 ← All shared types and interfaces
│   └── env.d.ts                 ← Expo env variable type declarations
│
├── assets/                      ← Images, fonts, icons
├── .env                         ← Secrets (gitignored — never commit)
├── .env.example                 ← Committed template, no real values
├── package.json
├── tsconfig.json                ← strict: true
├── babel.config.js
└── jest.config.js
```

---

## Navigation Architecture

Expo Router uses the `app/` directory structure as the route tree.
**Modifying file names or locations in `app/` changes live routes.**
Always read this section before touching any file in `app/`.

```
app/_layout.tsx  ←  Root layout
│
│  (reads AuthContext — if authenticated → (tabs), else → (auth))
│
├── (auth)/              ← Stack navigator, shown when logged out
│   ├── index            → /  — Login screen
│   └── signup           → /signup — Registration screen
│
└── (tabs)/              ← Bottom tab navigator, shown when logged in
    ├── index            → / (home tab) — Dashboard
    ├── scan             → /scan — Camera + receipt capture
    ├── leaderboard      → /leaderboard — Rankings
    ├── profile          → /profile — User profile + badges
    └── results          → /results — Receipt score details
```

**Auth gate:** `app/_layout.tsx` checks `AuthContext.user`. If null,
it redirects to `(auth)`. Never replicate this logic in individual
screens — one source of truth only.

**Deep links:** Not yet configured. When added, document here.

---

## State Management

**Approach:** React Context API
**Location:** `contexts/`

| Context | File | What it manages |
|---|---|---|
| AuthContext | `contexts/AuthContext.tsx` | Supabase auth session, user object, login/logout/signup methods |

**Rules:**
- UI-local state (modal open, form values) lives in component `useState`
- Shared cross-screen state that isn't auth goes in a new Context file
  in `contexts/` — do not add new concerns to AuthContext
- No Redux, Zustand, or other state libraries are approved
- AsyncStorage is used for offline-first caching, not as a state store

---

## Data Flow

```
User Action (camera, form, tap)
    ↓
Screen component (app/(tabs)/ or app/(auth)/)
    ↓
lib/api.ts  ←  single gateway for all Supabase operations
    ↓
lib/supabase.ts  ←  Supabase client (never import this into screens)
    ↓
Supabase (PostgreSQL + Auth + Realtime + Storage)
    ↓  (response)
lib/api.ts  →  AsyncStorage (cache for offline fallback)
    ↓
Screen state (useState / useEffect)
    ↓
UI render
```

**Key rule:** Screens never import from `lib/supabase.ts` directly.
All database operations go through `lib/api.ts`.

---

## Supabase Database Schema

All tables have Row Level Security (RLS) enabled. Queries that
silently return empty results are almost always an RLS policy issue.

### Core Tables

**users**
```
id            uuid  PK (matches Supabase auth.users.id)
email         text
username      text
city          text
total_scans   int   default 0
best_score    float
created_at    timestamptz
```

**receipts**
```
id            uuid  PK
user_id       uuid  FK → users.id
restaurant    text
total_spent   numeric
total_calories int
score         float  (calories / total_spent)
scanned_at    timestamptz
image_url     text   (Supabase Storage path)
```

**line_items**
```
id            uuid  PK
receipt_id    uuid  FK → receipts.id
name          text
price         numeric
calories      int
```

**item_medians**
```
id            uuid  PK
item_name     text
median_price  numeric
median_cals   int
sample_count  int
```

### Gamification & Social Tables

**badges**
```
id            uuid  PK
name          text   (e.g. "First Bite", "Value Wolf", "Deal Hunter")
description   text
icon          text   (emoji or asset name)
criteria      jsonb  (trigger rules)
```

**user_badges**
```
id            uuid  PK
user_id       uuid  FK → users.id
badge_id      uuid  FK → badges.id
earned_at     timestamptz
```

**posts**
```
id            uuid  PK
user_id       uuid  FK → users.id
receipt_id    uuid  FK → receipts.id
caption       text
created_at    timestamptz
```

**item_tags**
```
id            uuid  PK
item_name     text
tag           text   (crowdsourced ingredient label)
submitted_by  uuid  FK → users.id
```

### Heat Map Score Thresholds

These are defined in `constants/colors.ts` and must be used everywhere
a score is displayed. Do not hardcode these numbers elsewhere.

```
EXCELLENT: score >= 150   →  #00D9A3 (teal / green)
FAIR:      50 <= score < 150  →  #F5A623 (amber)
POOR:      score < 50     →  #E74C3C (red)
```

---

## Environment Variables

Accessed only through `lib/supabase.ts`. Never read `.env` directly.
Never hardcode these values anywhere in the codebase.

```
EXPO_PUBLIC_SUPABASE_URL       Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY  Supabase anonymous key (safe for client)
```

`.env` is gitignored. `.env.example` is committed with empty values
as a template.

---

## Approved Dependencies

**The agent may only use packages listed here.** If a goal needs
an unlisted package, add it to GOALS.md under "Blockers" and do not
install it.

### Core Framework
```
react                          (Expo-managed version)
react-native                   (Expo-managed version)
expo                           (current SDK)
typescript                     strict mode
```

### Navigation
```
expo-router                    file-based routing
@react-navigation/native       peer dependency
@react-navigation/bottom-tabs  tab navigator
```

### Backend & Data
```
@supabase/supabase-js          Supabase client
@react-native-async-storage/async-storage   offline cache
```

### Camera & Media
```
expo-camera                    receipt capture
expo-image-picker              gallery fallback
expo-image-manipulator         image compression before upload
```

### UI
```
lucide-react-native            icons
expo-linear-gradient           gradient UI elements (if used)
```

### Testing
```
jest                           test runner
@testing-library/react-native  component testing
@testing-library/jest-native   custom matchers
jest-expo                      Expo Jest preset
```

### Utilities
```
expo-constants                 app config access
expo-status-bar                status bar control
```

### Future (Not Yet Approved — Do Not Install)
```
# tesseract.js      — OCR (pending evaluation)
# nutritionix-api   — Nutrition data (pending API key)
# react-native-maps — Maps (future milestone)
```

### Explicitly Forbidden
```
# redux / @reduxjs/toolkit  — not needed, Context is sufficient
# moment / moment-timezone  — use Intl or date-fns if dates needed
# lodash                    — use native JS equivalents
```

---

## Key Invariants

Rules that must always be true. Agent must never write code that
violates these.

1. All Supabase operations go through `lib/api.ts` — screens and
   components never import `lib/supabase.ts` directly

2. All colors and score thresholds come from `constants/colors.ts` —
   no hex values or score numbers hardcoded anywhere else

3. Auth state is managed exclusively by `AuthContext.tsx` — no
   auth logic in individual screens

4. The `android/` and `ios/` directories (if they exist as a bare
   workflow export) are never modified by the agent

5. `.env` is never read directly and never committed — environment
   values are accessed only through the Expo public variable system
   in `lib/supabase.ts`

6. Every Supabase query has a try/catch and surfaces errors to the
   UI — silent failures are not acceptable

7. Receipt score calculation logic lives only in `lib/utils.ts` —
   never recalculate cal/dollar inline in a component

---

## Screen Inventory

| Screen | File | Route | Purpose |
|---|---|---|---|
| Login | `app/(auth)/index.tsx` | `/` (logged out) | Email/password login |
| Signup | `app/(auth)/signup.tsx` | `/signup` | New user registration |
| Dashboard | `app/(tabs)/index.tsx` | `/` (logged in) | Scan count, best score, recent meals |
| Scan | `app/(tabs)/scan.tsx` | `/scan` | Camera capture, gallery upload |
| Leaderboard | `app/(tabs)/leaderboard.tsx` | `/leaderboard` | City + global rankings |
| Profile | `app/(tabs)/profile.tsx` | `/profile` | User stats, badges, history |
| Results | `app/(tabs)/results.tsx` | `/results` | Receipt details, score, heat map |
| Not Found | `app/+not-found.tsx` | `*` | 404 fallback |

---

## Known Technical Debt

Intentional shortcuts — do not "fix" without being told to.

- **Manual calorie entry:** Calories are currently entered manually
  by the user. OCR and Nutritionix API integration are planned but
  not yet implemented. Do not block scan flow on automated lookup.

- **No rate limiting:** API calls to Supabase have no client-side
  rate limiting. Acceptable for MVP — track as future work.

- **City is a free-text field:** users.city is a plain string with
  no validation or normalization. Leaderboard city grouping uses
  exact string matching. This is intentional for MVP simplicity.

---

## What the Agent Must Never Touch

| Path | Reason |
|---|---|
| `.env` | Contains live Supabase credentials |
| `android/` | Native project — requires human review |
| `ios/` | Native project — requires human review |
| `app/_layout.tsx` auth logic | Root auth gate — changes affect all screens |
| `constants/colors.ts` heat map thresholds | Product decision — require explicit instruction |
