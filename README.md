# DevBoard

**DevBoard** is a full-stack Kanban-style task manager for developers, built with a **Java Spring Boot REST API** and a **vanilla HTML/CSS/JavaScript frontend**.

The backend provides RESTful CRUD operations for managing tasks and uses **Spring Data JPA with an H2 database** for persistence. The frontend provides an interactive drag-and-drop board for moving tasks between **To Do, In Progress, and Done**.

## Features

* Create, edit, and delete tasks
* Kanban board with To Do, In Progress, and Done columns
* Drag-and-drop task status updates
* High, medium, and low priority levels
* Optional due dates
* Search and priority filtering
* GitHub-style task completion activity heatmap
* Daily completion streak tracking
* Dark/light theme toggle
* Responsive frontend
* REST API integration using JavaScript `fetch()`
* `localStorage` fallback when the backend is unavailable

## Tech Stack

**Backend**

* Java 17
* Spring Boot 3
* Spring Web
* Spring Data JPA
* Jakarta Validation
* H2 Database
* Maven

**Frontend**

* HTML5
* CSS3
* Vanilla JavaScript (ES6+)
* Fetch API
* HTML5 Drag and Drop API
* Browser localStorage

## Architecture

The backend follows a simple layered architecture:

**Controller → Service → Repository → Database**

* **Controller** — exposes REST API endpoints
* **Service** — contains task-related business logic
* **Repository** — handles database operations through Spring Data JPA
* **Entity** — represents task data stored in the database

## REST API

| Method | Endpoint                 | Purpose            |
| ------ | ------------------------ | ------------------ |
| GET    | `/api/tasks`             | Get all tasks      |
| GET    | `/api/tasks/{id}`        | Get a task by ID   |
| POST   | `/api/tasks`             | Create a task      |
| PUT    | `/api/tasks/{id}`        | Update a task      |
| PATCH  | `/api/tasks/{id}/status` | Update task status |
| DELETE | `/api/tasks/{id}`        | Delete a task      |

## Running Locally

### 1. Start the backend

Make sure Java 17+ and Maven are installed.

```bash
cd backend
mvn spring-boot:run
```

The REST API will start at:

```text
http://localhost:8080
```

### 2. Start the frontend

From the project root, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

If the Spring Boot backend is unavailable, the frontend automatically switches to `localStorage` mode.

## Project Structure

```text
DevBoard/
├── index.html
├── style.css
├── script.js
├── README.md
└── backend/
    ├── pom.xml
    └── src/
        └── main/
            ├── java/
            │   └── devboard/
            │       ├── DevboardBackendApplication.java
            │       ├── Task.java
            │       ├── TaskController.java
            │       ├── TaskService.java
            │       ├── TaskRepository.java
            │       ├── DataSeeder.java
            │       ├── Priority.java
            │       ├── Status.java
            │       └── StatusUpdateRequest.java
            └── resources/
                └── application.properties
```
