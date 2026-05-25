-- Таблица транзакций кошелька
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    amount DECIMAL,
    type VARCHAR,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.chats (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES t_p65890965_refstaff_project.companies(id),
    employee_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица сообщений чата
CREATE TABLE IF NOT EXISTS t_p65890965_refstaff_project.chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES t_p65890965_refstaff_project.chats(id),
    sender_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    attachment_url VARCHAR,
    attachment_name VARCHAR,
    attachment_type VARCHAR,
    attachment_size INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
