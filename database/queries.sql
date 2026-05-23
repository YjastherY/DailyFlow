PRAGMA foreign_keys = ON;

-- 1. SELECT с условием WHERE: активные задачи высокого приоритета.
SELECT
    id,
    title,
    priority,
    deadline,
    status
FROM tasks
WHERE priority = 'high'
  AND status = 'active';

-- 2. INSERT: добавление новой задачи в проект УП.11.
INSERT INTO tasks (
    project_id,
    category_id,
    title,
    description,
    priority,
    deadline,
    status
) VALUES (
    2,
    1,
    'Проверить выполнение SQL-скрипта',
    'Запустить схему, seed и запросы в SQLite',
    'medium',
    '2026-05-24',
    'active'
);

-- 3. UPDATE: отметить добавленную задачу как выполненную.
UPDATE tasks
SET
    status = 'completed',
    completed_at = CURRENT_TIMESTAMP
WHERE title = 'Проверить выполнение SQL-скрипта';

-- 4. DELETE: удалить тестовый комментарий после проверки.
DELETE FROM task_comments
WHERE body = 'Запросы должны быть выполнены и сохранены в репозитории.';

-- 5. SELECT с JOIN: задачи вместе с проектом, категорией и владельцем проекта.
SELECT
    tasks.id AS task_id,
    tasks.title AS task_title,
    tasks.priority,
    tasks.deadline,
    tasks.status,
    projects.title AS project_title,
    categories.title AS category_title,
    users.name AS owner_name
FROM tasks
LEFT JOIN projects ON tasks.project_id = projects.id
JOIN categories ON tasks.category_id = categories.id
LEFT JOIN users ON projects.user_id = users.id
ORDER BY tasks.deadline ASC;
