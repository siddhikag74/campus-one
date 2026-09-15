#!/bin/bash

# CampusOne — 1-Command Startup & Public Access Launcher
# Runs Backend + Frontend + Self-Healing Cloudflare Tunnel + Health Watchdog

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "🎓 Starting CampusOne with Self-Healing Public Access..."
echo "=========================================================="

# Ensure node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH."
    exit 1
fi

# Ensure dependencies are present
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 First-time initialization: Installing npm dependencies..."
    npm run install:all
fi

# Make cloudflared executable
if [ -f "bin/cloudflared" ]; then
    chmod +x bin/cloudflared
fi

# Launch the tunnel supervisor
node scripts/tunnel-supervisor.js
