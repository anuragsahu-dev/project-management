# 🛠️ Project Setup Guide

This guide covers the complete setup execution for both **Docker** (Recommended) and **Non-Docker** environments.

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18+): [Download here](https://nodejs.org/)
- **Docker & Docker Compose**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) (for Docker method)
- **PostgreSQL**: (Only for Non-Docker method)
- **Redis**: (Only for Non-Docker method)

---

## 🔧 Environment Variables

1.  **Duplicate the example file**:

    ```bash
    cp .env.example .env
    ```

2.  **Configure `.env`**:

    | Variable       | Description         | Value (Docker)                                                      | Value (Non-Docker)                                           |
    | :------------- | :------------------ | :------------------------------------------------------------------ | :----------------------------------------------------------- |
    | `PORT`         | Server Port         | `3000`                                                              | `3000`                                                       |
    | `DATABASE_URL` | Postgres Connection | `postgresql://postgres:password@postgres:5432/taskdb?schema=public` | `postgresql://user:pass@localhost:5432/taskdb?schema=public` |
    | `REDIS_HOST`   | Redis Connection    | `redis`                                                             | `localhost`                                                  |
    | `CLOUDINARY_*` | File Uploads        | (Your Credentials)                                                  | (Your Credentials)                                           |
    | `SMTP_*`       | Email Service       | (Your Credentials)                                                  | (Your Credentials)                                           |

---

## 🐳 Docker Setup (Recommended)

We use `compose.dev.yaml` for a robust local development environment that includes Hot-Reloading, Database, and Caching.

### 🟩 1. First Time Setup (Fresh Start)

If this is your first time running the project or you are setting it up on a new machine:

```bash
# 1. Start only the databases (Postgres & Redis) in the background
docker compose -f compose.dev.yaml up -d postgres redis

# 2. Run Prisma Migrations to create tables
docker compose -f compose.dev.yaml run --rm taskmanager npx prisma migrate dev

# 3. Start the full application (Seed runs automatically)
docker compose -f compose.dev.yaml up --build -d
```

_🎉 Result: Tables created, Migrations applied, Seed data loaded, App running at `http://localhost:3000`_

### 🟦 2. Everyday Development

For normal daily work, you only need one command:

```bash
docker compose -f compose.dev.yaml up --build -d
```

_No manual migrations or seeding needed. The container handles startup automatically._

### 🟪 3. After Schema Changes

If you modify `prisma/schema.prisma` (e.g., adding a new model):

```bash
# 1. Create migration file and apply to DB
docker compose -f compose.dev.yaml run --rm taskmanager npx prisma migrate dev --name <migration_name>

# 2. Restart the app
docker compose -f compose.dev.yaml up --build -d
```

### 🟥 4. Stopping Containers

To stop the containers:

```bash
docker compose -f compose.dev.yaml down
```

_Note: Your database data is persisted in a docker volume._

### 🔥 5. Hard Reset (Wipe Database)

If you want to delete everything and start fresh:

```bash
# 1. Destroy containers and volumes (deletes data)
docker compose -f compose.dev.yaml down -v

# 2. Re-initialize databases
docker compose -f compose.dev.yaml up -d postgres redis

# 3. Re-apply migrations
docker compose -f compose.dev.yaml run --rm taskmanager npx prisma migrate dev

# 4. Start app (Seed will run again)
docker compose -f compose.dev.yaml up --build -d
```

---

## 🐢 Manual Setup (Non-Docker)

Use this method if you cannot use Docker and prefer running services locally.

### 1. Database Setup

- Install and start **PostgreSQL**.
- Create a database named `taskdb`.
- Install and start **Redis** on port `6379`.

### 2. Dependencies

```bash
npm install
```

### 3. Migrations & Seeding

```bash
# Run migrations
npx prisma migrate dev

# Seed database
npm run seed
```

### 4. Start Server

```bash
npm run dev
```

---

## 🟦 Workflow Summary

| Situation         | Command                                         |
| :---------------- | :---------------------------------------------- |
| **First Setup**   | `up -d db` → `migrate dev` → `up --build`       |
| **Daily Work**    | `docker compose -f compose.dev.yaml up --build` |
| **Schema Update** | `migrate dev --name ...` → `up --build`         |
| **Reset DB**      | `down -v` → _Repeat First Setup_                |
