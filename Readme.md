# Docker setup

This repository includes a development `docker compose` stack for:

- SQL Server on `localhost:1433`
- ASP.NET API on `http://localhost:8080`
- Vite web app on `http://localhost:5173`

## Start

```bash
docker compose up --build
```

The API waits and retries while SQL Server finishes starting, then runs migrations and seeds the database automatically.

## Stop

```bash
docker compose down
```

To remove the SQL Server volume as well:

```bash
docker compose down -v
```

## Notes

- The Docker setup is development-focused and uses bind mounts for live reload.
- The API skips the Visual Studio web project reference inside containers because the frontend runs as its own service in Docker.
- The SQL Server login is `sa` with password `Your_password123`.
