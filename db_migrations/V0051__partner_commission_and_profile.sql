
ALTER TABLE t_p65890965_refstaff_project.companies
  ADD COLUMN IF NOT EXISTS referred_by_partner_id INTEGER
    REFERENCES t_p65890965_refstaff_project.hr_partners(id);

ALTER TABLE t_p65890965_refstaff_project.hr_partners
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_details TEXT,
  ADD COLUMN IF NOT EXISTS inn VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE t_p65890965_refstaff_project.partner_referrals
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_available_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_set_at TIMESTAMP;
