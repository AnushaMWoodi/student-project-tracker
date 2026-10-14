import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const testDirectory = mkdtempSync(join(tmpdir(), 'student-project-tracker-'));
const testDatabasePath = join(testDirectory, 'projects.db');
process.env.DB_FILE = testDatabasePath;

const { default: app } = await import('../app.js');
const { closeDatabase, resetProjects } = await import('../database.js');

after(() => {
  closeDatabase();
  rmSync(testDirectory, { recursive: true, force: true });
});

async function withServer(fn, { reset = true } = {}) {
  if (reset) {
    resetProjects();
  }

  const server = app.listen(0);

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Server did not start on a TCP port');
    }

    await fn(address.port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
}

test('POST /api/projects creates a project and returns it', async () => {
  await withServer(async port => {
    const response = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'API IoT Monitor', status: 'Planned' })
    });

    assert.equal(response.status, 201);

    const project = await response.json();
    assert.equal(project.name, 'API IoT Monitor');
    assert.equal(project.status, 'Planned');
    assert.ok(project.id);
  });
});

test('GET /api/projects returns saved projects', async () => {
  await withServer(async port => {
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Tracker', status: 'In Progress' })
    });

    assert.equal(createResponse.status, 201);

    const listResponse = await fetch(`http://127.0.0.1:${port}/api/projects`);
    assert.equal(listResponse.status, 200);

    const list = await listResponse.json();
    assert.equal(list.length, 1);
    assert.equal(list[0].name, 'Tracker');
  });
});

test('PUT /api/projects/:id updates an existing project', async () => {
  await withServer(async port => {
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Original', status: 'Planned' })
    });

    const created = await createResponse.json();
    const updateResponse = await fetch(`http://127.0.0.1:${port}/api/projects/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated', status: 'Completed' })
    });

    assert.equal(updateResponse.status, 200);

    const updated = await updateResponse.json();
    assert.equal(updated.name, 'Updated');
    assert.equal(updated.status, 'Completed');
  });
});

test('DELETE /api/projects/:id removes a project and returns 200', async () => {
  await withServer(async port => {
    const createResponse = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Delete Me', status: 'Planned' })
    });

    const created = await createResponse.json();
    const deleteResponse = await fetch(`http://127.0.0.1:${port}/api/projects/${created.id}`, {
      method: 'DELETE'
    });

    assert.equal(deleteResponse.status, 200);
    assert.deepEqual(await deleteResponse.json(), { deleted: true });

    const listResponse = await fetch(`http://127.0.0.1:${port}/api/projects`);
    assert.deepEqual(await listResponse.json(), []);
  });
});

test('POST /api/projects rejects invalid project data', async () => {
  await withServer(async port => {
    const response = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', status: 'Unknown' })
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /Project name/);
  });
});

test('SQLite data survives a server restart', async () => {
  let createdProject;

  await withServer(async port => {
    const response = await fetch(`http://127.0.0.1:${port}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Persistent Monitor', status: 'In Progress' })
    });
    assert.equal(response.status, 201);
    createdProject = await response.json();
  });

  await withServer(async port => {
    const response = await fetch(`http://127.0.0.1:${port}/api/projects`);
    assert.equal(response.status, 200);

    const projects = await response.json();
    assert.deepEqual(projects, [createdProject]);
  }, { reset: false });

  const inspection = new DatabaseSync(testDatabasePath);
  try {
    const storedProject = inspection.prepare(
      'SELECT id, name, status FROM projects WHERE id = ?'
    ).get(createdProject.id);
    assert.deepEqual({ ...storedProject }, createdProject);
  } finally {
    inspection.close();
  }
});
