import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "database" / "dailyflow_up11.sqlite"
SCHEMA_PATH = ROOT / "database" / "schema.sql"
SEED_PATH = ROOT / "database" / "seed.sql"
QUERIES_PATH = ROOT / "database" / "queries.sql"
OUTPUT_PATH = ROOT / "database" / "verification_output.txt"


def read_sql(path):
    return path.read_text(encoding="utf-8")


def split_sql(sql):
    statements = []
    buffer = []

    for line in sql.splitlines():
        stripped = line.strip()

        if not stripped or stripped.startswith("PRAGMA"):
            continue

        buffer.append(line)

        if stripped.endswith(";"):
            statements.append("\n".join(buffer).strip().rstrip(";"))
            buffer = []

    return statements


def main():
    if DB_PATH.exists():
        DB_PATH.unlink()

    connection = sqlite3.connect(DB_PATH)
    connection.execute("PRAGMA foreign_keys = ON;")
    cursor = connection.cursor()
    cursor.executescript(read_sql(SCHEMA_PATH))
    cursor.executescript(read_sql(SEED_PATH))
    connection.commit()

    lines = [
        "DailyFlow УП.11 SQLite verification",
        "=" * 42,
        f"Database file: {DB_PATH.name}",
        "",
        "Table counts after schema.sql + seed.sql:",
    ]

    tables = ["users", "projects", "categories", "tasks", "holidays", "task_comments", "task_status_history"]

    for table in tables:
        count = cursor.execute(f"SELECT COUNT(*) FROM {table};").fetchone()[0]
        lines.append(f"- {table}: {count}")

    lines.append("")
    lines.append("Executing database/queries.sql:")

    for index, statement in enumerate(split_sql(read_sql(QUERIES_PATH)), start=1):
        keyword = statement.split(None, 1)[0].upper()
        lines.append("")
        lines.append(f"[{index}] {keyword}")
        cursor.execute(statement)

        if keyword == "SELECT":
            rows = cursor.fetchall()
            headers = [description[0] for description in cursor.description]
            lines.append(" | ".join(headers))

            for row in rows:
                lines.append(" | ".join("" if value is None else str(value) for value in row))
        else:
            connection.commit()
            lines.append(f"affected rows: {cursor.rowcount}")

    lines.append("")
    lines.append("Control JOIN after query execution:")
    rows = cursor.execute(
        """
        SELECT
            projects.title AS project,
            COUNT(tasks.id) AS total_tasks,
            SUM(CASE WHEN tasks.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
        FROM projects
        LEFT JOIN tasks ON tasks.project_id = projects.id
        GROUP BY projects.id
        ORDER BY projects.id;
        """
    ).fetchall()

    lines.append("project | total_tasks | completed_tasks")

    for row in rows:
        lines.append(" | ".join(str(value) for value in row))

    connection.close()
    OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Verification complete: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
