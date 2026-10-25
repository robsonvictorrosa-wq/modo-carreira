# Modo Carreira FC 27 (multiplayer) – Etapa 1
- `node import.js` → gera `data/game.db` (SQLite) a partir de `data/fc27.json`
- `./start.sh` → sobe o servidor em background na porta 3027
- Tabelas users/rooms/room_* já criadas para as etapas 2–4 (estado por sala).
- Publicação: neste box só sai HTTP(S) via proxy; cloudflared (porta 7844), localtunnel, pinggy (SSH) e tunnelmole falharam. Caminho sugerido: deploy no Render.
