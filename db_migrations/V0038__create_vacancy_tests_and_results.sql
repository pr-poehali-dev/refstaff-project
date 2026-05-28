
CREATE TABLE t_p65890965_refstaff_project.vacancy_tests (
    id SERIAL PRIMARY KEY,
    vacancy_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.vacancies(id),
    company_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.companies(id),
    token VARCHAR(32) NOT NULL UNIQUE DEFAULT substring(md5(random()::text || clock_timestamp()::text), 1, 24),
    title VARCHAR(255),
    difficulty VARCHAR(20) DEFAULT 'medium',
    questions_count INTEGER DEFAULT 10,
    questions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE t_p65890965_refstaff_project.test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES t_p65890965_refstaff_project.vacancy_tests(id),
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(50),
    answers JSONB NOT NULL DEFAULT '[]',
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    completed_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_vacancy_tests_vacancy_id ON t_p65890965_refstaff_project.vacancy_tests(vacancy_id);
CREATE INDEX idx_vacancy_tests_token ON t_p65890965_refstaff_project.vacancy_tests(token);
CREATE INDEX idx_test_results_test_id ON t_p65890965_refstaff_project.test_results(test_id);
