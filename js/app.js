const TASKS_KEY = "dailyflow_tasks";
const DATA_HASH_KEY = "dailyflowData";
const STATUS_FILTERS = {
    all: "all",
    active: "active",
    completed: "completed",
    overdue: "overdue",
    today: "today"
};

const taskForm = document.querySelector("#taskForm");
const taskList = document.querySelector("#taskList");
const taskFilter = document.querySelector("#taskFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const priorityFilter = document.querySelector("#priorityFilter");
const taskSearch = document.querySelector("#taskSearch");
const taskSort = document.querySelector("#taskSort");
const formMessage = document.querySelector("#formMessage");
const totalTasks = document.querySelector("#totalTasks");
const completedTasks = document.querySelector("#completedTasks");
const activeTasks = document.querySelector("#activeTasks");
const completionRate = document.querySelector("#completionRate");
const progressFill = document.querySelector("#progressFill");
const analyticsEmpty = document.querySelector("#analyticsEmpty");
const overdueTasks = document.querySelector("#overdueTasks");
const todayTasks = document.querySelector("#todayTasks");
const highPriorityTasks = document.querySelector("#highPriorityTasks");
const focusScore = document.querySelector("#focusScore");
const nearestTask = document.querySelector("#nearestTask");
const focusCategory = document.querySelector("#focusCategory");
const taskStats = {
    total: document.querySelector("#taskStatTotal"),
    active: document.querySelector("#taskStatActive"),
    overdue: document.querySelector("#taskStatOverdue"),
    today: document.querySelector("#taskStatToday")
};

function encodeTasksForUrl(tasks) {
    try {
        return btoa(unescape(encodeURIComponent(JSON.stringify(tasks))));
    } catch {
        return "";
    }
}

function decodeTasksFromUrl(value) {
    try {
        const decoded = decodeURIComponent(escape(atob(value)));
        const tasks = JSON.parse(decoded);
        return Array.isArray(tasks) ? tasks.map(normalizeTask) : [];
    } catch {
        return [];
    }
}

function importTasksFromHash() {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const payload = params.get(DATA_HASH_KEY);

    if (!payload) {
        return;
    }

    const importedTasks = decodeTasksFromUrl(payload);

    if (importedTasks.length > 0) {
        saveTasks(importedTasks);
    }

    history.replaceState(null, "", window.location.pathname + window.location.search);
}

function buildStateUrl(href) {
    const tasks = getTasks();
    const payload = encodeTasksForUrl(tasks);

    if (!payload) {
        return href;
    }

    return `${href}#${DATA_HASH_KEY}=${payload}`;
}

function syncNavigationState() {
    document.querySelectorAll('a[href$=".html"]').forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");

            if (!href || href.startsWith("http")) {
                return;
            }

            event.preventDefault();
            window.location.href = buildStateUrl(href);
        });
    });
}

function todayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function parseDeadline(deadline) {
    if (!deadline) {
        return null;
    }

    const date = new Date(`${deadline}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(deadline) {
    const date = parseDeadline(deadline);

    if (!date) {
        return null;
    }

    return Math.round((date - todayStart()) / 86400000);
}

function normalizeTask(task) {
    return {
        id: task.id || Date.now(),
        title: task.title || "",
        description: task.description || "",
        category: task.category || "Личное",
        priority: task.priority || "Средний",
        deadline: task.deadline || "",
        completed: Boolean(task.completed),
        createdAt: task.createdAt || new Date().toISOString(),
        completedAt: task.completedAt || null
    };
}

function getTasks() {
    const savedTasks = localStorage.getItem(TASKS_KEY);

    try {
        const tasks = savedTasks ? JSON.parse(savedTasks) : [];
        return Array.isArray(tasks) ? tasks.map(normalizeTask) : [];
    } catch {
        localStorage.removeItem(TASKS_KEY);
        return [];
    }
}

function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks.map(normalizeTask)));
}

function getTaskMeta(task) {
    const left = daysUntil(task.deadline);
    const isOverdue = left !== null && left < 0 && !task.completed;
    const isToday = left === 0 && !task.completed;
    const isSoon = left !== null && left > 0 && left <= 3 && !task.completed;

    let label = "Без срока";

    if (task.completed) {
        label = "Выполнено";
    } else if (isOverdue) {
        label = `Просрочено на ${Math.abs(left)} дн.`;
    } else if (isToday) {
        label = "Сегодня";
    } else if (left === 1) {
        label = "Завтра";
    } else if (left !== null && left > 1) {
        label = `Через ${left} дн.`;
    }

    return { left, isOverdue, isToday, isSoon, label };
}

function getPriorityClass(priority) {
    if (priority === "Высокий") {
        return "priority-high";
    }

    if (priority === "Средний") {
        return "priority-medium";
    }

    return "priority-low";
}

function getPriorityWeight(priority) {
    if (priority === "Высокий") {
        return 3;
    }

    if (priority === "Средний") {
        return 2;
    }

    return 1;
}

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
}

function getStats(tasks) {
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.length - completed;
    const overdue = tasks.filter(task => getTaskMeta(task).isOverdue).length;
    const today = tasks.filter(task => getTaskMeta(task).isToday).length;
    const highActive = tasks.filter(task => task.priority === "Высокий" && !task.completed).length;
    const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const focus = Math.max(0, Math.min(100, percent - overdue * 8 + today * 3));

    return { completed, active, overdue, today, highActive, percent, focus };
}

function matchesStatus(task, status) {
    const meta = getTaskMeta(task);

    if (status === STATUS_FILTERS.active) {
        return !task.completed;
    }

    if (status === STATUS_FILTERS.completed) {
        return task.completed;
    }

    if (status === STATUS_FILTERS.overdue) {
        return meta.isOverdue;
    }

    if (status === STATUS_FILTERS.today) {
        return meta.isToday;
    }

    return true;
}

function sortTasks(tasks, sortValue) {
    return [...tasks].sort((a, b) => {
        const aMeta = getTaskMeta(a);
        const bMeta = getTaskMeta(b);

        if (sortValue === "priority") {
            return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        }

        if (sortValue === "created") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        }

        if (a.completed !== b.completed) {
            return Number(a.completed) - Number(b.completed);
        }

        return (aMeta.left ?? 9999) - (bMeta.left ?? 9999);
    });
}

function renderTaskStats(tasks) {
    if (!taskStats.total) {
        return;
    }

    const stats = getStats(tasks);
    taskStats.total.textContent = tasks.length;
    taskStats.active.textContent = stats.active;
    taskStats.overdue.textContent = stats.overdue;
    taskStats.today.textContent = stats.today;
}

function renderTasks() {
    if (!taskList) {
        return;
    }

    const tasks = getTasks();
    const filterValue = taskFilter.value;
    const categoryValue = categoryFilter.value;
    const priorityValue = priorityFilter.value;
    const searchValue = taskSearch.value.trim().toLowerCase();
    const sortValue = taskSort.value;

    const filteredTasks = sortTasks(tasks.filter(task => {
        const text = `${task.title} ${task.description}`.toLowerCase();
        const matchesText = !searchValue || text.includes(searchValue);
        const matchesCategory = categoryValue === "all" || task.category === categoryValue;
        const matchesPriority = priorityValue === "all" || task.priority === priorityValue;

        return matchesText && matchesCategory && matchesPriority && matchesStatus(task, filterValue);
    }), sortValue);

    renderTaskStats(tasks);
    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {
        const hasTasks = tasks.length > 0;
        const message = hasTasks
            ? "По текущим фильтрам ничего не найдено. Попробуй убрать часть условий."
            : "Добавь первую задачу, чтобы увидеть план дня и статистику.";

        taskList.innerHTML = `
            <div class="empty-state">
                <h3>Задач не найдено</h3>
                <p>${message}</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const meta = getTaskMeta(task);
        const taskCard = document.createElement("article");
        const stateClass = task.completed ? "completed" : meta.isOverdue ? "overdue" : meta.isToday ? "today" : "";
        const description = task.description
            ? `<p class="task-description">${escapeHtml(task.description)}</p>`
            : "";

        taskCard.className = `task-card ${stateClass}`.trim();
        taskCard.innerHTML = `
            <div class="task-content">
                <div class="task-card-top">
                    <span class="category">${escapeHtml(task.category)}</span>
                    <span class="priority ${getPriorityClass(task.priority)}">${escapeHtml(task.priority)}</span>
                    <span class="deadline-chip">${escapeHtml(meta.label)}</span>
                </div>

                <h3>${escapeHtml(task.title)}</h3>
                ${description}
                <p>Дедлайн: ${escapeHtml(task.deadline || "не указан")}</p>
            </div>

            <div class="task-actions">
                <button class="small-button complete-button" data-id="${task.id}">
                    ${task.completed ? "Вернуть" : "Готово"}
                </button>

                <button class="small-button delete-button" data-id="${task.id}">
                    Удалить
                </button>
            </div>
        `;

        taskList.appendChild(taskCard);
    });
}

