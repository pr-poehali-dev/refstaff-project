-- Добавление тестовых пользователей для входа

-- Тестовый администратор (компания)
-- Email: admin@company.ru
-- Пароль: admin123
INSERT INTO t_p65890965_refstaff_project.users 
(company_id, email, password_hash, first_name, last_name, role, position, department, 
 level, experience_points, total_recommendations, successful_hires, total_earnings, 
 wallet_balance, wallet_pending, is_admin, is_hr_manager, created_at, updated_at)
VALUES 
(1, 'admin@company.ru', 
 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd4:5a1e6d8f9c2b3a4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
 'Администратор', 'Компании', 'admin', 'CEO', 'Управление',
 1, 0, 0, 0, 0, 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- Тестовый сотрудник
-- Email: employee@company.ru  
-- Пароль: employee123
INSERT INTO t_p65890965_refstaff_project.users 
(company_id, email, password_hash, first_name, last_name, role, position, department,
 level, experience_points, total_recommendations, successful_hires, total_earnings,
 wallet_balance, wallet_pending, is_admin, is_hr_manager, created_at, updated_at)
VALUES 
(1, 'employee@company.ru',
 'a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8:4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b',
 'Иван', 'Сотрудников', 'employee', 'Менеджер', 'Продажи',
 1, 0, 3, 1, 15000, 15000, 5000, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;