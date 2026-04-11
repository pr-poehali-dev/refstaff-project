-- Сессии для deep link регистрации через Telegram
-- Сотрудник нажимает кнопку → создаётся сессия → deep link с session_token → бот присылает код
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.tg_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    invite_token VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending → bot_connected → code_sent → completed
    telegram_chat_id BIGINT DEFAULT NULL,
    code VARCHAR(8) DEFAULT NULL,
    code_used BOOLEAN DEFAULT FALSE,
    auth_token TEXT DEFAULT NULL,
    user_id INTEGER DEFAULT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tg_sessions_session_token_idx
    ON t_p65890965_refstaff_project.tg_sessions (session_token);