function addTask(event) {
    event.preventDefault();

    const title = document.querySelector("#taskTitle").value.trim();
    const description = document.querySelector("#taskDescription").value.trim();
    const category = document.querySelector("#taskCategory").value;
    const priority = document.querySelector("#taskPriority").value;
    const deadline = document.querySelector("#taskDeadline").value;

    if (title.length < 3) {
        formMessage.textContent = "Название задачи должно быть длиннее 2 символов.";
        return;
    }

    const tasks = getTasks();
    const newTask = normalizeTask({
        id: Date.now(),
        title,
        description,
        category,
        priority,
        deadline,
        completed: false,
        createdAt: new Date().toISOString()
    });

    tasks.push(newTask);
    saveTasks(tasks);

    taskForm.reset();
    formMessage.textContent = "Задача добавлена. Аналитика обновится автоматически.";

    renderTasks();
}

function handleTaskActions(event) {
    const button = event.target;

    if (!button.dataset.id) {
        return;
    }

    const taskId = Number(button.dataset.id);
    let tasks = getTasks();

    if (button.classList.contains("complete-button")) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                const completed = !task.completed;

                return {
                    ...task,
                    completed,
                    completedAt: completed ? new Date().toISOString() : null
                };
            }

            return task;
        });
    }

    if (button.classList.contains("delete-button")) {
        tasks = tasks.filter(task => task.id !== taskId);
    }

    saveTasks(tasks);
    renderTasks();
}

function getNearestTask(tasks) {
    const activeTasksList = tasks
        .filter(task => !task.completed)
        .sort((a, b) => (getTaskMeta(a).left ?? 9999) - (getTaskMeta(b).left ?? 9999));

    return activeTasksList[0];
}

function getFocusCategory(tasks) {
    const activeTasksList = tasks.filter(task => !task.completed);
    const categories = activeTasksList.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
    }, {});
    const [category, count] = Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || [];

    return category ? `${category}: ${count}` : "Нет активных задач";
}

function renderAnalytics() {
    if (!totalTasks) {
        return;
    }

    const tasks = getTasks();
    const stats = getStats(tasks);
    const nearest = getNearestTask(tasks);

    analyticsEmpty.hidden = tasks.length > 0;
    totalTasks.textContent = tasks.length;
    completedTasks.textContent = stats.completed;
    activeTasks.textContent = stats.active;
    completionRate.textContent = `${stats.percent}%`;
    progressFill.style.width = `${stats.percent}%`;

    if (overdueTasks) {
        overdueTasks.textContent = stats.overdue;
        todayTasks.textContent = stats.today;
        highPriorityTasks.textContent = stats.highActive;
        focusScore.textContent = `${stats.focus}%`;
        nearestTask.textContent = nearest
            ? `${nearest.title} · ${getTaskMeta(nearest).label}`
            : "Нет активных задач";
        focusCategory.textContent = getFocusCategory(tasks);
    }
}

function renderCalendar() {
}

function renderAll() {
    importTasksFromHash();
    renderTasks();
    renderAnalytics();
    renderCalendar();
}

if (taskForm) {
    taskForm.addEventListener("submit", addTask);
}

if (taskList) {
    taskList.addEventListener("click", handleTaskActions);
}

[taskFilter, categoryFilter, priorityFilter, taskSort].forEach(control => {
    if (control) {
        control.addEventListener("change", renderTasks);
    }
});

if (taskSearch) {
    taskSearch.addEventListener("input", renderTasks);
}

window.addEventListener("pageshow", renderAll);
window.addEventListener("storage", renderAll);

syncNavigationState();
renderAll();
