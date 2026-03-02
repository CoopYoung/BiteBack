#!/bin/bash
# GIT_SETUP.sh — Run once to configure git push access for BiteBack.
# After this script succeeds, delete it: rm GIT_SETUP.sh
# Run as: agentuser (not root)

set -e

GITEA_URL="http://127.0.0.1:3000"
GITEA_USER="agentuser"
PROJECT_NAME="BiteBack"
PROJECT_DIR="/home/agentuser/projects/$PROJECT_NAME"

echo ""
echo "=== Bite Back — Git Push Setup ==="
echo "Project:  $PROJECT_DIR"
echo "Remote:   $GITEA_URL/$GITEA_USER/$PROJECT_NAME"
echo ""

# ---------------------------------------------------------------
# STEP 1: Git globals
# ---------------------------------------------------------------
echo "[1/6] Configuring git globals..."
git config --global user.name  "Claude Agent"
git config --global user.email "agent@local.internal"
git config --global pull.rebase true
git config --global credential.helper store
git config --global init.defaultBranch main
echo "      Done."

# ---------------------------------------------------------------
# STEP 2: Gitea token
# ---------------------------------------------------------------
echo ""
echo "[2/6] Gitea access token"
echo ""
echo "      1. Open $GITEA_URL in your browser"
echo "      2. Log in as $GITEA_USER"
echo "      3. Settings → Applications → Generate New Token"
echo "      4. Name: claude-agent-biteback"
echo "      5. Scopes: repo (all repo permissions)"
echo "      6. Generate and COPY the token (shown once only)"
echo ""
read -rsp "      Paste token (hidden): " GITEA_TOKEN
echo ""

if [ -z "$GITEA_TOKEN" ]; then
  echo "ERROR: No token entered."
  exit 1
fi

# ---------------------------------------------------------------
# STEP 3: Store credentials
# ---------------------------------------------------------------
echo ""
echo "[3/6] Storing credentials..."
echo "http://${GITEA_USER}:${GITEA_TOKEN}@127.0.0.1:3000" \
  > ~/.git-credentials
chmod 600 ~/.git-credentials
echo "      Stored in ~/.git-credentials (mode 600)"

# ---------------------------------------------------------------
# STEP 4: Configure remote
# ---------------------------------------------------------------
echo ""
echo "[4/6] Configuring git remote..."

if [ ! -d "$PROJECT_DIR" ]; then
  echo "      Creating project directory..."
  mkdir -p "$PROJECT_DIR"
  cd "$PROJECT_DIR"
  git init
  git checkout -b main
else
  cd "$PROJECT_DIR"
  git init 2>/dev/null || true
fi

git remote remove origin 2>/dev/null || true
git remote add origin \
  "http://${GITEA_USER}:${GITEA_TOKEN}@127.0.0.1:3000/${GITEA_USER}/${PROJECT_NAME}.git"

echo "      Remote: $(git remote get-url origin | sed 's/:.*@/:***@/')"

# ---------------------------------------------------------------
# STEP 5: Install agent directive files
# ---------------------------------------------------------------
echo ""
echo "[5/6] Installing agent directive files..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILES=(CLAUDE.md GOALS.md ARCHITECTURE.md CONVENTIONS.md WORKFLOW.md)

for f in "${FILES[@]}"; do
  if [ -f "$SCRIPT_DIR/$f" ]; then
    cp "$SCRIPT_DIR/$f" "$PROJECT_DIR/$f"
    echo "      Copied $f"
  else
    echo "      WARNING: $f not found — skipping"
  fi
done

# Ensure .env.example exists (safe to commit, no real values)
if [ ! -f "$PROJECT_DIR/.env.example" ]; then
cat > "$PROJECT_DIR/.env.example" << 'EOF'
# Copy this file to .env and fill in your values
# NEVER commit .env — it is gitignored
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EOF
  echo "      Created .env.example"
fi

# Ensure .env is gitignored
if [ ! -f "$PROJECT_DIR/.gitignore" ]; then
  touch "$PROJECT_DIR/.gitignore"
fi
if ! grep -q "^\.env$" "$PROJECT_DIR/.gitignore"; then
  echo ".env" >> "$PROJECT_DIR/.gitignore"
  echo "      Added .env to .gitignore"
fi

# ---------------------------------------------------------------
# STEP 6: Initial commit and push
# ---------------------------------------------------------------
echo ""
echo "[6/6] Initial commit and push..."

cd "$PROJECT_DIR"

# Create README if empty repo
if [ -z "$(git log --oneline 2>/dev/null)" ] && [ ! -f README.md ]; then
  cat > README.md << 'EOF'
# Bite Back

**"More bread for your bread"**

Crowdsourced calories-per-dollar mobile app — React Native + Expo + Supabase.
EOF
fi

git add CLAUDE.md GOALS.md ARCHITECTURE.md CONVENTIONS.md WORKFLOW.md \
  .env.example .gitignore README.md 2>/dev/null || true

if ! git diff --cached --quiet; then
  git commit -m "chore: add agent directive files for Bite Back"
else
  echo "      (nothing new to commit)"
fi

echo "      Pushing to $GITEA_URL..."
if git push -u origin main 2>&1; then
  echo "      Push successful."
else
  echo ""
  echo "      Push failed. Check:"
  echo "      - Repo exists: $GITEA_URL/$GITEA_USER/$PROJECT_NAME"
  echo "      - Token has write (repo) scope"
  echo "      - Gitea is running: systemctl status gitea"
  exit 1
fi

# ---------------------------------------------------------------
# Done
# ---------------------------------------------------------------
echo ""
echo "=== Setup complete ==="
echo ""
echo "The Bite Back agent can now:"
echo "  ✓  Read and write project files"
echo "  ✓  Run TypeScript compiler and tests"
echo "  ✓  Commit and push to Gitea"
echo ""
echo "Next steps:"
echo "  1. Open GOALS.md — add your first P0/P1 sprint goals"
echo "  2. Verify ARCHITECTURE.md matches your current package versions"
echo "  3. Start a session: ./start-agent.sh"
echo ""
echo "Security: delete this script now."
echo "  rm \"$0\""
