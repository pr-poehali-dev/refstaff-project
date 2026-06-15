-- Партнёрская программа для HR
CREATE TABLE t_p65890965_refstaff_project.hr_partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    partner_code VARCHAR(50) UNIQUE NOT NULL,
    referral_link TEXT,
    
    -- Статистика
    clients_invited INTEGER DEFAULT 0,
    clients_registered INTEGER DEFAULT 0,
    
    -- Финансы
    balance DECIMAL(12,2) DEFAULT 0,
    total_earned DECIMAL(12,2) DEFAULT 0,
    
    -- Статус
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Запросы на выплату от партнёров
CREATE TABLE t_p65890965_refstaff_project.partner_payout_requests (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.hr_partners(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(100),
    payment_details TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    admin_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- Отслеживание приглашённых клиентов
CREATE TABLE t_p65890965_refstaff_project.partner_referrals (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.hr_partners(id),
    company_id INTEGER REFERENCES t_p65890965_refstaff_project.companies(id),
    company_name VARCHAR(255),
    contact_name VARCHAR(200),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    status VARCHAR(30) DEFAULT 'invited' CHECK (status IN ('invited', 'registered', 'subscribed', 'churned')),
    source VARCHAR(20) DEFAULT 'link' CHECK (source IN ('link', 'promo')),
    promo_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hr_partners_code ON t_p65890965_refstaff_project.hr_partners(partner_code);
CREATE INDEX idx_partner_referrals_partner_id ON t_p65890965_refstaff_project.partner_referrals(partner_id);
CREATE INDEX idx_partner_payout_requests_partner_id ON t_p65890965_refstaff_project.partner_payout_requests(partner_id);
