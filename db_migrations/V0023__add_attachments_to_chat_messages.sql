ALTER TABLE t_p65890965_refstaff_project.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS attachment_size INTEGER;