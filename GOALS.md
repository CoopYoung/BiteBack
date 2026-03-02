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

(All completed — see Completed section below.)

### P1 — Important

(All completed.)

### P2 — Optional This Session

(All completed.)

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

- [x] **Apply missing database migrations** — 2026-03-02, via Supabase MCP
  Notes: Applied server_functions_and_triggers (triggers: updated_at, recalculate_user_stats,
  check_and_award_badges, update_item_medians) and storage_and_delete_policies (receipt-images
  bucket, DELETE/UPDATE policies). Also applied add_city_to_users migration.

- [x] **Profile FlatList + edit profile + share button** — 2026-03-02, commit d6ba792
  Notes: Converted profile badges from ScrollView+map to FlatList (numColumns=3). Added inline
  edit mode for display_name and city. Added updateUserProfile() to api.ts, refreshUser() to
  AuthContext. Wired Share button on results using RN Share.share(). Added city to User type.
  Tests: updateUserProfile, fetchReceipt. Total: 67 tests.

- [x] **Tappable receipt cards + detail view mode** — 2026-03-02, commit 056ce34
  Notes: Dashboard receipt cards now navigate to results with receiptId. Results screen detects
  view mode (receiptId without imageUri) and shows read-only view with pre-computed score.
  Added fetchReceipt() to api.ts. Loading/error/retry states for view mode.

- [x] **Leaderboard city filtering** — 2026-03-02, commit 31189ab
  Notes: Added optional city param to fetchLeaderboard(). "My City" tab appears when user.city
  is set. Uses exact string match on users.city. Test: city-filtered leaderboard.

- [x] **AsyncStorage offline cache fallback** — 2026-03-02, commit 5df88bf
  Notes: fetchRecentReceipts, fetchLeaderboard, fetchUserBadges now cache on success and read
  from cache on failure. Added global AsyncStorage mock for test suite. 5 new cache tests.
  Total: 73 tests, 7 suites.

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

[2026-03-02] — **Database triggers now live.** Server-side triggers for recalculate_user_stats,
check_and_award_badges, update_item_medians, and updated_at are active. The client-side user
stats update in saveReceipt() is now redundant (server trigger handles it), but kept for
defense-in-depth. Developer may remove the client-side update in a future cleanup.

[2026-03-02] — **Security advisors flagged mutable search_path on all trigger functions.** All
5 functions (update_updated_at, recalculate_user_stats, check_and_award_badges,
refresh_leaderboard_ranks, update_item_medians) have WARN-level search_path issues. Non-blocking
for MVP but should be addressed before production. See:
https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

[2026-03-02] — **73 tests across 7 suites.** Up from 62 at session start. New tests cover
updateUserProfile, fetchReceipt, city-filtered leaderboard, and 5 AsyncStorage cache fallback
scenarios.
