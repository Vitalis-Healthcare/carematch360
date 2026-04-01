#!/bin/bash
# Run this ONCE after your first successful vercel link.
# It saves your project config so future deploys are fully automated.

if [ ! -f ".vercel/project.json" ]; then
  echo "No .vercel/project.json found. Run 'npx vercel' first to link the project."
  exit 1
fi

mkdir -p "$HOME/.carematch360-vercel"
cp .vercel/project.json "$HOME/.carematch360-vercel/project.json"
echo "✓ Vercel link saved. Future deploys will be fully automated."
