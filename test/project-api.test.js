import test from 'node:test';
import assert from 'node:assert/strict';

import app from '../app.js';
import { resetProjects } from '../database.js';

async function withServer(fn) {
  resetProjects();
  const server = app.listen(0);

  try {
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Server did not start on a TCP port');
    }

    await fn(address.port);
  } finally {
    await new Promise(resolve => server.close(resolve));
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

test('GET /api/projects returns the saved project list', async () => {
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
    assert.ok(Array.isArray(list));
    assert.ok(list.some(item => item.name === 'Tracker'));
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

test('DELETE /api/projects/:id removes an item and returns 204', async () => {
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

    assert.equal(deleteResponse.status, 204);
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
  });
});
