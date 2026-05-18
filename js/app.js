const TASKS_KEY = "dailyflow_tasks";

const taskForm = document.querySelector("#taskForm");
const taskList = document.querySelector("#taskList");
const taskFilter = document.querySelector("#taskFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const formMessage = document.querySelector("#formMessage");
const totalTasks = document.querySelector("#totalTasks");
const completedTasks = document.querySelector("#completedTasks");
const activeTasks = document.querySelector("#activeTasks");
const completionRate = document.querySelector("#completionRate");
const progressFill = document.querySelector("#progressFill");
const analyticsEmpty = document.querySelector("#analyticsEmpty");

function getTasks() {
    const savedTasks = localStorage.getItem(TASKS_KEY);

    try {
        return savedTasks ? JSON.parse(savedTasks) : [];
    } catch {
        localStorage.removeItem(TASKS_KEY);
        return [];
    }
}

function saveTasks(tasks) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
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

function escapeHtml(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
}

function renderTasks() {
    if (!taskList) {
        return;
    }

    const tasks = getTasks();
    const filterValue = taskFilter.value;
    const categoryValue = categoryFilter.value;

    const filteredTasks = tasks.filter(task => {
        const matchesStatus =
            filterValue === "Все" ||
            (filterValue === "Активные" && !task.completed) ||
            (filterValue === "Выполненные" && task.completed);
        const matchesCategory = categoryValue === "Все" || task.category === categoryValue;

        return matchesStatus && matchesCategory;
    });

    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {
        const hasTasks = tasks.length > 0;
        const message = hasTasks
            ? "Попробуй изменить фильтры, чтобы увидеть другие задачи."
            : "Добавь первую задачу через форму слева.";

        taskList.innerHTML = `
            <div class="empty-state">
                <h3>Пока задач нет</h3>
                <p>${message}</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const taskCard = document.createElement("article");
        taskCard.className = task.completed ? "task-card completed" : "task-card";
        const description = task.description
            ? `<p class="task-description">${escapeHtml(task.description)}</p>`
            : "";

        taskCard.innerHTML = `
            <div>
                <div class="task-card-top">
                    <span class="category">${escapeHtml(task.category)}</span>
                    <span class="priority ${getPriorityClass(task.priority)}">${escapeHtml(task.priority)}</span>
                </div>

                <h3>${escapeHtml(task.title)}</h3>
                ${description}
                <p>Дедлайн: ${escapeHtml(task.deadline)}</p>
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

    const newTask = {
        id: Date.now(),
        title,
        description,
        category,
        priority,
        deadline,
        completed: false
    };

    tasks.push(newTask);
    saveTasks(tasks);

    taskForm.reset();
    formMessage.textContent = "Задача добавлена.";

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
                return {
                    ...task,
                    completed: !task.completed
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

function renderAnalytics() {
    if (!totalTasks) {
        return;
    }

    const tasks = getTasks();
    const completed = tasks.filter(task => task.completed).length;
    const active = tasks.length - completed;
    const percent = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    analyticsEmpty.hidden = tasks.length > 0;
    totalTasks.textContent = tasks.length;
    completedTasks.textContent = completed;
    activeTasks.textContent = active;
    completionRate.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
}

if (taskForm) {
    taskForm.addEventListener("submit", addTask);
}

if (taskList) {
    taskList.addEventListener("click", handleTaskActions);
}

if (taskFilter) {
    taskFilter.addEventListener("change", renderTasks);
}

if (categoryFilter) {
    categoryFilter.addEventListener("change", renderTasks);
}

renderTasks();
renderAnalytics();
