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
const calendarGrid = document.querySelector("#calendarGrid");
const calendarTitle = document.querySelector("#calendarTitle");
const prevMonth = document.querySelector("#prevMonth");
const nextMonth = document.querySelector("#nextMonth");
const selectedDayTitle = document.querySelector("#selectedDayTitle");
const selectedDayText = document.querySelector("#selectedDayText");
const selectedDayEvents = document.querySelector("#selectedDayEvents");
const calendarTabs = document.querySelectorAll("[data-calendar-filter]");
const openDatePicker = document.querySelector("#openDatePicker");
const deadlinePicker = document.querySelector("#deadlinePicker");
const deadlineGrid = document.querySelector("#deadlineGrid");
const deadlineTitle = document.querySelector("#deadlineTitle");
const deadlinePrev = document.querySelector("#deadlinePrev");
const deadlineNext = document.querySelector("#deadlineNext");
const deadlineHint = document.querySelector("#deadlineHint");
let calendarDate = new Date();
let calendarFilter = "all";
let deadlinePickerDate = new Date();
let typingTimer = null;

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

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function makeDate(year, monthIndex, day) {
    return new Date(year, monthIndex, day);
}

function nthWeekday(year, monthIndex, weekday, nth) {
    const date = new Date(year, monthIndex, 1);
    const shift = (weekday - date.getDay() + 7) % 7;
    return new Date(year, monthIndex, 1 + shift + (nth - 1) * 7);
}

function addHoliday(list, date, titleRu, titleJp, country, description) {
    list.push({
        date: formatDateKey(date),
        titleRu,
        titleJp,
        country,
        description
    });
}

