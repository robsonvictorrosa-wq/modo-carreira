CREATE TABLE leagues(id INTEGER PRIMARY KEY,name TEXT UNIQUE,country TEXT,tier INT,gender TEXT,kind TEXT,original_name TEXT);
CREATE TABLE clubs(id INTEGER PRIMARY KEY,name TEXT,league_id INT REFERENCES leagues(id),n_players INT,overall REAL,squad_value INT,wage_bill INT,budget INT);
-- Base "universo" (somente leitura). Cada sala (etapa 2) terá cópia própria do estado mutável.
CREATE TABLE players(id INTEGER PRIMARY KEY,name TEXT,nationality TEXT,club_id INT,base_club_id INT,positions TEXT,primary_position TEXT,overall INT,potential INT,age INT,height_cm INT,weight_kg INT,preferred_foot TEXT,weak_foot INT,skill_moves INT,gender TEXT,market_value INT,wage INT,release_clause INT,contract_end INT,stats TEXT);
CREATE INDEX ip_club ON players(club_id);CREATE INDEX ip_name ON players(name);CREATE INDEX ic_league ON clubs(league_id);
-- Reservado para as próximas etapas
CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT UNIQUE,pass_hash TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE rooms(id INTEGER PRIMARY KEY,code TEXT UNIQUE,name TEXT,owner_id INT,max_managers INT DEFAULT 5,season INT DEFAULT 2026,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE room_managers(room_id INT,user_id INT,club_id INT,PRIMARY KEY(room_id,user_id),UNIQUE(room_id,club_id));
CREATE TABLE room_player_state(room_id INT,player_id INT,club_id INT,overall INT,wage INT,contract_end INT,PRIMARY KEY(room_id,player_id));
CREATE TABLE room_club_state(room_id INT,club_id INT,budget INT,PRIMARY KEY(room_id,club_id));
