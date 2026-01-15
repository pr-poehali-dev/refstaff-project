-- Добавляем тестовые запросы на выплаты
INSERT INTO t_p65890965_refstaff_project.payout_requests (user_id, amount, payment_method, payment_details, status)
VALUES 
  (12, 15000, 'Банковская карта', '2202 **** **** 4567', 'pending'),
  (12, 30000, 'СБП', '+7 (900) 123-45-67', 'approved')
ON CONFLICT DO NOTHING;
