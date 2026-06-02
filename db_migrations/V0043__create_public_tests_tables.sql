CREATE TABLE t_p65890965_refstaff_project.public_tests (
    id SERIAL PRIMARY KEY,
    token VARCHAR(32) NOT NULL UNIQUE DEFAULT substring(md5(random()::text || clock_timestamp()::text), 1, 24),
    employer_email VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    job_description TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium',
    questions_count INTEGER DEFAULT 10,
    questions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by_ip VARCHAR(64),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_public_tests_token ON t_p65890965_refstaff_project.public_tests(token);
CREATE INDEX idx_public_tests_employer_email ON t_p65890965_refstaff_project.public_tests(employer_email);

CREATE TABLE t_p65890965_refstaff_project.public_test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.public_tests(id),
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(50),
    answers JSONB NOT NULL DEFAULT '[]',
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    completed_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_public_test_results_test_id ON t_p65890965_refstaff_project.public_test_results(test_id);

CREATE TABLE t_p65890965_refstaff_project.public_test_ip_limits (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(64) NOT NULL,
    generation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INTEGER DEFAULT 1,
    UNIQUE(ip_address, generation_date)
);
