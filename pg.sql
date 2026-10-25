CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,nick TEXT UNIQUE NOT NULL,pass_hash TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INT REFERENCES users(id) ON DELETE CASCADE,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS rooms(id SERIAL PRIMARY KEY,code TEXT UNIQUE NOT NULL,name TEXT NOT NULL,owner_id INT REFERENCES users(id),max_managers INT NOT NULL DEFAULT 5,season INT NOT NULL DEFAULT 2026,status TEXT NOT NULL DEFAULT 'lobby',version INT NOT NULL DEFAULT 1,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS room_managers(room_id INT REFERENCES rooms(id) ON DELETE CASCADE,user_id INT REFERENCES users(id),club_id INT,joined_at TIMESTAMPTZ DEFAULT now(),PRIMARY KEY(room_id,user_id));
CREATE UNIQUE INDEX IF NOT EXISTS rm_club ON room_managers(room_id,club_id) WHERE club_id IS NOT NULL;
-- estado mutável por sala: clubes copiados na criação; jogadores copy-on-write (só quem muda)
CREATE TABLE IF NOT EXISTS room_clubs(room_id INT REFERENCES rooms(id) ON DELETE CASCADE,club_id INT,budget BIGINT,wage_budget BIGINT,PRIMARY KEY(room_id,club_id));
CREATE TABLE IF NOT EXISTS room_players(room_id INT REFERENCES rooms(id) ON DELETE CASCADE,player_id INT,club_id INT,overall INT,potential INT,age INT,wage BIGINT,market_value BIGINT,contract_end INT,PRIMARY KEY(room_id,player_id));
CREATE TABLE IF NOT EXISTS room_events(id SERIAL PRIMARY KEY,room_id INT REFERENCES rooms(id) ON DELETE CASCADE,text TEXT,created_at TIMESTAMPTZ DEFAULT now());
-- Etapa 3: temporada
ALTER TABLE room_managers ADD COLUMN IF NOT EXISTS ready BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS competitions(id SERIAL PRIMARY KEY,room_id INT REFERENCES rooms(id) ON DELETE CASCADE,season INT,league_id INT,name TEXT,rounds_total INT,current_round INT NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS matches(id SERIAL PRIMARY KEY,comp_id INT REFERENCES competitions(id) ON DELETE CASCADE,round INT,home INT,away INT,hg INT,ag INT,played BOOLEAN NOT NULL DEFAULT false,details JSONB);
CREATE INDEX IF NOT EXISTS m_comp ON matches(comp_id,round);
CREATE TABLE IF NOT EXISTS player_stats(comp_id INT REFERENCES competitions(id) ON DELETE CASCADE,player_id INT,club_id INT,apps INT DEFAULT 0,goals INT DEFAULT 0,assists INT DEFAULT 0,rating_sum REAL DEFAULT 0,PRIMARY KEY(comp_id,player_id));
CREATE TABLE IF NOT EXISTS lineups(room_id INT REFERENCES rooms(id) ON DELETE CASCADE,club_id INT,formation TEXT,starters INT[],PRIMARY KEY(room_id,club_id));
