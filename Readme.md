# SELU 383 Project

This repository contains:

- `Selu383.SP26.Api`: ASP.NET Core API
- `Selu383.SP26.Web`: React + Vite web app
- `Selu383.SP26.Mobile`: Expo mobile app
- `Selu383.SP26.Tests`: automated tests

The easiest way to run the project locally on macOS or Windows is Docker Compose.

## 1. Run the API with Docker

This starts:

- SQL Server
- the ASP.NET API
- the Vite web app

From the repo root, run:

```bash
docker compose up --build -d
```

### Payments (Demo or Stripe test)

By default, the checkout screen uses **Demo payment mode** (no real charge).

To enable **Stripe test payments**, create a `.env` file at the repo root (see `.env.example`) and set:

- `STRIPE_PUBLISHABLE_KEY` (starts with `pk_...`)
- `STRIPE_SECRET_KEY` (starts with `sk_...`)

Then open:

- `http://localhost:8080`
- `http://localhost:8080/swagger/index.html`
- `http://localhost:5173`

Useful commands:

```bash
docker compose logs -f api
docker compose down
```

Note: in the current `docker-compose.yml`, the `api` service depends on both `db` and `web`, so starting the API through Docker Compose brings those services up as well.

## 2. Run API without Docker

If you prefer to run the API directly with `dotnet`, first make sure SQL Server is available on `localhost:1433`, then run:

```bash
cd Selu383.SP26.Api
ConnectionStrings__DataContext="Server=localhost,1433;Database=SP26-P03-G07;User Id=sa;Password=Password123!;TrustServerCertificate=True" dotnet run
```

Then open:

- `http://localhost:5173`
- the API URL shown by `dotnet run`

If you use `zsh` on macOS, the command above works as written. If you prefer another shell, set the environment variable using that shell's syntax.


## 3. Mobile App

The mobile app is optional and separate from the Docker stack.

From the repo root:

```bash
cd Selu383.SP26.Mobile
npm install
npm start
or npm run android

```

## 4. Admin


```bash
Open:
http://localhost:5173/#/login
Sign in with the seeded admin account:

Username: galkadi
Password: Password123!
After that, go to:

http://localhost:5173/#/admin





```

Then choose one of the Expo targets shown in the terminal.
