import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import db, { newToken } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// --- Helpers ---
function getListByToken(token) {
  return db.prepare('SELECT * FROM lists WHERE share_token = ?').get(token);
}

// --- Lists ---

// All lists (owner view)
app.get('/api/lists', (req, res) => {
  const lists = db.prepare('SELECT * FROM lists ORDER BY created_at DESC').all();
  res.json(lists);
});

// Create a list
app.post('/api/lists', (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  const token = newToken();
  const info = db
    .prepare('INSERT INTO lists (name, share_token) VALUES (?, ?)')
    .run(name, token);
  const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(list);
});

// Get one list + its tasks (by share token)
app.get('/api/lists/:token', (req, res) => {
  const list = getListByToken(req.params.token);
  if (!list) return res.status(404).json({ error: 'list not found' });
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY done, created_at')
    .all(list.id);
  res.json({ ...list, tasks });
});

// Delete a list
app.delete('/api/lists/:token', (req, res) => {
  const list = getListByToken(req.params.token);
  if (!list) return res.status(404).json({ error: 'list not found' });
  db.prepare('DELETE FROM lists WHERE id = ?').run(list.id);
  res.status(204).end();
});

// --- Tasks ---

// Add a task to a list
app.post('/api/lists/:token/tasks', (req, res) => {
  const list = getListByToken(req.params.token);
  if (!list) return res.status(404).json({ error: 'list not found' });
  const text = (req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text required' });
  const info = db
    .prepare('INSERT INTO tasks (list_id, text) VALUES (?, ?)')
    .run(list.id, text);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(task);
});

// Toggle done / update a task
app.patch('/api/lists/:token/tasks/:id', (req, res) => {
  const list = getListByToken(req.params.token);
  if (!list) return res.status(404).json({ error: 'list not found' });
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND list_id = ?')
    .get(req.params.id, list.id);
  if (!task) return res.status(404).json({ error: 'task not found' });

  const done = req.body?.done !== undefined ? (req.body.done ? 1 : 0) : task.done;
  const text = req.body?.text !== undefined ? String(req.body.text).trim() : task.text;
  db.prepare('UPDATE tasks SET done = ?, text = ? WHERE id = ?').run(done, text, task.id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json(updated);
});

// Delete a task
app.delete('/api/lists/:token/tasks/:id', (req, res) => {
  const list = getListByToken(req.params.token);
  if (!list) return res.status(404).json({ error: 'list not found' });
  const info = db
    .prepare('DELETE FROM tasks WHERE id = ? AND list_id = ?')
    .run(req.params.id, list.id);
  if (info.changes === 0) return res.status(404).json({ error: 'task not found' });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`myTasks running → http://localhost:${PORT}`);
});
