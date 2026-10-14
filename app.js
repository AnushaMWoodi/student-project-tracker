import express from 'express';

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject
} from './database.js';

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/projects', (req, res) => {
  res.json(listProjects());
});

app.post('/api/projects', (req, res) => {
  try {
    const project = createProject(req.body ?? {});
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const project = updateProject(req.params.id, req.body ?? {});

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const removed = deleteProject(req.params.id);

  if (!removed) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  res.status(204).send();
});

app.use(express.static('public'));

export default app;
