ALTER TABLE t_p65890965_refstaff_project.users
    ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_telegram_chat_id_unique
    ON t_p65890965_refstaff_project.users (telegram_chat_id)
    WHERE telegram_chat_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.telegram_auth_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(8) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'login',
    user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    invite_token VARCHAR(100) DEFAULT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    telegram_chat_id BIGINT DEFAULT NULL,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS telegram_auth_codes_code_idx
    ON t_p65890965_refstaff_project.telegram_auth_codes (code);
