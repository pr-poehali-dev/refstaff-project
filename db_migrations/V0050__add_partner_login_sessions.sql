-- Сессии входа партнёров через Telegram/MAX
CREATE TABLE t_p65890965_refstaff_project.partner_login_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(64) UNIQUE NOT NULL,
    partner_id INTEGER REFERENCES t_p65890965_refstaff_project.hr_partners(id),
    messenger VARCHAR(10) NOT NULL CHECK (messenger IN ('telegram', 'max')),
    chat_id BIGINT,
    code VARCHAR(6),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'code_sent', 'verified', 'expired')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем поля для Telegram и MAX к hr_partners
ALTER TABLE t_p65890965_refstaff_project.hr_partners
    ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
    ADD COLUMN IF NOT EXISTS max_user_id BIGINT;

CREATE INDEX idx_partner_login_sessions_token ON t_p65890965_refstaff_project.partner_login_sessions(session_token);
