ALTER TABLE t_p65890965_refstaff_project.users
    ADD COLUMN IF NOT EXISTS is_hr_manager BOOLEAN DEFAULT FALSE;

ALTER TABLE t_p65890965_refstaff_project.email_verification_tokens
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
