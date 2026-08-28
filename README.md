# DevBoard

A full-stack Kanban task manager: a **vanilla HTML/CSS/JS frontend** backed by a **Java Spring Boot REST API**. Every task you complete lights up a GitHub-style contribution heatmap.

If the backend isn't running, the frontend automatically falls back to `localStorage` — so it still works standalone.

![DevBoard preview](preview.png)

## Live Demo
[View live demo](#) <!-- replace with your GitHub Pages link after deploying -->

## Features

- **Drag-and-drop board** — move tasks between To Do / In Progress / Done using the native HTML5 Drag and Drop API
- **Commit-style activity heatmap** — every completed task lights up a square, just like a GitHub contribution graph, and tracks your current daily streak
- **Full CRUD** — create, edit, and delete tasks via a REST API backed by a real database
- **Live search & priority filters** — instantly filter the board as you type
- **Java REST backend** — Spring Boot + Spring Data JPA, layered into controller/service/repository, with request validation and a proper error response for missing tasks
- **Graceful offline fallback** — if the API is unreachable, the app keeps working using `localStorage`
- **Dark / light theme toggle**, fully responsive down to mobile

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | HTML5, CSS3, vanilla JavaScript (ES6+, `fetch`) |
| Backend | Java 17, Spring Boot 3, Spring Web, Spring Data JPA |
| Database | H2 (in-memory, swappable for MySQL/Postgres) |
| Build | Maven |

No React, no jQuery on the frontend — built this way deliberately, to show DOM manipulation, the Drag and Drop API, and async state handling without leaning on a framework. The backend follows a standard layered architecture (`Controller → Service → Repository`) rather than putting logic straight in the controller.

## Project Structure

```
devboard/
├── index.html, style.css, script.js   # frontend
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/devboard/backend/
│       ├── model/          # Task entity, Priority/Status enums
│       ├── repository/     # TaskRepository (Spring Data JPA)
│       ├── service/        # TaskService — business logic
│       ├── controller/     # TaskController — REST endpoints
│       └── config/         # DataSeeder — sample data on startup
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/{id}` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/{id}` | Update a task |
| PATCH | `/api/tasks/{id}/status` | Update just the status (used by drag-and-drop) |
| DELETE | `/api/tasks/{id}` | Delete a task |

## Running Locally

**1. Start the backend** (requires Java 17+ and Maven):
```bash
cd backend
mvn spring-boot:run
```
This starts the API at `http://localhost:8080`, seeded with sample tasks. H2 console (dev only) at `http://localhost:8080/h2-console`.

**2. Open the frontend:**
```bash
# from the project root, in a separate terminal
python3 -m http.server 8000
```
Visit `http://localhost:8000`. The frontend calls the API automatically; if the backend isn't running, it falls back to `localStorage` so the UI still works.

## Deploying

- **Frontend** → GitHub Pages (Settings → Pages → main branch, root folder)
- **Backend** → any Java host (Render, Railway, or a VPS); swap H2 for a persistent database like PostgreSQL for production by updating `application.properties`

## What This Project Demonstrates

- DOM manipulation without a framework
- Native HTML5 Drag and Drop API
- Client-side state management and persistence (`localStorage`)
- Event delegation and clean event-handling patterns
- Responsive, accessible UI (keyboard focus states, `prefers-reduced-motion` support)
- CSS architecture with design tokens (custom properties) for consistent theming
- Working with dates for streaks and a calendar-style heatmap

## Possible Extensions

- Sync tasks to a backend (Firebase / Node + Express) for multi-device access
- Add task tags/labels and a tag-based filter
- Export/import board as JSON
- Add unit tests with Jest

## License

MIT — free to use and modify.
