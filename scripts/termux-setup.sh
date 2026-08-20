#!/data/data/com.termux/files/usr/bin/bash
# Hotspot Messenger — Termux one-shot setup
set -e

echo "📡 Hotspot Messenger — Termux setup"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "Installing Node.js..."
  pkg update -y
  pkg install -y nodejs git
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "Installing npm dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Start the server with:"
echo "  npm start"
echo ""
echo "Friends join at the URL shown (same Wi‑Fi or hotspot)."
