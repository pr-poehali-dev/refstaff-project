-- Добавляем счётчик оплаченных периодов для ограничения комиссии партнёра
-- Партнёр получает комиссию за первые 3 месяца ИЛИ за оплату года
ALTER TABLE t_p65890965_refstaff_project.partner_referrals
  ADD COLUMN IF NOT EXISTS paid_months_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_commission_earned numeric(12,2) NOT NULL DEFAULT 0;