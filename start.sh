#!/bin/bash
# Reinicia servidor + túnel público. URL nova fica em tunnel.log / PUBLIC_URL.txt
cd "$(dirname "$0")"
pkill -f "node server.js"; pkill -f "cloudflared tunnel"
[ -f data/game.db ] || node import.js
setsid nohup node server.js > server.log 2>&1 &
setsid nohup ~/cloudflared tunnel --no-autoupdate --protocol http2 --url http://localhost:3027 > tunnel.log 2>&1 &
for i in $(seq 30); do U=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' tunnel.log | head -1); [ -n "$U" ] && break; sleep 1; done
echo "$U" | tee PUBLIC_URL.txt
