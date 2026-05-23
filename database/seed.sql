PRAGMA foreign_keys = ON;

INSERT INTO users (name, email) VALUES
    ('Shizuki', 'jrivachenko0987@gmail.com'),
    ('Ameverise', '69supremacy@gmail.com');

INSERT INTO categories (title, color) VALUES
    ('Учёба', '#3b5bdb'),
    ('Работа', '#129490'),
    ('Дом', '#f59f00'),
    ('Здоровье', '#2f9e44'),
    ('Личное', '#7048e8');

INSERT INTO projects (user_id, title, goal, status) VALUES
    (1, 'Дипломный проект DailyFlow', 'Подготовить MVP, отчётность и материалы для практики', 'active'),
    (1, 'Учебная практика УП.11', 'Спроектировать и реализовать базу данных по теме проекта', 'active'),
    (2, 'Визуальная полировка', 'Сделать интерфейс живым, удобным и презентабельным', 'completed');

INSERT INTO tasks (project_id, category_id, title, description, priority, deadline, status, completed_at) VALUES
    (1, 1, 'Собрать страницу задач', 'Форма, фильтры, проекты и дедлайны', 'high', '2026-05-20', 'completed', '2026-05-20 18:30:00'),
    (1, 1, 'Добавить календарь', 'Календарь дедлайнов и праздников', 'high', '2026-05-23', 'active', NULL),
    (2, 1, 'Спроектировать таблицы БД', 'Определить PK, FK и связи', 'high', '2026-05-24', 'active', NULL),
    (2, 1, 'Подготовить SQL-запросы', 'SELECT, INSERT, UPDATE, DELETE и JOIN', 'medium', '2026-05-24', 'active', NULL),
    (3, 2, 'Обновить скриншоты', 'Сделать скриншоты актуальными', 'medium', '2026-05-22', 'completed', '2026-05-22 21:00:00'),
    (NULL, 5, 'Проверить README', 'Убедиться, что запуск описан корректно', 'low', '2026-05-25', 'active', NULL);

INSERT INTO holidays (title_ru, title_jp, country_code, holiday_date, description) VALUES
    ('Новый год', '元日', 'JP', '2026-01-01', 'Начало года в Японии'),
    ('День детей', 'こどもの日', 'JP', '2026-05-05', 'Праздник детей и семейного благополучия'),
    ('День культуры', '文化の日', 'JP', '2026-11-03', 'Праздник искусства, науки и культуры'),
    ('День Победы', 'День Победы', 'RU', '2026-05-09', 'Памятный праздник России'),
    ('День России', 'День России', 'RU', '2026-06-12', 'Государственный праздник Российской Федерации');

INSERT INTO task_comments (task_id, body) VALUES
    (2, 'Нужно проверить отображение японских праздников.'),
    (3, 'Для отчёта важно показать ER-диаграмму.'),
    (4, 'Запросы должны быть выполнены и сохранены в репозитории.');

INSERT INTO task_status_history (task_id, old_status, new_status, changed_at) VALUES
    (1, 'active', 'completed', '2026-05-20 18:30:00'),
    (5, 'active', 'completed', '2026-05-22 21:00:00');
