#!/bin/bash
# start-agent.sh — Launch an autonomous Claude Code session for Bite Back.
# Run manually or schedule via cron.

set -e

PROJECT_DIR="/home/agentuser/projects/BiteBack"
LOG_DIR="/home/agentuser/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d-%H%M)
SESSION_LOG="$LOG_DIR/claude-${TIMESTAMP}.log"

echo "=== Bite Back Session: $TIMESTAMP ===" | tee -a "$LOG_DIR/sessions.log"

# ---------------------------------------------------------------
# Pre-flight
# ---------------------------------------------------------------
if [ ! -d "$PROJECT_DIR" ]; then
  echo "ERROR: $PROJECT_DIR not found" | tee -a "$LOG_DIR/sessions.log"
  exit 1
fi

cd "$PROJECT_DIR"

echo "Pulling from remote..." | tee -a "$SESSION_LOG"
git pull --rebase origin main 2>&1 | tee -a "$SESSION_LOG" || \
  echo "Pull skipped — continuing with local state" | tee -a "$SESSION_LOG"

# ---------------------------------------------------------------
# Launch agent
# ---------------------------------------------------------------
echo "Launching agent..." | tee -a "$LOG_DIR/sessions.log"

claude \
  --dangerously-skip-permissions \
  --output-format text \
  -p "
You are starting an autonomous coding session on Bite Back — a
TypeScript React Native + Expo + Supabase calories-per-dollar app.

Follow these steps in exact order:

1. Read CLAUDE.md completely — pay special attention to the
   Bite Back–specific rules (score thresholds, Supabase RLS,
   Expo Router auth gate, no direct supabase imports in screens)

2. Read GOALS.md — identify all P0 and P1 goals for this session.
   Note any pre-existing blockers.

3. Read ARCHITECTURE.md — understand which screens exist, the
   Supabase schema, the navigation structure, and approved packages
   before modifying a single file

4. Read CONVENTIONS.md — the TypeScript, component, styling, and
   Supabase query patterns you must follow exactly

5. Run: npx tsc --noEmit
   If pre-existing errors exist, document in GOALS.md Agent Notes
   and proceed only with goals not overlapping the erroring files

6. Run: npm test -- --passWithNoTests --watchAll=false
   Establish the green baseline before any change

7. Work through goals P0 → P1 → P2
   After each goal: npx tsc --noEmit → npm test → git commit
   Use conventional commit format: type(scope): description
   Scopes: auth, scan, results, leaderboard, profile, dashboard,
           api, utils, badges, theme, supabase, navigation, deps

8. End of session:
   a. npx tsc --noEmit — must be clean
   b. npm test -- --passWithNoTests --watchAll=false — all pass
   c. Update GOALS.md (completed items, agent notes, blockers)
   d. git add GOALS.md && git commit -m 'chore: update GOALS.md'
   e. git push origin main
   f. git log origin/main --oneline -5 — confirm push
   g. Print session summary: goals done, goals skipped, commit hashes

Follow WORKFLOW.md for all git and testing procedures.
Never import lib/supabase.ts in screens. Never hardcode colors.
Do not ask questions. Make decisions and take action.
" 2>&1 | tee -a "$SESSION_LOG"

# ---------------------------------------------------------------
# Post-session report
# ---------------------------------------------------------------
echo "" | tee -a "$LOG_DIR/sessions.log"
echo "=== Session done: $(date) ===" | tee -a "$LOG_DIR/sessions.log"
echo "--- Commits ---" | tee -a "$LOG_DIR/sessions.log"
git log --oneline --since="4 hours ago" 2>/dev/null \
  | tee -a "$LOG_DIR/sessions.log"
echo "Log: $SESSION_LOG" | tee -a "$LOG_DIR/sessions.log"
echo "=================================" | tee -a "$LOG_DIR/sessions.log"
