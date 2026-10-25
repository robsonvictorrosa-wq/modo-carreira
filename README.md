# Modo Carreira FC 27 (multiplayer) – Etapa 1
- `node import.js` → gera `data/game.db` (SQLite) a partir de `data/fc27.json`
- `./start.sh` → sobe o servidor em background na porta 3027
- Tabelas users/rooms/room_* já criadas para as etapas 2–4 (estado por sala).
- Publicação: neste box só sai HTTP(S) via proxy; cloudflared (porta 7844), localtunnel, pinggy (SSH) e tunnelmole falharam. Caminho sugerido: deploy no Render.

## Etapa 2 – Multiplayer
- Usuários/sessões/salas em Postgres (`DATABASE_URL`, qualquer Postgres; SSL automático para hosts externos, `PGSSL=0/1` força). Schema em `pg.sql`, criado no boot.
- Estado por sala: `room_clubs` (orçamento de todos os clubes, copiado ao criar a sala) e `room_players` (copy-on-write: só jogadores alterados).
- Universo FC27 continua read-only no SQLite gerado no build.
