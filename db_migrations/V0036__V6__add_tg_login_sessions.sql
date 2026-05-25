CREATE TABLE t_p65890965_refstaff_project.tg_login_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'pending',
    telegram_chat_id BIGINT,
    code VARCHAR,
    code_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
