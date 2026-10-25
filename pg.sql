CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,nick TEXT UNIQUE NOT NULL,pass_hash TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INT REFERENCES users(id) ON DELETE CASCADE,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS rooms(id SERIAL PRIMARY KEY,code TEXT UNIQUE NOT NULL,name TEXT NOT NULL,owner_id INT REFERENCES users(id),max_managers INT NOT NULL DEFAULT 5,season INT NOT NULL DEFAULT 2026,status TEXT NOT NULL DEFAULT 'lobby',version INT NOT NULL DEFAULT 1,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS room_managers(room_id INT REFERENCES rooms(id) ON DELETE CASCADE,user_id INT REFERENCES users(id),club_id INT,joined_at TIMESTAMPTZ DEFAULT now(),PRIMARY KEY(room_id,user_id));
CREATE UNIQUE INDEX IF NOT EXISTS rm_club ON room_managers(room_id,club_id) WHERE club_id IS NOT NULL;
-- estado mutável por sala: clubes copiados na criação; jogadores copy-on-write (só quem muda)
CREATE TABLE IF NOT EXISTS room_clubs(room_id INT REFERENCES rooms(id) ON DELETE CASCADE,club_id INT,budget BIGINT,wage_budget BIGINT,PRIMARY KEY(room_id,club_id));
CREATE TABLE IF NOT EXISTS room_players(room_id INT REFERENCES rooms(id) ON DELETE CASCADE,player_id INT,club_id INT,overall INT,potential INT,age INT,wage BIGINT,market_value BIGINT,contract_end INT,PRIMARY KEY(room_id,player_id));
CREATE TABLE IF NOT EXISTS room_events(id SERIAL PRIMARY KEY,room_id INT REFERENCES rooms(id) ON DELETE CASCADE,text TEXT,created_at TIMESTAMPTZ DEFAULT now());
