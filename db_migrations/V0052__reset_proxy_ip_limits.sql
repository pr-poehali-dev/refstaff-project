-- Обнуляем мусорный счётчик по IP прокси — лимиты теперь считаются по email
UPDATE t_p65890965_refstaff_project.public_test_ip_limits
SET count = 0
WHERE ip_address ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
  AND generation_date = CURRENT_DATE;