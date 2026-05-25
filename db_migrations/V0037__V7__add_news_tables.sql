CREATE TABLE t_p65890965_refstaff_project.news (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES t_p65890965_refstaff_project.companies(id),
    author_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR DEFAULT 'news',
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p65890965_refstaff_project.news_comments (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES t_p65890965_refstaff_project.news(id),
    author_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    author_name VARCHAR,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p65890965_refstaff_project.news_likes (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES t_p65890965_refstaff_project.news(id),
    user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id),
    UNIQUE(news_id, user_id)
);
