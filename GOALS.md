# GOALS.md — Bite Back Session Goals & Backlog
# Agent: read at session start, update at session end.
# Developer: this is your primary control surface.

---

## How to Use This File

Fill in goals before each session. The agent works through them in
priority order (P0 → P1 → P2) and updates this file when done.

When writing goals, be specific about:
- Which screen or component is affected
- What the acceptance criteria is
- Any Supabase tables or API functions involved

**Priority levels:**
- `P0` — Must complete this session, blocks other work
- `P1` — Should complete once P0s are done
- `P2` — Do only if tokens and time allow
- `BLOCKED` — Cannot proceed — reason documented below

---

## Current Sprint Goals

### P0 — Critical

(No P0 goals were set for this session. Agent identified and fixed
critical baseline issues and architecture violations instead.)

### P1 — Important

(No P1 goals set.)

### P2 — Optional This Session

(No P2 goals set.)

---

## Backlog (Future Sessions)

Ordered roughly by priority. Move items up when ready.

### Near-term
- [ ] OCR integration — wire Tesseract.js or Google Vision into scan flow
- [ ] Nutritionix API — replace manual calorie entry with API lookup
- [ ] Advanced food item matching — fuzzy matching for crowdsourced items
- [ ] Social sharing — export score card to Instagram/TikTok format

### Medium-term
- [ ] Real-time multi-user sync — Supabase Realtime beyond leaderboards
- [ ] Maps integration — location-based restaurant discovery
- [ ] Predictive price analysis — trend data per restaurant/item
- [ ] Crowdsourced restaurant reviews

### Long-term
- [ ] Premium subscription tier — design feature gating
- [ ] Personalized recommendations — ML-based scoring
- [ ] API rate limiting on backend
- [ ] GDPR data export and deletion flows (CCPA compliance)

---

## Completed ✓

The agent moves finished items here with date, commit hash, and notes.

### MVP (Pre-agent baseline — completed before agent sessions began)
- [x] **User authentication (email/password)** — Supabase Auth via AuthContext
- [x] **Receipt camera capture** — app/(tabs)/scan.tsx
- [x] **Calories-per-dollar calculation** — lib/utils.ts
- [x] **Heat map visualization** — color thresholds in constants/colors.ts
- [x] **Receipt details entry** — app/(tabs)/results.tsx
- [x] **Scan history** — app/(tabs)/index.tsx dashboard
- [x] **User profiles** — app/(tabs)/profile.tsx
- [x] **Leaderboards** — app/(tabs)/leaderboard.tsx
- [x] **Badge system** — user_badges + badges tables, lib/api.ts
- [x] **Dark theme UI** — constants/colors.ts, matte black + teal

- [x] **Fix pre-existing TypeScript errors and broken test runner** — 2026-03-02, commit 0f2654a
  Notes: jest.config.ts had two typos (setupFilesAfterSetup, coverageThresholds),
  scan.tsx used direct supabase import, storage.ts referenced missing FileSystem.EncodingType,
  receipt.test.ts had wrong relative import paths, AuthContext.test.tsx had Jest hoisting issue.

- [x] **Enforce API layer architecture — remove direct supabase imports from screens** — 2026-03-02, commit 19409da
  Notes: All 4 tab screens (index, results, leaderboard, profile) violated the key invariant
  by importing supabase directly. Added fetchRecentReceipts, fetchLeaderboard, fetchUserBadges,
  saveReceipt to lib/api.ts. Added getScoreColor, getScoreLabel utilities to lib/utils.ts.
  Converted home and leaderboard from map()+ScrollView to FlatList. Added error states with
  retry buttons to all screens.

- [x] **Add tests for new API query functions and score utilities** — 2026-03-02, commit ac8c0e5
  Notes: 16 new tests covering fetchRecentReceipts, fetchLeaderboard, fetchUserBadges,
  saveReceipt, getScoreColor, getScoreLabel, threshold constants. Total: 62 tests, 7 suites.

---

## Blockers

Agent documents anything that stopped progress here.

<!--
Format:
**BLOCKER: [Short title]**
- Attempted: [what was tried]
- Error: [exact error or description]
- Needs from developer: [specific action or info required]
- Workaround tried: [if any]
-->

---

## Agent Notes

Agent writes observations the developer should see after each session.
Supabase RLS surprises, performance concerns, type system gaps,
anything worth flagging.

[2026-03-02] — **Architecture violation was widespread.** Every tab screen imported
`lib/supabase.ts` directly, violating the #1 key invariant. This has been fixed — all
screens now go through `lib/api.ts`. The `lib/api.ts` file previously only had nutrition
mock data; it now serves as the proper data gateway per ARCHITECTURE.md.

[2026-03-02] — **Test infrastructure was entirely broken.** Two typos in jest.config.ts
(`setupFilesAfterSetup` and `coverageThresholds`) meant no tests could run at all. The
AuthContext test also had a Jest hoisting issue that prevented mock setup. All fixed.

[2026-03-02] — **Missing utility functions.** CONVENTIONS.md references `getScoreColor` and
score threshold constants (`SCORE_EXCELLENT`, `SCORE_FAIR_MIN`) but they didn't exist in
`lib/utils.ts`. Added them along with `getScoreLabel`.

[2026-03-02] — **No sprint goals set.** GOALS.md had empty P0/P1/P2 templates. Developer
should populate specific goals before next session for maximum productivity.
