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

### 1. First Time Setup

Run these commands in order to build and initialize the project from scratch.

```bash
# 1. Build the images (Clean build with no cache)
docker compose -f compose.dev.yaml build --no-cache

# 2. Start the services in detached mode (background)
docker compose -f compose.dev.yaml up -d

# 3. Apply Database Migrations
docker compose -f compose.dev.yaml run --rm taskmanager npx prisma migrate dev

# 4. Seed Database with initial data
docker compose -f compose.dev.yaml run --rm taskmanager npm run seed
```

### 2. Daily Workflow

**To Start the App:**
This starts the app and streams logs to your terminal.

```bash
docker compose -f compose.dev.yaml up
```

**To Stop the App:**
Stops and removes the containers.

```bash
docker compose -f compose.dev.yaml down
```

**To Stop and Remove Volumes (Full Reset):**
Use this to delete your database data and start fresh.
You can use this if you want to reset your database.
And then you have to run the first time setup again.

```bash
docker compose -f compose.dev.yaml down -v
```

### 3. Development Scenarios

**What if I change the code?**

- **Action**: Just save the file. The app will **auto-reload** instantly. No need to restart.

**What if I update `package.json`?**

- **Action**: You need to rebuild to install new dependencies.
  ```bash
  docker compose -f compose.dev.yaml up --build -d
  ```

**What if I change `schema.prisma`?**

- **Action**: You must create a new migration.
  ```bash
  docker compose -f compose.dev.yaml run --rm taskmanager npx prisma migrate dev --name "your_migration_name"
  ```

---

## 🐢 Non-Docker Setup (Manual)

Use this if you want to run Node.js, Postgres, and Redis manually on your machine.

### Prerequisites

1.  **PostgreSQL**: Installed and running locally.
2.  **Redis**: Installed and running locally (Port 6379).
3.  **Environment**: ensure `.env` has `DATABASE_URL` and `REDIS_HOST` pointing to localhost.

### Setup Instructions

```bash
# 1. Install Dependencies
npm install

# 2. Run Database Migrations
npx prisma migrate dev

# 3. Seed Database
npm run seed

# 4. Start Development Server
npm run dev
```
