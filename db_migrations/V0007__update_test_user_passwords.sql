-- Обновление паролей для тестовых пользователей с правильными хешами

UPDATE t_p65890965_refstaff_project.users 
SET password_hash = '093a3315b8d20c310360ec33c183020c080bbecdb218aa335f1d005a07342112:test_admin_salt_00000000000000000000000000000001',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@company.ru';

UPDATE t_p65890965_refstaff_project.users 
SET password_hash = 'c183c3c5ef983da4c08bc9cada9429b975ccbd0ad022b0b1984cb6105a0c846b:test_employee_salt_0000000000000000000000000001',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'employee@company.ru';