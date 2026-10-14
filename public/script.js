const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const message = document.querySelector('#message');

const storageKey = 'workshop-projects-v1';
const projects = [];
let editingId = null;
let storageWritable = true;

function showMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

function isValidProjectArray(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  const ids = new Set();

  return value.every(project => {
    if (
      project === null ||
      typeof project !== 'object' ||
      typeof project.id !== 'string' ||
      project.id.trim() === '' ||
      typeof project.name !== 'string' ||
      project.name.trim() === '' ||
      typeof project.status !== 'string' ||
      ids.has(project.id)
    ) {
      return false;
    }

    ids.add(project.id);
    return true;
  });
}

function loadProjects() {
  let storedText;

  try {
    storedText = localStorage.getItem(storageKey);
  } catch {
    storageWritable = false;
    showMessage('Projects could not be read from browser storage.');
    return;
  }

  if (storedText === null) {
    return;
  }

  try {
    const storedProjects = JSON.parse(storedText);

    if (!isValidProjectArray(storedProjects)) {
      storageWritable = false;
      showMessage(
        'Saved project data is invalid. It was left unchanged, and changes in this session cannot be saved.'
      );
      return;
    }

    projects.push(...storedProjects);
  } catch {
    storageWritable = false;
    showMessage(
      'Saved project data could not be read. It was left unchanged, and changes in this session cannot be saved.'
    );
  }
}

function saveProjects() {
  if (!storageWritable) {
    showMessage('Project changes could not be saved to browser storage.');
    return;
  }

  try {
    const projectsText = JSON.stringify(projects);
    localStorage.setItem(storageKey, projectsText);
    showMessage('');
  } catch {
    showMessage('Project changes could not be saved to browser storage.');
  }
}

function setAddMode() {
  editingId = null;
  form.reset();
  saveButton.textContent = 'Add project';
  cancelButton.textContent = 'Cancel edit';
  cancelButton.hidden = true;
}

function startEditing(id) {
  const project = projects.find(item => item.id === id);

  if (!project) {
    return;
  }

  editingId = project.id;
  nameInput.value = project.name;
  statusInput.value = project.status;
  saveButton.textContent = 'Save changes';
  cancelButton.textContent = 'Cancel edit';
  cancelButton.hidden = false;
  nameInput.focus();
}

function deleteProject(id) {
  const project = projects.find(item => item.id === id);

  if (!project) {
    return;
  }

  const confirmed = window.confirm(`Delete "${project.name}"?`);

  if (!confirmed) {
    return;
  }

  if (editingId === id) {
    setAddMode();
  }

  const remainingProjects = projects.filter(item => item.id !== id);
  projects.splice(0, projects.length, ...remainingProjects);

  saveProjects();
  renderProjects();
}

function renderProjects() {
  projectList.replaceChildren();

  for (const project of projects) {
    const item = document.createElement('li');
    const details = document.createElement('span');
    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    details.textContent = `${project.name} — ${project.status}`;

    editButton.type = 'button';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => {
      startEditing(project.id);
    });

    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      deleteProject(project.id);
    });

    item.append(details, ' ', editButton, ' ', deleteButton);
    projectList.append(item);
  }

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
    emptyState.textContent = projects.length === 0 ? 'No projects yet.' : '';
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === '') {
    nameInput.value = '';
    nameInput.reportValidity();
    return;
  }

  if (editingId === null) {
    projects.push({
      id: crypto.randomUUID(),
      name,
      status
    });
  } else {
    const project = projects.find(item => item.id === editingId);

    if (project) {
      project.name = name;
      project.status = status;
    }
  }

  saveProjects();
  renderProjects();
  setAddMode();
});

cancelButton.addEventListener('click', setAddMode);

loadProjects();
setAddMode();
renderProjects();