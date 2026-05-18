const TASKS_KEY = "dailyflow_tasks";

const taskForm = document.querySelector("#taskForm");
const taskList = document.querySelector("#taskList");
const taskFilter = document.querySelector("#taskFilter");
const formMessage = document.querySelector("#formMessage");

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

function renderTasks() {
    if (!taskList) {
        return;
    }

    const tasks = getTasks();
    const filterValue = taskFilter.value;

    let filteredTasks = tasks;

    if (filterValue === "Активные") {
        filteredTasks = tasks.filter(task => !task.completed);
    }

    if (filterValue === "Выполненные") {
        filteredTasks = tasks.filter(task => task.completed);
    }

    taskList.innerHTML = "";

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>Пока задач нет</h3>
                <p>Добавь первую задачу через форму слева.</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const taskCard = document.createElement("article");
        taskCard.className = task.completed ? "task-card completed" : "task-card";

        taskCard.innerHTML = `
            <div>
                <div class="task-card-top">
                    <span class="category">${task.category}</span>
                    <span class="priority ${getPriorityClass(task.priority)}">${task.priority}</span>
                </div>

                <h3>${task.title}</h3>
                <p>Дедлайн: ${task.deadline}</p>
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

if (taskForm) {
    taskForm.addEventListener("submit", addTask);
}

if (taskList) {
    taskList.addEventListener("click", handleTaskActions);
}

if (taskFilter) {
    taskFilter.addEventListener("change", renderTasks);
}

renderTasks();
