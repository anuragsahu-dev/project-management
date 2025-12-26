# Development Setup Guide

This guide will help you set up the Project Management API for local development. Choose either the **Local Setup** (without Docker for the app) or **Docker Setup** (recommended for consistency).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Setup (Without Docker)](#local-setup-without-docker)
4. [Docker Setup (Recommended)](#docker-setup-recommended)
5. [Third-Party Services Configuration](#third-party-services-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

| Tool           | Version | Required For |
| -------------- | ------- | ------------ |
| Node.js        | 20+     | Local setup  |
| npm            | 10+     | Local setup  |
| Docker         | 24+     | Docker setup |
| Docker Compose | 2.20+   | Docker setup |
| Git            | 2.40+   | Both         |

---

## Environment Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/anuragsahu-dev/project-management.git
cd project-management
```

### 2. Create Environment File

```bash
cp .env.example .env
```

> **Note:** If `.env.example` doesn't exist, create a `.env` file manually using the template below.

### 3. Configure Required Variables

Open `.env` and configure the following:

#### Minimum Required for Development

```env
# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database (Local Docker)
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskdb?schema=public

# Redis (Local Docker)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (Generate secure random strings)
ACCESS_TOKEN_SECRET=your-super-secret-access-token-key-min-32-chars
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-min-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Password Reset URL
FORGOT_PASSWORD_REDIRECT_URL=http://localhost:5173/reset-password

# Email (Required for email verification & password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

> **Important:** See [Third-Party Services Configuration](#third-party-services-configuration) for detailed Cloudinary and Email setup instructions.

---

## Local Setup (Without Docker)

Use this approach if you want to run the Node.js app locally while using Docker only for PostgreSQL and Redis.

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database and Redis (via Docker)

```bash
docker compose -f compose.dev.yaml up postgres redis -d
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Seed the Database

```bash
npm run seed
```

This creates the initial users with the following credentials:

| Role        | Email                  | Password   |
| ----------- | ---------------------- | ---------- |
| Super Admin | superadmin@example.com | `password` |
| Admin       | admin@example.com      | `password` |
| Manager     | manager@example.com    | `password` |
| User        | user@example.com       | `password` |

### 6. Start the Development Server

```bash
npm run dev
```

### 7. Access the Application

| Service      | URL                            |
| ------------ | ------------------------------ |
| API          | http://localhost:3000/api/v1   |
| Swagger Docs | http://localhost:3000/api-docs |
| Health Check | http://localhost:3000/health   |

---

## Docker Setup (Recommended)

Use this approach to run the entire stack (PostgreSQL, Redis, and the app) inside Docker containers. This ensures consistency across different development environments.

### First Time Setup

Run these commands in order to build and initialize the project from scratch:

```bash
# 1. Build the images (clean build with no cache)
docker compose -f compose.dev.yaml build --no-cache

# 2. Start all services in detached mode (background)
docker compose -f compose.dev.yaml up -d

# 3. Apply database migrations
docker compose -f compose.dev.yaml exec taskmanager npx prisma migrate dev

# 4. Seed database with initial data
docker compose -f compose.dev.yaml exec taskmanager npm run seed
```

### Access the Application

| Service      | URL                            |
| ------------ | ------------------------------ |
| API          | http://localhost:3000/api/v1   |
| Swagger Docs | http://localhost:3000/api-docs |
| Health Check | http://localhost:3000/health   |

---

### Daily Workflow

#### Start the App

Starts all services in the background:

```bash
docker compose -f compose.dev.yaml up -d
```

#### View Logs

Stream logs to your terminal:

```bash
docker compose -f compose.dev.yaml logs taskmanager
```

#### Stop the App

Stops and removes the containers (data is preserved):

```bash
docker compose -f compose.dev.yaml down
```

#### Full Reset (Delete Database Data)

Stops containers and removes volumes. Use this to start fresh:

```bash
docker compose -f compose.dev.yaml down -v
```

> **Warning:** This deletes all database data. You'll need to run migrations and seed again.

---

### Common Scenarios

#### What if I change the code?

**Action:** Just save the file. The app will auto-reload instantly via nodemon. No restart needed.

#### What if I update `package.json`?

**Action:** Rebuild to install new dependencies:

```bash
docker compose -f compose.dev.yaml up --build -d
```

#### What if I change `prisma/schema.prisma`?

**Action:** Create a new migration:

```bash
docker compose -f compose.dev.yaml exec taskmanager npx prisma migrate dev --name "your_migration_name"
```

#### What if I want to access the database directly?

**Action:** Use Prisma Studio:

```bash
# Local setup
npx prisma studio

# Docker setup
docker compose -f compose.dev.yaml exec taskmanager npx prisma studio
```

---

### Useful Docker Commands

| Command                                                  | Description              |
| -------------------------------------------------------- | ------------------------ |
| `docker compose -f compose.dev.yaml ps`                  | List running containers  |
| `docker compose -f compose.dev.yaml logs -f`             | Stream all logs          |
| `docker compose -f compose.dev.yaml logs -f taskmanager` | Stream only app logs     |
| `docker compose -f compose.dev.yaml exec taskmanager sh` | Shell into app container |
| `docker compose -f compose.dev.yaml restart taskmanager` | Restart only the app     |
| `docker compose -f compose.dev.yaml down`                | Stop all containers      |
| `docker compose -f compose.dev.yaml down -v`             | Stop and remove volumes  |

---

## Third-Party Services Configuration

### Cloudinary (File Uploads)

Cloudinary is **required** for file upload functionality in this project (e.g., user avatars, project attachments).

#### 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a **free account**
2. After signing up, you'll be redirected to your **Dashboard**

#### 2. Get Your Credentials

From your Cloudinary Dashboard, locate the **API Environment Variable** section. You'll find:

| Credential     | Where to Find                          |
| -------------- | -------------------------------------- |
| **Cloud Name** | Displayed prominently on the dashboard |
| **API Key**    | In the API Keys section                |
| **API Secret** | Click "Reveal" next to API Secret      |

> **Screenshot Guide:** The credentials are typically shown in a box that looks like:
>
> ```
> cloudinary://API_KEY:API_SECRET@CLOUD_NAME
> ```

#### 3. Configure Upload Presets (Optional but Recommended)

For secure uploads, you can configure upload presets:

1. Go to **Settings → Upload**
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Set **Signing Mode** to `Signed` for secure uploads
5. Configure folder names, transformations, etc.

#### 4. Update Your `.env` File

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

#### 5. Verify Configuration

After starting the server, you can verify Cloudinary is properly configured by:

- Checking the server logs for any Cloudinary-related errors
- Testing a file upload endpoint

> **Free Tier Limits:** Cloudinary's free tier includes 25 credits/month, which is sufficient for development and small projects.

---

### Email Service (SMTP)

Email is required for user verification and password reset functionality.

#### Using Gmail (Recommended for Development)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords** (search for it in account settings)
4. Generate a new app password for "Mail"
5. Copy the 16-character password

#### Update `.env`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # App password (not your account password)
```

#### Alternative Email Services

| Service  | SMTP Host             | Port |
| -------- | --------------------- | ---- |
| Gmail    | smtp.gmail.com        | 587  |
| Outlook  | smtp-mail.outlook.com | 587  |
| SendGrid | smtp.sendgrid.net     | 587  |
| Mailgun  | smtp.mailgun.org      | 587  |

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000 (Windows)
netstat -ano | findstr :3000

# Find process using port 3000 (Mac/Linux)
lsof -i :3000

# Kill the process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # Mac/Linux
```

### Database Connection Failed

1. Ensure PostgreSQL is running:
   ```bash
   docker compose -f compose.dev.yaml ps
   ```
2. Check if the `DATABASE_URL` in `.env` is correct
3. For Docker setup, use `postgres` as host; for local setup, use `localhost`
4. Wait a few seconds for the database to be ready after starting

### Redis Connection Failed

1. Ensure Redis is running:
   ```bash
   docker compose -f compose.dev.yaml ps
   ```
2. Check `REDIS_HOST` and `REDIS_PORT` in `.env`
3. For Docker setup, use `redis` as host; for local setup, use `localhost`

### Prisma Migration Issues

```bash
# Reset the database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Docker Build Issues

```bash
# Remove all containers and rebuild
docker compose -f compose.dev.yaml down -v
docker compose -f compose.dev.yaml build --no-cache
docker compose -f compose.dev.yaml up -d
```

### Cloudinary Upload Errors

1. Verify your credentials are correct in `.env`
2. Ensure your Cloudinary account is active
3. Check if you've exceeded the free tier limits
4. Verify the API key hasn't been regenerated in the dashboard

### Seeding Issues

If the seed script fails:

1. Ensure the database is running and accessible
2. Make sure migrations have been applied first
3. Check for unique constraint violations (seed is designed to be idempotent)
4. For a clean start, reset the database and re-run migrations:
   ```bash
   npx prisma migrate reset
   npm run seed
   ```

---

## Next Steps

1. Access Swagger documentation at `http://localhost:3000/api-docs` to explore all endpoints
2. Test the authentication flow with the seeded users
3. Explore the API endpoints at `/api/v1`
4. Check health status at `/health`
5. Review the main [README.md](../README.md) for API overview
