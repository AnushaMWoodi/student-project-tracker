import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = process.env.DB_FILE || 'data/projects.db';

if (databasePath !== ':memory:') {
  mkdirSync(dirname(resolve(databasePath)), { recursive: true });
}

const connection = new DatabaseSync(databasePath);
const validStatuses = new Set(['Planned', 'In Progress', 'Completed']);

connection.exec(`CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
  status TEXT NOT NULL CHECK(status IN ('Planned', 'In Progress', 'Completed'))
)`);

export class ProjectValidationError extends Error {}

function validateProject(rawProject, currentProject = {}) {
  if (rawProject === null || typeof rawProject !== 'object' || Array.isArray(rawProject)) {
    throw new ProjectValidationError('Project data must be an object.');
  }

  const nameValue = rawProject.name ?? currentProject.name;
  const statusValue = rawProject.status ?? currentProject.status;
  const name = typeof nameValue === 'string' ? nameValue.trim() : '';
  const status = typeof statusValue === 'string' ? statusValue.trim() : '';

  if (name.length === 0 || name.length > 80) {
    throw new ProjectValidationError('Project name is required and must be 1-80 characters long.');
  }

  if (!validStatuses.has(status)) {
    throw new ProjectValidationError('Project status must be Planned, In Progress, or Completed.');
  }

  return { name, status };
}

export function resetProjects() {
  connection.exec('DELETE FROM projects');
}

export function listProjects() {
  return connection.prepare(
    'SELECT id, name, status FROM projects ORDER BY rowid DESC'
  ).all();
}

export function createProject(rawProject = {}) {
  const project = validateProject(rawProject);
  const id = randomUUID();

  connection.prepare(
    'INSERT INTO projects (id, name, status) VALUES (?, ?, ?)'
  ).run(id, project.name, project.status);

  return { id, ...project };
}

export function updateProject(id, rawProject = {}) {
  const currentProject = connection.prepare(
    'SELECT id, name, status FROM projects WHERE id = ?'
  ).get(id);

  if (!currentProject) {
    return null;
  }

  const project = validateProject(rawProject, currentProject);
  connection.prepare(
    'UPDATE projects SET name = ?, status = ? WHERE id = ?'
  ).run(project.name, project.status, id);

  return { id, ...project };
}

export function deleteProject(id) {
  return connection.prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0;
}

export function closeDatabase() {
  connection.close();
}
