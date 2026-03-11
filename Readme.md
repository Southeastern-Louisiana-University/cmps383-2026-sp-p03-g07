# SELU 383 Project

This repository contains:

- `Selu383.SP26.Api`: ASP.NET Core API
- `Selu383.SP26.Web`: React + Vite web app
- `Selu383.SP26.Mobile`: Expo mobile app
- `Selu383.SP26.Tests`: automated tests

The easiest way to run the project from scratch on both macOS and Windows is Docker. Start there unless you specifically want a local non-Docker setup.

## 1. Prerequisites

Install these before running anything:

- `Git`
- `Docker Desktop`
- `.NET SDK 10`
- `Node.js 22`

Check your installs:

```bash
git --version
docker --version
docker compose version
dotnet --version
node --version
npm --version
```

Notes:

- On macOS, install Docker Desktop and make sure it is running before using `docker compose`.
- On Windows, use either PowerShell or Command Prompt. Git Bash also works.
- If `docker compose` fails, open Docker Desktop and wait until it says Docker is running.

## 2. Clone the Repository

```bash
git clone <your-repo-url>
cd cmps383-2026-sp-p03-g07
```

## 3. Run the Project with Docker

This starts:

- SQL Server
- the ASP.NET API
- the Vite web app

From the repo root, run:

```bash
docker compose up --build
```

If you want it in the background:

```bash
docker compose up --build -d
```

When startup finishes, open:

- Web app: `http://localhost:5173`
- API through the ASP.NET app: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`

What happens automatically:

- SQL Server starts in Docker
- the API connects to that SQL Server instance
- Entity Framework migrations run automatically
- seed data is inserted automatically on first startup

Default seeded users:

- `galkadi` / `Password123!`
- `bob` / `Password123!`
- `sue` / `Password123!`

## 4. Stop the Project

Stop containers:

```bash
docker compose down
```

Stop containers and delete the database volume:

```bash
docker compose down -v
```

Use `-v` only if you want a completely fresh database.

## 5. Run Without Docker

Use this only if you want to develop services locally.

### Windows local setup

Windows is the simpler non-Docker option because the default API config uses LocalDB.

Requirements:

- `.NET SDK 10`
- `Node.js 22`
- SQL Server LocalDB

Start the web app:

```bash
cd Selu383.SP26.Web
npm install
npm run dev
```

In a second terminal, start the API:

```bash
cd Selu383.SP26.Api
dotnet run
```

Then open:

- `http://localhost:5173`
- `https://localhost:7116`

Notes:

- The API proxies to the Vite dev server in Development mode.
- The default connection string in `Selu383.SP26.Api/appsettings.json` uses LocalDB on Windows.

### macOS local setup

On macOS, the API does not have LocalDB. The recommended approach is:

1. Run SQL Server with Docker
2. Run the API and web app locally

Start only the database with Docker:

```bash
docker compose up -d db
```

Start the web app:

```bash
cd Selu383.SP26.Web
npm install
npm run dev
```

In a second terminal, start the API with a SQL Server connection string:

```bash
cd Selu383.SP26.Api
ConnectionStrings__DataContext="Server=localhost,1433;Database=SP26-P03-G07;User Id=sa;Password=Password123!;TrustServerCertificate=True" dotnet run
```

Then open:

- `http://localhost:5173`
- the API URL shown by `dotnet run`

If you use `zsh` on macOS, the command above works as written. If you prefer another shell, set the environment variable using that shell's syntax.

## 6. Mobile App

The mobile app is optional and separate from the Docker stack.

From the repo root:

```bash
cd Selu383.SP26.Mobile
npm install
npm run start
```

Then choose one of the Expo targets shown in the terminal.

## 7. Useful Commands

Rebuild containers after code changes to Dockerfiles or Compose:

```bash
docker compose up --build
```

View logs:

```bash
docker compose logs -f
```

View logs for one service:

```bash
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
```

Check running containers:

```bash
docker compose ps
```

## 8. Troubleshooting

### Docker says the daemon is not running

Open Docker Desktop and wait until it finishes starting, then rerun:

```bash
docker compose up --build
```

### Port already in use

Another process may already be using `1433`, `5173`, or `8080`.

Stop the conflicting app or stop this stack:

```bash
docker compose down
```

### The browser shows a stale or broken page

Rebuild and restart:

```bash
docker compose down
docker compose up --build
```

### You want a completely clean database

```bash
docker compose down -v
docker compose up --build
```

## 9. Quick Start Summary

If you want the shortest working path on both macOS and Windows:

```bash
git clone <your-repo-url>
cd cmps383-2026-sp-p03-g07
docker compose up --build
```

Then open `http://localhost:8080` or `http://localhost:5173`.
