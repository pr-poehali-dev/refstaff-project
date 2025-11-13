-- Insert demo data for RefStaff

-- Insert demo company
INSERT INTO t_p65890965_refstaff_project.companies (id, name, description, subscription_tier, employee_count) 
VALUES (1, 'Acme Tech', 'Технологическая компания по разработке ПО', 'standard', 150);

-- Insert demo users
INSERT INTO t_p65890965_refstaff_project.users 
(id, company_id, email, first_name, last_name, position, department, role, level, experience_points, total_recommendations, successful_hires, total_earnings)
VALUES 
(1, 1, 'anna.smirnova@acme.tech', 'Анна', 'Смирнова', 'Tech Lead', 'Разработка', 'employee', 5, 250, 12, 4, 120000),
(2, 1, 'dmitry.ivanov@acme.tech', 'Дмитрий', 'Иванов', 'Senior Developer', 'Разработка', 'employee', 3, 150, 8, 2, 60000),
(3, 1, 'maria.petrova@acme.tech', 'Мария', 'Петрова', 'Product Owner', 'Продукт', 'employee', 6, 300, 15, 5, 150000),
(4, 1, 'hr@acme.tech', 'HR', 'Manager', 'HR Manager', 'HR', 'employer', 1, 0, 0, 0, 0);

-- Insert demo vacancies
INSERT INTO t_p65890965_refstaff_project.vacancies 
(id, company_id, title, department, salary_display, requirements, status, reward_amount, created_by)
VALUES 
(1, 1, 'Senior Frontend Developer', 'Разработка', '250 000 ₽', 'Опыт работы от 5 лет с React, TypeScript', 'active', 30000, 4),
(2, 1, 'Product Manager', 'Продукт', '200 000 ₽', 'Опыт управления продуктом от 3 лет', 'active', 30000, 4),
(3, 1, 'UX/UI Designer', 'Дизайн', '180 000 ₽', 'Портфолио с кейсами, опыт работы от 3 лет', 'active', 30000, 4),
(4, 1, 'DevOps Engineer', 'Инфраструктура', '220 000 ₽', 'Опыт с Kubernetes, Docker, CI/CD', 'active', 30000, 4);

-- Insert demo recommendations
INSERT INTO t_p65890965_refstaff_project.recommendations 
(id, vacancy_id, recommended_by, candidate_name, candidate_email, candidate_phone, comment, status, reward_amount)
VALUES 
(1, 1, 1, 'Алексей Козлов', 'alexey.kozlov@example.com', '+7 (999) 123-45-67', 'Отличный специалист, работали вместе на предыдущем проекте', 'pending', 30000),
(2, 3, 1, 'Елена Новикова', 'elena.novikova@example.com', '+7 (999) 234-56-78', 'Талантливый дизайнер с большим опытом', 'accepted', 30000),
(3, 2, 2, 'Сергей Волков', 'sergey.volkov@example.com', '+7 (999) 345-67-89', 'Опытный PM с хорошими навыками коммуникации', 'pending', 30000),
(4, 1, 3, 'Ольга Соколова', 'olga.sokolova@example.com', '+7 (999) 456-78-90', 'Профессионал с отличным знанием React', 'accepted', 30000),
(5, 4, 2, 'Игорь Морозов', 'igor.morozov@example.com', '+7 (999) 567-89-01', 'Эксперт по DevOps практикам', 'rejected', 30000);

-- Reset sequences to continue from demo data
SELECT setval('t_p65890965_refstaff_project.companies_id_seq', 1, true);
SELECT setval('t_p65890965_refstaff_project.users_id_seq', 4, true);
SELECT setval('t_p65890965_refstaff_project.vacancies_id_seq', 4, true);
SELECT setval('t_p65890965_refstaff_project.recommendations_id_seq', 5, true);
