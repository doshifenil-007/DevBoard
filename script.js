/* ============================================
   DevBoard — app logic
   Talks to a Spring Boot REST API (see /backend).
   Falls back to localStorage automatically if the
   API is unreachable, so the frontend still works
   standalone (e.g. opened directly as a file).
   ============================================ */

const API_BASE = 'http://localhost:8080/api/tasks';
const STORAGE_KEY = 'devboard_tasks_v1';
const THEME_KEY = 'devboard_theme';

let state = {
  tasks: [],
  searchTerm: '',
  priorityFilter: 'all',
  useApi: true, // flipped to false automatically if the backend isn't reachable
};

let dragTaskId = null;

/* ---------- backend <-> frontend field mapping ----------
   Backend uses: id (Long), title, description, priority (HIGH/MEDIUM/LOW),
   status (TODO/PROGRESS/DONE), dueDate, createdAt, completedAt
   Frontend uses lowercase status/priority and 'desc'/'due' — map between them. */

function fromApi(t) {
  return {
    id: String(t.id),
    title: t.title,
    desc: t.description || '',
    priority: (t.priority || 'MEDIUM').toLowerCase(),
    status: (t.status || 'TODO').toLowerCase(),
    due: t.dueDate || '',
    createdAt: t.createdAt,
    completedAt: t.completedAt,
  };
}

function toApi(t) {
  return {
    title: t.title,
    description: t.desc,
    priority: t.priority.toUpperCase(),
    status: t.status.toUpperCase(),
    dueDate: t.due || null,
  };
}

/* ---------- persistence ---------- */

async function loadTasks() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    state.tasks = data.map(fromApi);
    state.useApi = true;
  } catch (e) {
    console.warn('Backend unreachable, falling back to localStorage.', e);
    state.useApi = false;
    const raw = localStorage.getItem(STORAGE_KEY);
    state.tasks = raw ? JSON.parse(raw) : seedTasks();
  }
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

async function apiCreate(task) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApi(task)),
  });
  return fromApi(await res.json());
}

async function apiUpdate(id, task) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toApi(task)),
  });
  return fromApi(await res.json());
}

async function apiUpdateStatus(id, status) {
  const res = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: status.toUpperCase() }),
  });
  return fromApi(await res.json());
}

async function apiDelete(id) {
  await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
}

function seedTasks() {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      id: crypto.randomUUID(),
      title: 'Set up project repo',
      desc: 'Initialize git, add README, push to GitHub.',
      priority: 'medium',
      status: 'done',
      due: '',
      createdAt: today,
      completedAt: today,
    },
    {
      id: crypto.randomUUID(),
      title: 'Build drag-and-drop board',
      desc: 'Implement native HTML5 drag events across columns.',
      priority: 'high',
      status: 'progress',
      due: '',
      createdAt: today,
      completedAt: null,
    },
    {
      id: crypto.randomUUID(),
      title: 'Write project README',
      desc: 'Document features, setup, and screenshots.',
      priority: 'low',
      status: 'todo',
      due: '',
      createdAt: today,
      completedAt: null,
    },
  ];
}

/* ---------- rendering: board ---------- */

function render() {
  renderColumns();
  renderStats();
  renderHeatmap();
}

function getFilteredTasks() {
  const term = state.searchTerm.trim().toLowerCase();
  return state.tasks.filter(t => {
    const matchesTerm = !term ||
      t.title.toLowerCase().includes(term) ||
      (t.desc || '').toLowerCase().includes(term);
    const matchesPriority = state.priorityFilter === 'all' || t.priority === state.priorityFilter;
    return matchesTerm && matchesPriority;
  });
}

function renderColumns() {
  const filtered = getFilteredTasks();
  const columns = { todo: [], progress: [], done: [] };
  filtered.forEach(t => columns[t.status].push(t));

  Object.keys(columns).forEach(status => {
    const body = document.getElementById(`col-${status}`);
    body.innerHTML = '';
    if (columns[status].length === 0) {
      const hint = document.createElement('div');
      hint.className = 'empty-hint';
      hint.textContent = status === 'todo' ? '// nothing queued' : status === 'progress' ? '// idle' : '// no ships yet';
      body.appendChild(hint);
    } else {
      columns[status]
        .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority))
        .forEach(t => body.appendChild(buildCard(t)));
    }
  });

  document.getElementById('countTodo').textContent = columns.todo.length;
  document.getElementById('countProgress').textContent = columns.progress.length;
  document.getElementById('countDone').textContent = columns.done.length;
}

function priorityRank(p) {
  return { high: 3, medium: 2, low: 1 }[p] || 0;
}

function buildCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card' + (task.status === 'done' ? ' done-card' : '');
  card.draggable = true;
  card.dataset.id = task.id;

  const top = document.createElement('div');
  top.className = 'task-top';

  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;

  const badge = document.createElement('span');
  badge.className = `priority-badge priority-${task.priority}`;
  badge.textContent = task.priority;

  top.appendChild(title);
  top.appendChild(badge);
  card.appendChild(top);

  if (task.desc) {
    const desc = document.createElement('p');
    desc.className = 'task-desc';
    desc.textContent = task.desc;
    card.appendChild(desc);
  }

  if (task.due) {
    const meta = document.createElement('div');
    const overdue = task.status !== 'done' && new Date(task.due) < new Date(new Date().toDateString());
    meta.className = 'task-meta' + (overdue ? ' overdue' : '');
    meta.textContent = (overdue ? 'overdue: ' : 'due: ') + task.due;
    card.appendChild(meta);
  }

  card.addEventListener('click', () => openModal(task));

  card.addEventListener('dragstart', (e) => {
    dragTaskId = task.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    dragTaskId = null;
  });

  return card;
}

