const validStatuses = new Set(['Planned', 'In Progress', 'Completed']);
const projects = [];

function normalizeName(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidName(value) {
  return value.length > 0 && value.length <= 80;
}

function normalizeStatus(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidStatus(value) {
  return typeof value === 'string' && validStatuses.has(value.trim());
}

export function resetProjects() {
  projects.splice(0, projects.length);
}

export function listProjects() {
  return projects.map(project => ({ ...project }));
}

export function createProject(rawProject = {}) {
  const name = normalizeName(rawProject.name);

  if (!isValidName(name)) {
    throw new Error('Project name is required and must be 1-80 characters long.');
  }

  const status = normalizeStatus(rawProject.status);

  if (!isValidStatus(status)) {
    throw new Error('Project status must be Planned, In Progress, or Completed.');
  }

  const project = {
    id: crypto.randomUUID(),
    name,
    status
  };

  projects.push(project);
  return { ...project };
}

export function updateProject(id, rawProject = {}) {
  const index = projects.findIndex(project => project.id === id);

  if (index === -1) {
    return null;
  }

  const nextName = normalizeName(rawProject.name ?? projects[index].name);
  const nextStatus = normalizeStatus(rawProject.status ?? projects[index].status);

  if (!isValidName(nextName)) {
    throw new Error('Project name is required and must be 1-80 characters long.');
  }

  if (!isValidStatus(nextStatus)) {
    throw new Error('Project status must be Planned, In Progress, or Completed.');
  }

  const updatedProject = {
    ...projects[index],
    name: nextName,
    status: nextStatus
  };

  projects[index] = updatedProject;
  return { ...updatedProject };
}

export function deleteProject(id) {
  const index = projects.findIndex(project => project.id === id);

  if (index === -1) {
    return false;
  }

  projects.splice(index, 1);
  return true;
}
