-- Добавляем недостающие колонки в recommendations
ALTER TABLE t_p65890965_refstaff_project.recommendations
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;

-- Добавляем недостающие колонки в users
ALTER TABLE t_p65890965_refstaff_project.users
    ADD COLUMN IF NOT EXISTS phone VARCHAR,
    ADD COLUMN IF NOT EXISTS telegram VARCHAR,
    ADD COLUMN IF NOT EXISTS vk VARCHAR;

-- Добавляем недостающие колонки в companies
ALTER TABLE t_p65890965_refstaff_project.companies
    ADD COLUMN IF NOT EXISTS telegram VARCHAR,
    ADD COLUMN IF NOT EXISTS vk VARCHAR;

-- Создаём таблицу pending_payouts
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.pending_payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    recommendation_id INTEGER REFERENCES t_p65890965_refstaff_project.recommendations(id),
    amount DECIMAL,
    unlock_date TIMESTAMP,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
