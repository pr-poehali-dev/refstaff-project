
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    inn VARCHAR UNIQUE,
    description TEXT,
    website VARCHAR,
    industry VARCHAR,
    logo_url VARCHAR,
    employee_count INTEGER,
    invite_token VARCHAR UNIQUE,
    subscription_tier VARCHAR DEFAULT 'trial',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    role VARCHAR DEFAULT 'employee',
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_recommendations INTEGER DEFAULT 0,
    successful_hires INTEGER DEFAULT 0,
    total_earnings DECIMAL DEFAULT 0,
    wallet_balance DECIMAL DEFAULT 0,
    wallet_pending DECIMAL DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    is_fired BOOLEAN DEFAULT FALSE,
    position VARCHAR,
    department VARCHAR,
    avatar_url VARCHAR,
    telegram_chat_id BIGINT,
    max_user_id BIGINT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vacancies (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    created_by INTEGER REFERENCES users(id),
    title VARCHAR NOT NULL,
    department VARCHAR,
    salary_display VARCHAR,
    status VARCHAR DEFAULT 'active',
    requirements TEXT,
    description TEXT,
    reward_amount INTEGER DEFAULT 30000,
    payout_delay_days INTEGER DEFAULT 30,
    referral_token VARCHAR UNIQUE DEFAULT substring(md5(random()::text), 1, 12),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER REFERENCES vacancies(id),
    recommender_id INTEGER REFERENCES users(id),
    candidate_name VARCHAR,
    candidate_email VARCHAR,
    candidate_phone VARCHAR,
    resume_url VARCHAR,
    status VARCHAR DEFAULT 'pending',
    reward_amount INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payout_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL,
    status VARCHAR DEFAULT 'pending',
    payment_method VARCHAR,
    payment_details TEXT,
    admin_comment TEXT,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE game_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game VARCHAR,
    score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR,
    token VARCHAR UNIQUE,
    expires_at TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tg_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR UNIQUE,
    invite_token VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    status VARCHAR DEFAULT 'pending',
    telegram_chat_id BIGINT,
    code VARCHAR,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE max_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR UNIQUE,
    invite_token VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    status VARCHAR DEFAULT 'pending',
    max_user_id BIGINT,
    code VARCHAR,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE max_login_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'pending',
    max_user_id BIGINT,
    code VARCHAR,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    email VARCHAR,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
