const $ = (sel) => document.querySelector(sel);

const state = {
  lists: [],
  currentToken: null,
};

// --- API ---
const api = {
  async listLists() {
    return (await fetch('/api/lists')).json();
  },
  async createList(name) {
    const r = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return r.json();
  },
  async getList(token) {
    const r = await fetch(`/api/lists/${token}`);
    if (!r.ok) return null;
    return r.json();
  },
  async deleteList(token) {
    return fetch(`/api/lists/${token}`, { method: 'DELETE' });
  },
  async addTask(token, text) {
    const r = await fetch(`/api/lists/${token}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return r.json();
  },
  async toggleTask(token, id, done) {
    const r = await fetch(`/api/lists/${token}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    return r.json();
  },
  async deleteTask(token, id) {
    return fetch(`/api/lists/${token}/tasks/${id}`, { method: 'DELETE' });
  },
};

// --- Rendering ---
function renderLists() {
  const ul = $('#lists');
  ul.innerHTML = '';
  for (const list of state.lists) {
    const li = document.createElement('li');
    li.textContent = list.name;
    li.dataset.token = list.share_token;
    if (list.share_token === state.currentToken) li.classList.add('active');
    li.addEventListener('click', () => selectList(list.share_token));
    ul.appendChild(li);
  }
}

function renderList(list) {
  $('#empty-state').hidden = true;
  $('#list-view').hidden = false;
  $('#list-title').textContent = list.name;

  const ul = $('#tasks');
  ul.innerHTML = '';
  for (const task of list.tasks) {
    const li = document.createElement('li');
    li.className = 'task' + (task.done ? ' done' : '');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!task.done;
    cb.addEventListener('change', async () => {
      await api.toggleTask(state.currentToken, task.id, cb.checked);
      await selectList(state.currentToken);
    });

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = task.text;

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '✕';
    del.title = 'Supprimer';
    del.addEventListener('click', async () => {
      await api.deleteTask(state.currentToken, task.id);
      await selectList(state.currentToken);
    });

    li.append(cb, span, del);
    ul.appendChild(li);
  }
}

// --- Actions ---
async function refreshLists() {
  state.lists = await api.listLists();
  renderLists();
}

async function selectList(token) {
  const list = await api.getList(token);
  if (!list) {
    showToast('Liste introuvable');
    state.currentToken = null;
    $('#list-view').hidden = true;
    $('#empty-state').hidden = false;
    setHash('');
    return;
  }
  state.currentToken = token;
  setHash(token);
  renderLists();
  renderList(list);
}

async function addList() {
  const input = $('#new-list-name');
  const name = input.value.trim();
  if (!name) return;
  const list = await api.createList(name);
  input.value = '';
  await refreshLists();
  selectList(list.share_token);
}

async function deleteCurrentList() {
  if (!state.currentToken) return;
  if (!confirm('Supprimer cette liste et toutes ses tâches ?')) return;
  await api.deleteList(state.currentToken);
  state.currentToken = null;
  setHash('');
  $('#list-view').hidden = true;
  $('#empty-state').hidden = false;
  await refreshLists();
}

async function addTask(e) {
  e.preventDefault();
  const input = $('#new-task-text');
  const text = input.value.trim();
  if (!text || !state.currentToken) return;
  await api.addTask(state.currentToken, text);
  input.value = '';
  await selectList(state.currentToken);
}

function shareCurrent() {
  if (!state.currentToken) return;
  const url = `${location.origin}${location.pathname}#${state.currentToken}`;
  navigator.clipboard.writeText(url).then(
    () => showToast('Lien copié dans le presse-papier'),
    () => showToast(url)
  );
}

// --- Utils ---
let toastTimer;
function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2500);
}

function setHash(token) {
  history.replaceState(null, '', token ? `#${token}` : location.pathname);
}

// --- Init ---
$('#add-list-btn').addEventListener('click', addList);
$('#new-list-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addList();
});
$('#add-task-form').addEventListener('submit', addTask);
$('#share-btn').addEventListener('click', shareCurrent);
$('#delete-list-btn').addEventListener('click', deleteCurrentList);

(async function boot() {
  await refreshLists();
  const token = location.hash.slice(1);
  if (token) selectList(token);
})();
