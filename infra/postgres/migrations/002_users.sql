-- Run as the database superuser, passing the application role:
--   psql -U postgres -d oficina_db -v app_user=oficina_app -f 002_users.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE CHECK (username = lower(username)),
    password_hash TEXT NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'member')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO :"app_user";
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO :"app_user";
