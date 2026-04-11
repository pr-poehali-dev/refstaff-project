CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.max_login_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending → code_sent → completed
    max_user_id BIGINT DEFAULT NULL,
    code VARCHAR(8) DEFAULT NULL,
    code_used BOOLEAN DEFAULT FALSE,
    auth_token TEXT DEFAULT NULL,
    user_id INTEGER DEFAULT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS max_login_sessions_token_idx
    ON t_p65890965_refstaff_project.max_login_sessions (session_token);
