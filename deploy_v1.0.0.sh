#!/bin/bash
set -e

echo ""
echo "============================================================"
echo "  CareMatch360 — Build & Deploy"
echo "============================================================"
echo ""

echo "[1/4] Checking Node..."
node --version > /dev/null 2>&1 && echo "    ✓ Node found" || { echo "    ✗ Node not found"; exit 1; }

echo "[2/4] Installing dependencies..."
npm install --legacy-peer-deps --silent && echo "    ✓ Done"

echo "[3/4] Building..."
npm run build && echo "    ✓ Build successful"

echo "[4/4] Deploying to Vercel..."
# --yes skips all prompts; if .vercel/project.json exists it auto-links
npx vercel --prod --yes

echo ""
echo "✓ Done!"
