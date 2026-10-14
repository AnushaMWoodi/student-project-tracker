const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');

const projects = [];

function renderProjects() {
  projectList.replaceChildren();

  for (const project of projects) {
    const item = document.createElement('li');
    item.textContent = `${project.name} — ${project.status}`;
    projectList.append(item);
  }

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
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
  projects.push({
    id: crypto.randomUUID(),
    name,
    status
  });

  renderProjects();
  form.reset();
});