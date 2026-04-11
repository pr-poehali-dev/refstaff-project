ALTER TABLE t_p65890965_refstaff_project.users
    ADD COLUMN IF NOT EXISTS max_user_id BIGINT DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_max_user_id_unique
    ON t_p65890965_refstaff_project.users (max_user_id)
    WHERE max_user_id IS NOT NULL;

-- Сессии для MAX регистрации (аналог tg_sessions)
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.max_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    invite_token VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    max_user_id BIGINT DEFAULT NULL,
    code VARCHAR(8) DEFAULT NULL,
    code_used BOOLEAN DEFAULT FALSE,
    user_id INTEGER DEFAULT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS max_sessions_token_idx
    ON t_p65890965_refstaff_project.max_sessions (session_token);
