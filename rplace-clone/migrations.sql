---- filepath: /path/to/rplace-clone/migrations.sql
-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Création de la table canvases
CREATE TABLE IF NOT EXISTS canvases (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,
  bitmap BYTEA,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);