#!/bin/bash
# Reinicia servidor + túnel público. URL nova fica em tunnel.log / PUBLIC_URL.txt
cd "$(dirname "$0")"
pkill -f "node server.js"; pkill -f "cloudflared tunnel"
[ -f data/game.db ] || node import.js
setsid nohup node server.js > server.log 2>&1 &
# túnel público: ver README (cloudflared bloqueado na porta 7844 neste box)

echo "Servidor em http://localhost:3027"
