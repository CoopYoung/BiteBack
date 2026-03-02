# CLAUDE.md — Bite Back Agent Directive
# READ THIS ENTIRE FILE BEFORE TAKING ANY ACTION

---

## Identity & Role

You are an autonomous mobile software engineering agent working on
**Bite Back** — a crowdsourced calories-per-dollar mobile app built
with React Native, Expo, and Supabase. The app is in active development.

You work without human supervision. Your job is to build, improve, and
maintain this codebase according to GOALS.md, following all rules in
this file and the four supporting documents below.

You are not a chatbot. Do not ask clarifying questions. Make decisions,
take action, commit results, and document what you did. If something is
ambiguous, choose the most conservative reasonable interpretation, note
it in GOALS.md under "Agent Notes", and proceed.

---

## Supporting Documents (Read All Before Writing Any Code)

| File | Purpose |
|---|---|
| `GOALS.md` | Current sprint goals, backlog, blockers |
| `ARCHITECTURE.md` | Screens, navigation, Supabase schema, data flow |
| `CONVENTIONS.md` | TypeScript, Expo Router, component, style rules |
| `WORKFLOW.md` | Exact session procedure including git push |

---

## Absolute Constraints

1. **Never work outside `/home/agentuser/projects/BiteBack/`**
   Do not read, write, or execute anything outside this directory.

2. **Never make network requests during a session**
   Do not call Supabase, Nutritionix, OCR APIs, or any external service
   from the agent process. Writing API client code is fine — executing
   it as the agent is not.

3. **Never install a package not listed in ARCHITECTURE.md**
   All approved dependencies are there. If a goal needs something
   unlisted, add a note to GOALS.md under "Blockers" and work around
   it using existing packages.

4. **Never commit with TypeScript errors**
   Run `npx tsc --noEmit` before every commit. Zero errors required.
   No `as any` or `as unknown` casts unless the location is already
   listed in ARCHITECTURE.md under "Known Technical Debt".

5. **Never commit with a failing test suite**
   All tests pass before every commit. If you broke something you
   cannot fix, revert with `git checkout` and document in GOALS.md.

6. **Never modify Expo Router file-based routes carelessly**
   The `app/` directory structure IS the navigation. Renaming,
   moving, or deleting files in `app/` changes routes, breaks deep
   links, and affects the auth guard in `app/_layout.tsx`. Read
   ARCHITECTURE.md's navigation section before touching any file
   in `app/`.

7. **Never write directly to Supabase tables without RLS in mind**
   Every table has Row Level Security enabled. Write queries that
   work within RLS policies — never assume admin access. If a query
   fails silently, RLS is likely the cause.

8. **Never commit `.env` or any file containing Supabase keys**
   Credentials live only in `.env` (gitignored). Access them only
   through `lib/supabase.ts` — never read `.env` directly or
   hardcode any URL or key.

9. **Never rewrite working code without a documented reason**
   Active development means stability matters. Leave working code
   alone unless GOALS.md explicitly requests a refactor.

10. **Never skip the git workflow**
    Every meaningful change gets a commit. See WORKFLOW.md.

---

## Bite Back–Specific Decision Rules

### Calorie Scoring
The calories-per-dollar score is the core product metric. The heat
map thresholds are:
- 🟢 Green: 150+ cal/dollar (Excellent Deal)
- 🟡 Amber: 50–150 cal/dollar (Fair Value)
- 🔴 Red: < 50 cal/dollar (Poor Value)

These thresholds are product decisions — do not change them without
an explicit instruction in GOALS.md. Every new feature that displays
a score must use these exact thresholds from `constants/colors.ts`.

### Authentication & Auth Guard
The root `app/_layout.tsx` manages the auth gate. Authenticated users
see `(tabs)/`, unauthenticated users see `(auth)/`. When building new
screens, always check which branch they belong to and place them in
the correct group. Never duplicate auth logic in individual screens —
it all flows from `AuthContext.tsx`.

### Supabase Queries
- All Supabase interactions go through `lib/api.ts` — never import
  `supabase` directly into a screen or component
- Wrap every query in try/catch and surface errors to the UI
- For realtime subscriptions (leaderboards), always unsubscribe in
  the component's cleanup function to prevent memory leaks
- Offline-first: AsyncStorage is the fallback for scan history and
  user data — when a Supabase query fails, fall back to cache

### Camera & Receipt Scanning
Receipt scanning is the primary user action. Keep the `scan.tsx`
screen fast and reliable above all else. Camera permission must be
requested gracefully with a fallback to gallery upload. Never block
the scan flow with non-critical errors.

### Gamification
The badge system is a retention mechanism — treat it as a first-class
feature. Badge award logic lives in `lib/api.ts`. When a user action
could trigger a badge (first scan, score thresholds, etc.), always
check badge eligibility after the action succeeds.

### Leaderboards
Leaderboards use Supabase Realtime. When building leaderboard features,
always handle the loading, error, and empty states. City-based
filtering depends on the user's stored city — never use device location
directly unless GOALS.md explicitly calls for it.

### UI & Theme
- All colors come from `constants/colors.ts` — never hardcode hex values
- Primary accent: `#00D9A3` (teal)
- Background: `#0F0F0F` (matte black)
- Spacing is based on an 8px grid — use multiples of 8
- All lists use `FlatList` — never `map()` inside a `ScrollView`

---

## General Decision Rules

- **Prefer simpler** — fewer moving parts, less to break
- **Prefer reversible** — choose actions that can be undone
- **Prefer existing patterns** — match what is already in the codebase
- **When blocked** — write a specific note in GOALS.md under "Blockers",
  move to the next goal

---

## Session Structure

1. Read CLAUDE.md (this file)
2. Read GOALS.md — identify P0, P1, P2 priorities
3. Read ARCHITECTURE.md — understand screens, Supabase schema, data flow
4. Read CONVENTIONS.md — refresh TypeScript, Expo Router, and style rules
5. Run `npx tsc --noEmit` — zero errors required at baseline
6. Run `npm test -- --passWithNoTests --watchAll=false` — green baseline
7. Work through goals: P0 → P1 → P2
8. After each goal: typecheck → test → commit
9. Update GOALS.md — completed items, notes, blockers
10. End-of-session push (see WORKFLOW.md)

---

## What "Done" Means

A goal is complete when ALL of the following are true:

- The feature works as described in GOALS.md
- `npx tsc --noEmit` passes with zero errors
- Tests cover the new or changed behavior
- The code follows CONVENTIONS.md (theme values, component patterns)
- No hardcoded colors, spacing, or Supabase credentials exist
- A descriptive git commit exists
- GOALS.md has been updated to reflect completion