/* ---------- drag and drop on columns ---------- */

document.querySelectorAll('.column-body').forEach(body => {
  body.addEventListener('dragover', (e) => {
    e.preventDefault();
    body.classList.add('drag-over');
  });
  body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
  body.addEventListener('drop', (e) => {
    e.preventDefault();
    body.classList.remove('drag-over');
    if (!dragTaskId) return;
    const newStatus = body.dataset.status;
    updateTaskStatus(dragTaskId, newStatus);
  });
});

async function updateTaskStatus(id, newStatus) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  const wasDone = task.status === 'done';
  task.status = newStatus;
  if (newStatus === 'done' && !wasDone) {
    task.completedAt = new Date().toISOString().slice(0, 10);
    showToast('Task marked done 🎉');
  } else if (newStatus !== 'done') {
    task.completedAt = null;
  }

  if (state.useApi) {
    try {
      await apiUpdateStatus(id, newStatus);
    } catch (e) {
      console.error('Failed to update status on server', e);
    }
  } else {
    saveLocal();
  }
  render();
}

/* ---------- stats ---------- */

function renderStats() {
  const total = state.tasks.length;
  const progress = state.tasks.filter(t => t.status === 'progress').length;
  const done = state.tasks.filter(t => t.status === 'done').length;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statProgress').textContent = progress;
  document.getElementById('statDone').textContent = done;
  document.getElementById('statStreak').textContent = computeStreak();
}

function computeStreak() {
  const completedDates = new Set(
    state.tasks.filter(t => t.completedAt).map(t => t.completedAt)
  );
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (completedDates.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/* ---------- heatmap ---------- */

function renderHeatmap() {
  const el = document.getElementById('heatmap');
  el.innerHTML = '';

  const counts = {};
  state.tasks.forEach(t => {
    if (t.completedAt) counts[t.completedAt] = (counts[t.completedAt] || 0) + 1;
  });

  const days = 119; // ~17 weeks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  // align start to a Sunday so rows line up as weeks
  const startDay = start.getDay();
  start.setDate(start.getDate() - startDay);

  const totalCells = Math.ceil((days + startDay) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const cell = document.createElement('div');
    const count = counts[key] || 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
    cell.className = `cell lvl-${level}`;
    cell.title = `${key}: ${count} task${count === 1 ? '' : 's'} completed`;
    el.appendChild(cell);
  }

  const totalCompleted = Object.values(counts).reduce((a, b) => a + b, 0);
  document.getElementById('heatmapSub').textContent =
    totalCompleted > 0
      ? `${totalCompleted} task${totalCompleted === 1 ? '' : 's'} shipped in the last ${days} days.`
      : 'Every square is a day you shipped something.';
}

/* ---------- modal / form ---------- */

const modalOverlay = document.getElementById('modalOverlay');
const taskForm = document.getElementById('taskForm');

function openModal(task = null) {
  document.getElementById('modalTitle').textContent = task ? 'Edit Task' : 'New Task';
  document.getElementById('taskId').value = task ? task.id : '';
  document.getElementById('taskTitle').value = task ? task.title : '';
  document.getElementById('taskDesc').value = task ? task.desc || '' : '';
  document.getElementById('taskPriority').value = task ? task.priority : 'medium';
  document.getElementById('taskDue').value = task ? task.due || '' : '';
  document.getElementById('deleteTaskBtn').style.display = task ? 'inline-block' : 'none';
  modalOverlay.classList.add('open');
  setTimeout(() => document.getElementById('taskTitle').focus(), 50);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  taskForm.reset();
}

document.getElementById('addTaskBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) return;

  const payload = {
    title,
    desc: document.getElementById('taskDesc').value.trim(),
    priority: document.getElementById('taskPriority').value,
    due: document.getElementById('taskDue').value,
  };

  if (id) {
    const task = state.tasks.find(t => t.id === id);
    Object.assign(task, payload);
    if (state.useApi) {
      try { await apiUpdate(id, task); } catch (err) { console.error(err); }
    } else {
      saveLocal();
    }
    showToast('Task updated');
  } else {
    const newTask = {
      id: crypto.randomUUID(),
      status: 'todo',
      createdAt: new Date().toISOString().slice(0, 10),
      completedAt: null,
      ...payload,
    };
    if (state.useApi) {
      try {
        const created = await apiCreate(newTask);
        state.tasks.push(created);
      } catch (err) {
        console.error(err);
        state.tasks.push(newTask);
      }
    } else {
      state.tasks.push(newTask);
      saveLocal();
    }
    showToast('Task added');
  }

  render();
  closeModal();
});

document.getElementById('deleteTaskBtn').addEventListener('click', async () => {
  const id = document.getElementById('taskId').value;
  state.tasks = state.tasks.filter(t => t.id !== id);
  if (state.useApi) {
    try { await apiDelete(id); } catch (err) { console.error(err); }
  } else {
    saveLocal();
  }
  render();
  closeModal();
  showToast('Task deleted');
});

/* ---------- search & filters ---------- */

document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchTerm = e.target.value;
  renderColumns();
});

document.getElementById('priorityFilters').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  state.priorityFilter = btn.dataset.priority;
  renderColumns();
});

/* ---------- theme ---------- */

function applyTheme(theme) {
  document.body.classList.toggle('light', theme === 'light');
  document.getElementById('iconMoon').style.display = theme === 'light' ? 'block' : 'none';
  document.getElementById('iconSun').style.display = theme === 'light' ? 'none' : 'block';
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const isLight = document.body.classList.contains('light');
  const next = isLight ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

/* ---------- toast ---------- */

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- init ---------- */

async function init() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(savedTheme);
  await loadTasks();
  render();
  if (!state.useApi) {
    showToast('Backend offline — using local storage');
  }
}

init();