function getHolidays(year) {
    const holidays = [];

    [
        [1, 1, "Новый год", "元日", "JP", "Начало года в Японии, день семейных встреч и первых храмовых посещений."],
        [2, 11, "День основания государства", "建国記念の日", "JP", "Праздник, связанный с историей основания Японии."],
        [2, 23, "День рождения императора", "天皇誕生日", "JP", "Государственный праздник в честь дня рождения действующего императора."],
        [3, 20, "День весеннего равноденствия", "春分の日", "JP", "День смены сезона, семейной памяти и наблюдения за весной."],
        [4, 29, "День Сёва", "昭和の日", "JP", "Начало периода Golden Week и день размышления о прошлом страны."],
        [5, 3, "День Конституции", "憲法記念日", "JP", "Праздник в честь послевоенной Конституции Японии."],
        [5, 4, "День зелени", "みどりの日", "JP", "День природы, парков и спокойного отдыха на свежем воздухе."],
        [5, 5, "День детей", "こどもの日", "JP", "Праздник детей и семейного благополучия."],
        [8, 11, "День гор", "山の日", "JP", "Праздник благодарности горам и природе Японии."],
        [9, 23, "День осеннего равноденствия", "秋分の日", "JP", "Осенний день памяти семьи и смены сезона."],
        [11, 3, "День культуры", "文化の日", "JP", "Праздник искусства, науки и культурных достижений."],
        [11, 23, "День благодарности труду", "勤労感謝の日", "JP", "День уважения к труду и благодарности людям за вклад в общество."],
        [1, 1, "Новогодние каникулы", "Новый год", "RU", "Начало длинных зимних праздников в России."],
        [1, 7, "Рождество Христово", "Рождество", "RU", "Официальный праздничный день в России."],
        [2, 23, "День защитника Отечества", "23 февраля", "RU", "Праздник, связанный с воинской службой и защитой страны."],
        [3, 8, "Международный женский день", "8 марта", "RU", "Весенний праздник внимания и поздравлений."],
        [5, 1, "Праздник Весны и Труда", "1 мая", "RU", "Выходной день, связанный с весной и трудом."],
        [5, 9, "День Победы", "9 мая", "RU", "Один из главных памятных праздников России."],
        [6, 12, "День России", "12 июня", "RU", "Государственный праздник Российской Федерации."],
        [11, 4, "День народного единства", "4 ноября", "RU", "Праздник единства и гражданской истории России."]
    ].forEach(([month, day, ru, jp, country, description]) => {
        addHoliday(holidays, makeDate(year, month - 1, day), ru, jp, country, description);
    });

    [
        [0, 1, 2, "День совершеннолетия", "成人の日", "Праздник молодых людей, достигших совершеннолетия."],
        [6, 1, 3, "День моря", "海の日", "Летний праздник благодарности морю."],
        [8, 1, 3, "День почитания пожилых", "敬老の日", "День уважения старших поколений."],
        [9, 1, 2, "День спорта", "スポーツの日", "Праздник спорта, движения и здоровья."]
    ].forEach(([monthIndex, weekday, nth, ru, jp, description]) => {
        addHoliday(holidays, nthWeekday(year, monthIndex, weekday, nth), ru, jp, "JP", description);
    });

    for (let day = 2; day <= 8; day += 1) {
        addHoliday(holidays, makeDate(year, 0, day), "Новогодние каникулы", "Новогодние каникулы", "RU", "Часть российских новогодних выходных.");
    }

    return holidays;
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

function getDayTasks(tasks, dateKey) {
    return tasks.filter(task => task.deadline === dateKey);
}

function getDayHolidays(holidays, dateKey) {
    return holidays.filter(holiday => holiday.date === dateKey);
}

function eventAllowed(dayTasks, dayHolidays) {
    if (calendarFilter === "tasks") {
        return dayTasks.length > 0;
    }

    if (calendarFilter === "holidays") {
        return dayHolidays.length > 0;
    }

    if (calendarFilter === "jp") {
        return dayHolidays.some(holiday => holiday.country === "JP");
    }

    if (calendarFilter === "ru") {
        return dayHolidays.some(holiday => holiday.country === "RU");
    }

    return true;
}

function typeText(element, text) {
    if (!element) {
        return;
    }

    clearInterval(typingTimer);
    element.textContent = "";

    let index = 0;
    typingTimer = setInterval(() => {
        element.textContent += text[index] || "";
        index += 1;

        if (index >= text.length) {
            clearInterval(typingTimer);
        }
    }, 18);
}

function renderDayDetails(dateKey, dayTasks, dayHolidays) {
    if (!selectedDayTitle) {
        return;
    }

    const date = parseDeadline(dateKey);
    const title = date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const taskText = dayTasks.length === 0
        ? "задач с дедлайном нет"
        : `${dayTasks.length} задач(и) с дедлайном`;
    const holidayText = dayHolidays.length === 0
        ? "праздников нет"
        : `${dayHolidays.length} праздничных события`;

    selectedDayTitle.textContent = title;
    typeText(selectedDayText, `На этот день: ${taskText}, ${holidayText}. DailyFlow подсказывает, что стоит держать в поле зрения.`);

    selectedDayEvents.innerHTML = "";

    dayHolidays.forEach(holiday => {
        const event = document.createElement("article");
        event.className = `day-event holiday-${holiday.country.toLowerCase()}`;
        event.innerHTML = `
            <span>${holiday.country}</span>
            <strong>${escapeHtml(holiday.titleRu)} · ${escapeHtml(holiday.titleJp)}</strong>
            <p>${escapeHtml(holiday.description)}</p>
        `;
        selectedDayEvents.appendChild(event);
    });

    dayTasks.forEach(task => {
        const event = document.createElement("article");
        event.className = task.completed ? "day-event task-done" : "day-event task-open";
        event.innerHTML = `
            <span>Task</span>
            <strong>${escapeHtml(task.title)}</strong>
            <p>${escapeHtml(task.category)} · ${escapeHtml(task.priority)} · ${task.completed ? "выполнено" : "активно"}</p>
        `;
        selectedDayEvents.appendChild(event);
    });

    if (dayTasks.length === 0 && dayHolidays.length === 0) {
        selectedDayEvents.innerHTML = `
            <article class="day-event">
                <span>Free day</span>
                <strong>Свободное окно</strong>
                <p>Хороший день для планирования, отдыха или переноса задачи без спешки.</p>
            </article>
        `;
    }
}

function renderCalendar() {
    if (!calendarGrid) {
        return;
    }

    const tasks = getTasks();
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const holidays = getHolidays(year);
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(todayStart());

    calendarTitle.textContent = firstDay.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric"
    });
    calendarGrid.innerHTML = "";

    for (let i = 0; i < startOffset; i += 1) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const dateKey = formatDateKey(date);
        const dayTasks = getDayTasks(tasks, dateKey);
        const dayHolidays = getDayHolidays(holidays, dateKey);
        const visible = eventAllowed(dayTasks, dayHolidays);
        const button = document.createElement("button");
        const jpHoliday = dayHolidays.some(holiday => holiday.country === "JP");
        const ruHoliday = dayHolidays.some(holiday => holiday.country === "RU");

        button.className = "calendar-day";
        button.type = "button";
        button.dataset.date = dateKey;

        if (dateKey === todayKey) {
            button.classList.add("current");
        }

        if (!visible) {
            button.classList.add("muted-day");
        }

        button.innerHTML = `
            <span class="day-number">${day}</span>
            <span class="day-badges">
                ${dayTasks.length ? `<i class="task-dot">${dayTasks.length}</i>` : ""}
                ${jpHoliday ? '<i class="jp-dot">JP</i>' : ""}
                ${ruHoliday ? '<i class="ru-dot">RU</i>' : ""}
            </span>
        `;
        button.addEventListener("click", () => renderDayDetails(dateKey, dayTasks, dayHolidays));
        calendarGrid.appendChild(button);
    }

    const selectedKey = formatDateKey(new Date(year, month, Math.min(new Date().getDate(), daysInMonth)));
    renderDayDetails(selectedKey, getDayTasks(tasks, selectedKey), getDayHolidays(holidays, selectedKey));
}

