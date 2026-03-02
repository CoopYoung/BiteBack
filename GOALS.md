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

- [ ] **[Task title]**
  What: [Exact description of what needs to be built or fixed]
  Screen/Component: [e.g. app/(tabs)/scan.tsx, components/Button.tsx]
  Supabase tables affected: [e.g. receipts, line_items — or "none"]
  Acceptance: [Observable proof it is done]
  Notes: [Constraints, edge cases, context]

### P1 — Important

- [ ] **[Task title]**
  What: [Description]
  Screen/Component: [file path]
  Acceptance: [How you know it is done]

### P2 — Optional This Session

- [ ] **[Task title]**
  What: [Description]

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

<!--
Agent: add completed items below using this format:
- [x] **[Task title]** — YYYY-MM-DD, commit [hash]
  Notes: [brief note about implementation decisions]
-->

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

<!--
Agent: write below this line. Include the date.
[YYYY-MM-DD] — [Note]
-->
