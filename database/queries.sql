PRAGMA foreign_keys = ON;

SELECT
    id,
    title,
    priority,
    deadline,
    status
FROM tasks
WHERE priority = 'high'
  AND status = 'active';

INSERT INTO tasks (
    user_id,
    project_id,
    category_id,
    title,
    description,
    priority,
    deadline,
    status
) VALUES (
    1,
    2,
    1,
    'Проверить выполнение SQL-скрипта',
    'Запустить схему, seed и запросы в SQLite',
    'medium',
    '2026-05-24',
    'active'
);

UPDATE tasks
SET
    status = 'completed',
    completed_at = CURRENT_TIMESTAMP
WHERE title = 'Проверить выполнение SQL-скрипта';

DELETE FROM task_comments
WHERE body = 'Запросы должны быть выполнены и сохранены в репозитории.';

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
JOIN users ON tasks.user_id = users.id
LEFT JOIN projects ON tasks.project_id = projects.id
JOIN categories ON tasks.category_id = categories.id
ORDER BY tasks.deadline ASC;