function renderDeadlinePicker() {
    if (!deadlineGrid) {
        return;
    }

    const year = deadlinePickerDate.getFullYear();
    const month = deadlinePickerDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const holidays = getHolidays(year);
    const input = document.querySelector("#taskDeadline");
    const selected = input.value;

    deadlineTitle.textContent = firstDay.toLocaleDateString("ru-RU", {
        month: "long",
        year: "numeric"
    });
    deadlineGrid.innerHTML = "";

    for (let i = 0; i < startOffset; i += 1) {
        const empty = document.createElement("span");
        empty.className = "deadline-empty";
        deadlineGrid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const key = formatDateKey(date);
        const dayHolidays = getDayHolidays(holidays, key);
        const button = document.createElement("button");

        button.className = "deadline-day";
        button.type = "button";
        button.textContent = day;

        if (key === selected) {
            button.classList.add("selected");
        }

        if (dayHolidays.length > 0) {
            button.classList.add("holiday");
            button.title = dayHolidays.map(holiday => holiday.titleRu).join(", ");
        }

        button.addEventListener("click", () => {
            input.value = key;
            deadlineHint.textContent = dayHolidays.length > 0
                ? `Выбрано: ${key}. В этот день есть праздник: ${dayHolidays[0].titleRu}.`
                : `Выбрано: ${key}. Дата добавлена в задачу.`;
            renderDeadlinePicker();
        });

        deadlineGrid.appendChild(button);
    }
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

if (prevMonth) {
    prevMonth.addEventListener("click", () => {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1);
        renderCalendar();
    });
}

if (nextMonth) {
    nextMonth.addEventListener("click", () => {
        calendarDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1);
        renderCalendar();
    });
}

calendarTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        calendarFilter = tab.dataset.calendarFilter;
        calendarTabs.forEach(item => item.classList.toggle("active", item === tab));
        renderCalendar();
    });
});

if (openDatePicker) {
    openDatePicker.addEventListener("click", () => {
        deadlinePicker.hidden = !deadlinePicker.hidden;
        renderDeadlinePicker();
    });
}

if (deadlinePrev) {
    deadlinePrev.addEventListener("click", () => {
        deadlinePickerDate = new Date(deadlinePickerDate.getFullYear(), deadlinePickerDate.getMonth() - 1, 1);
        renderDeadlinePicker();
    });
}

if (deadlineNext) {
    deadlineNext.addEventListener("click", () => {
        deadlinePickerDate = new Date(deadlinePickerDate.getFullYear(), deadlinePickerDate.getMonth() + 1, 1);
        renderDeadlinePicker();
    });
}

window.addEventListener("pageshow", renderAll);
window.addEventListener("storage", renderAll);

syncNavigationState();
renderAll();
