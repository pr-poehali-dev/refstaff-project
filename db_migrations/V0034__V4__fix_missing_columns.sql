-- tg_sessions: добавить code_used и user_id
ALTER TABLE t_p65890965_refstaff_project.tg_sessions
    ADD COLUMN IF NOT EXISTS code_used BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id);

-- max_sessions: добавить code_used и user_id
ALTER TABLE t_p65890965_refstaff_project.max_sessions
    ADD COLUMN IF NOT EXISTS code_used BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES t_p65890965_refstaff_project.users(id);

-- max_login_sessions: добавить code_used
ALTER TABLE t_p65890965_refstaff_project.max_login_sessions
    ADD COLUMN IF NOT EXISTS code_used BOOLEAN DEFAULT FALSE;

-- recommendations: добавить comment
ALTER TABLE t_p65890965_refstaff_project.recommendations
    ADD COLUMN IF NOT EXISTS comment TEXT;

-- payout_requests: добавить reviewed_by
ALTER TABLE t_p65890965_refstaff_project.payout_requests
    ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES t_p65890965_refstaff_project.users(id);
