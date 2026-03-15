# SELU 383 Project

This repository contains:

- `Selu383.SP26.Api`: ASP.NET Core API
- `Selu383.SP26.Web`: React + Vite web app
- `Selu383.SP26.Mobile`: Expo mobile app
- `Selu383.SP26.Tests`: automated tests

The easiest way to run the project from scratch on both macOS and Windows is Docker. Start there unless y
## 1. Run the Project with Docker

This starts:

- SQL Server
- the ASP.NET API
- the Vite web app

From the repo root, run:

```bash
docker compose up --build
```

Start the web app:

```bash
cd Selu383.SP26.Web
npm install
npm run dev
```


## 2. Run API
In a second terminal, start the API with a SQL Server connection string:

```bash
cd Selu383.SP26.Api
ConnectionStrings__DataContext="Server=localhost,1433;Database=SP26-P03-G07;User Id=sa;Password=Password123!;TrustServerCertificate=True" dotnet run
```

Then open:

- `http://localhost:5173`
- the API URL shown by `dotnet run`

If you use `zsh` on macOS, the command above works as written. If you prefer another shell, set the environment variable using that shell's syntax.


## 2. Mobile App

The mobile app is optional and separate from the Docker stack.

From the repo root:

```bash
cd Selu383.SP26.Mobile
npm install
npm run start
```

Then choose one of the Expo targets shown in the terminal.

