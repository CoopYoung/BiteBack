# WORKFLOW.md — Bite Back Session Workflow
# Immutable — the agent follows this file but never modifies it.

---

## Pre-Session Checklist

Complete every item before writing any code.

```bash
# 1. Confirm working directory
pwd
# Must be: /home/agentuser/projects/BiteBack

# 2. Confirm git remote
git remote -v
# Must show: origin → Gitea instance

# 3. Pull latest
git pull --rebase origin main
# Resolve any conflicts before proceeding

# 4. TypeScript baseline — must be clean before touching anything
npx tsc --noEmit
# Zero errors required.
# If pre-existing errors exist:
#   → document them in GOALS.md under "Agent Notes"
#   → do not fix them unless a current goal requires it
#   → proceed only with goals that do not overlap the erroring files

# 5. Test baseline
npm test -- --passWithNoTests --watchAll=false
# All tests green before any change.
# Pre-existing failures → document in GOALS.md "Blockers", investigate

# 6. Confirm branch
git branch --show-current
# Work on main unless GOALS.md specifies a feature branch
```

---

## Working Loop

Work through each goal in GOALS.md in order: P0 → P1 → P2.

### 1 — Understand the goal

Read it fully. Identify affected files using ARCHITECTURE.md screen
inventory and directory structure. For anything touching Supabase,
re-read the schema section. For anything touching navigation, re-read
the Expo Router section. Note your interpretation in GOALS.md if
anything is ambiguous.

### 2 — Write failing test first (new features and bug fixes)

```bash
npm test -- --testPathPattern="[TestFile]" --watchAll=false
# Confirm the new test fails before implementing
```

### 3 — Implement

Follow CONVENTIONS.md. Stay focused on the goal — do not refactor
unrelated code at the same time. No new hex values, no direct
Supabase imports in screens.

### 4 — Typecheck

```bash
npx tsc --noEmit
# Zero errors before continuing. Fix all errors introduced by your change.
```

### 5 — Test

```bash
npm test -- --passWithNoTests --watchAll=false
# All tests pass.
# If a previously-passing test now fails:
#   - Your change broke an assumption — fix it
#   - If you cannot fix it: git checkout -- [file], document blocker
```

### 6 — Commit

```bash
# Stage only files relevant to this goal
git add [specific files — never blind git add -A]

# Review staged changes
git diff --staged

# Verify no .env or secrets are staged
git diff --staged --name-only | grep -iE "\.env|secret|key" \
  && echo "WARNING: sensitive file staged — remove before committing"

# Commit
git commit -m "type(scope): description"
# See CONVENTIONS.md for type/scope reference
```

### 7 — Mark goal complete in GOALS.md

Move to "Completed ✓" with:
- Date (`YYYY-MM-DD`)
- Commit hash (`git rev-parse --short HEAD`)
- One-line note about any non-obvious decisions

---

## End-of-Session Procedure

After all goals are done, or when running low on context/tokens:

### 1 — Final typecheck

```bash
npx tsc --noEmit
# Zero errors. Do not push with type errors.
```

### 2 — Final test run

```bash
npm test -- --passWithNoTests --watchAll=false
# All pass. Do not push with failing tests.
```

### 3 — Update and commit GOALS.md

```bash
# Ensure all completed goals are marked, blockers documented,
# agent notes written
git add GOALS.md
git commit -m "chore: update GOALS.md — session $(date +%Y-%m-%d)"
```

### 4 — Push

```bash
git push origin main
```

**If push is rejected (remote has changes):**

```bash
git pull --rebase origin main
# Resolve conflicts if any
npx tsc --noEmit
npm test -- --passWithNoTests --watchAll=false
git push origin main
```

### 5 — Confirm push

```bash
git log origin/main --oneline -5
# Your commits must be visible here
```

### 6 — Output session summary

Print a brief summary:
- Goals completed (with commit hashes)
- Goals not reached and why
- Any blockers or notes for the developer
- Total number of commits this session

---

## Common Situations

### Supabase query returns empty unexpectedly
RLS policy is the most likely cause. Check:
1. Is the user authenticated? (`AuthContext.user` is non-null?)
2. Does the RLS policy allow SELECT for this user's data?
3. Is the `user_id` filter matching the authenticated user's UUID?
Document findings in GOALS.md under "Agent Notes".

### Expo Router navigation is broken after a file change
Check that:
1. The file is in the correct `app/` group (`(auth)` vs `(tabs)`)
2. The export is a default export (Expo Router requires default exports
   for screen files — this is the one exception to the named export rule)
3. `app/_layout.tsx` auth logic is untouched

**Note:** Expo Router screens use `export default function ScreenName()`
while shared components use named exports. This is intentional.

### TypeScript errors in files you did not write
Document in GOALS.md "Agent Notes". Do not fix pre-existing errors
unless they are in files you are already modifying for a current goal.

### A goal is much larger than expected
Break it into sub-goals. Add them to GOALS.md, complete as many as
possible, document clearly where you stopped and what remains.
Never leave the app in a broken state — all commits must typecheck
and pass tests.

### Test for a screen component is hard to write
Use `@testing-library/react-native`'s `render` with a mock navigation
context. Mock `lib/api.ts` and `contexts/AuthContext.tsx` at the module
level. The Supabase client must never be called in tests.

---

## Git Configuration Reference

Set once during initial setup. Verify if git behaves unexpectedly.

```bash
git config user.name         # Claude Agent
git config user.email        # agent@local.internal
git config pull.rebase       # true
git config credential.helper # store

git remote get-url origin
# http://agentuser:[TOKEN]@127.0.0.1:3000/agentuser/BiteBack.git
```
