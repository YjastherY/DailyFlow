# УП.11. Проектирование базы данных DailyFlow

## Выбранная СУБД

Для реализации базы данных выбрана SQLite. Это подходит для учебного MVP DailyFlow, потому что база может быть создана локально одним SQL-скриптом и проверена без отдельного сервера.

## Таблицы базы данных

### users

Хранит пользователей системы.

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `name` TEXT NOT NULL
- `email` TEXT NOT NULL UNIQUE
- `created_at` TEXT NOT NULL

Связь: один пользователь может иметь много проектов.

### projects

Хранит проекты пользователя.

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id` INTEGER NOT NULL
- `title` TEXT NOT NULL
- `goal` TEXT
- `status` TEXT NOT NULL
- `created_at` TEXT NOT NULL

PK: `id`  
FK: `user_id` -> `users(id)`  
Связь: `users 1:M projects`.

### categories

Хранит категории задач.

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `title` TEXT NOT NULL UNIQUE
- `color` TEXT NOT NULL

Связь: одна категория может использоваться во многих задачах.

### tasks

Хранит задачи DailyFlow.

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id` INTEGER NOT NULL
- `project_id` INTEGER
- `category_id` INTEGER NOT NULL
- `title` TEXT NOT NULL
- `description` TEXT
- `priority` TEXT NOT NULL
- `deadline` DATE
- `status` TEXT NOT NULL
- `created_at` TEXT NOT NULL
- `completed_at` TEXT

PK: `id`  
FK: `user_id` -> `users(id)`  
FK: `project_id` -> `projects(id)`  
FK: `category_id` -> `categories(id)`  
Связи: `users 1:M tasks`, `projects 1:M tasks`, `categories 1:M tasks`.

### holidays

Хранит праздники календаря.

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `title_ru` TEXT NOT NULL
- `title_jp` TEXT
- `country_code` TEXT NOT NULL
- `holiday_date` DATE NOT NULL
- `description` TEXT

Используется календарём для отображения русских и японских праздников.

### task_comments

Хранит комментарии к задачам.

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `task_id` INTEGER NOT NULL
- `body` TEXT NOT NULL
- `created_at` TEXT NOT NULL

PK: `id`  
FK: `task_id` -> `tasks(id)`  
Связь: `tasks 1:M task_comments`.

### task_status_history

Хранит историю изменения статуса задач.

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `task_id` INTEGER NOT NULL
- `old_status` TEXT
- `new_status` TEXT NOT NULL
- `changed_at` TEXT NOT NULL

PK: `id`  
FK: `task_id` -> `tasks(id)`  
Связь: `tasks 1:M task_status_history`.

## Связи между таблицами

- `users 1:M projects` - один пользователь создаёт несколько проектов.
- `users 1:M tasks` - один пользователь может иметь несколько задач, включая задачи без проекта.
- `projects 1:M tasks` - один проект содержит несколько задач.
- `categories 1:M tasks` - одна категория может быть назначена нескольким задачам.
- `tasks 1:M task_comments` - у одной задачи может быть несколько комментариев.
- `tasks 1:M task_status_history` - у одной задачи может быть несколько записей истории статуса.

## Реализация

Файлы реализации:

- `database/schema.sql` - создание таблиц, первичных и внешних ключей, индексов и ограничений.
- `database/seed.sql` - заполнение таблиц тестовыми данными.
- `database/queries.sql` - обязательные SQL-запросы.
- `database/dailyflow_up11.sqlite` - созданная SQLite-база после выполнения скриптов.
- `database/verify_up11.py` - скрипт повторной проверки выполнения SQL.
- `database/verification_output.txt` - результат выполнения SQL и контрольных запросов.

## Обязательные запросы

В файле `database/queries.sql` подготовлены:

- `SELECT` с условием `WHERE`;
- `INSERT`;
- `UPDATE`;
- `DELETE`;
- `SELECT` с `JOIN`.

## ER-диаграмма

ER-диаграмма находится в файле `docs/er-diagram.png`.

## Проверка выполнения

SQL-скрипты были проверены через SQLite с помощью файла `database/verify_up11.py`.

Результат проверки сохранён в `database/verification_output.txt`. В нём зафиксировано:

- после выполнения `schema.sql` и `seed.sql` созданы и заполнены таблицы `users`, `projects`, `categories`, `tasks`, `holidays`, `task_comments`, `task_status_history`;
- `SELECT` с условием вернул активные задачи высокого приоритета;
- `INSERT` выполнился с результатом `affected rows: 1`;
- `UPDATE` выполнился с результатом `affected rows: 1`;
- `DELETE` выполнился с результатом `affected rows: 1`;
- `SELECT` с `JOIN` вывел задачи вместе с проектами, категориями и владельцами.
