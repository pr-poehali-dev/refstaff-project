ALTER TABLE t_p65890965_refstaff_project.companies
ADD COLUMN IF NOT EXISTS payout_methods jsonb NOT NULL DEFAULT '["card","sbp","cash","bank"]'::jsonb;