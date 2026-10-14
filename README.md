# Student Project Tracker

A small local full-stack app for tracking electronics project ideas. Add a project, change its status, edit it, or delete it. The browser sends requests to an Express API, and the API stores project records in SQLite.

## Run locally

Use Node.js 22.23.3, the workshop baseline. In PowerShell, from this folder:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

Open <http://localhost:3000> while the server is running. Stop the server with Ctrl+C. The app creates `data/projects.db` on first start; `.gitignore` excludes the local database and credentials.

## Architecture

```text
Browser (public/)
    | fetch: GET, POST, PUT, DELETE /api/projects
    v
Express API (app.js)
    | parameterized SQLite statements
    v
SQLite database (data/projects.db)
```

`public/index.html` contains the page structure, `public/style.css` styles it, and `public/script.js` handles form actions and API requests. `server.js` starts the local server. `app.js` defines the HTTP routes, and `database.js` creates and queries the SQLite table.

## API

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create a project (`201`) |
| PUT | `/api/projects/:id` | Update a project (`200`) |
| DELETE | `/api/projects/:id` | Delete a project (`200`) |

Project names are required and limited to 80 characters. Status must be `Planned`, `In Progress`, or `Completed`. Invalid project input returns `400`; requests for missing projects return `404`.

## Verification evidence

Run `npm.cmd test` for automated API coverage of create, list, update, delete, invalid input, and project persistence across a server restart. The persistence test also reads the stored SQLite row directly. A browser acceptance check created `IoT Monitor`, edited it to `Completed`, deleted a separate test project, and confirmed that cancelling another delete kept its project. A read-only SQLite query showed `IoT Monitor` with status `Completed`; after a server restart, the UI still displayed it. Stopping the server produced a visible save error, and the app returned to `Ready` after restart. These manual checks used a temporary database. The automated tests also use a temporary database and do not clear or alter the normal `data/projects.db`.

## Demo limitations

This workshop demo runs locally and has no login or multi-user isolation. Project data persists in the local SQLite file across browser refreshes and server restarts, but it is not synchronized or deployed. Data saved in the earlier browser-local-storage version is not migrated; recreate those projects after switching to the API.
