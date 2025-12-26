# Project Architecture

This document explains the architecture, role-based access control (RBAC), and permission system of the Project Management API.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Dual Role System](#dual-role-system)
3. [System Roles (Global)](#system-roles-global)
4. [Project Roles (Contextual)](#project-roles-contextual)
5. [How Roles Connect](#how-roles-connect)
6. [User Creation Rules](#user-creation-rules)
7. [Permission Matrix](#permission-matrix)
8. [Authentication Flow](#authentication-flow)
9. [Project Structure](#project-structure)
10. [API Endpoints Overview](#api-endpoints-overview)

---

## System Overview

This is a **restricted access system** where:

- ❌ **No public registration** - Users cannot self-register
- ✅ **Invite-only** - Existing privileged users create new accounts
- ✅ **Role-based permissions** - Every action is controlled by user role
- ✅ **Audit logging** - All user management actions are logged

### Why Restricted Registration?

This system is designed for organizations where:

- User access must be controlled by administrators
- Every user account needs approval before creation
- Audit trails are required for compliance

---

## Dual Role System

This project uses **two separate role systems** that work together:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DUAL ROLE SYSTEM                              │
├─────────────────────────────────┬───────────────────────────────────────┤
│       SYSTEM ROLES              │         PROJECT ROLES                 │
│       (Global/Organizational)   │         (Per-Project/Contextual)      │
├─────────────────────────────────┼───────────────────────────────────────┤
│  • SUPER_ADMIN                  │  • PROJECT_HEAD                       │
│  • ADMIN (can be multiple)      │  • PROJECT_MANAGER                    │
│  • MANAGER                      │  • TEAM_MEMBER                        │
│  • USER                         │                                       │
├─────────────────────────────────┼───────────────────────────────────────┤
│  Controls:                      │  Controls:                            │
│  - User creation                │  - Project access                     │
│  - System administration        │  - Task management                    │
│  - Project creation rights      │  - Team collaboration                 │
└─────────────────────────────────┴───────────────────────────────────────┘
```

### Key Concept

> A user has **ONE system role** (assigned when created) but can have **DIFFERENT project roles** in different projects.

For example:

- John is a **MANAGER** (system role)
- In "Project Alpha", John is the **PROJECT_MANAGER**
- In "Project Beta", John is just a **TEAM_MEMBER**

---

## System Roles (Global)

System roles define **what a user can do at the organizational level**:

### SUPER_ADMIN (Highest Authority)

```
SUPER_ADMIN
    │
    ├── Only ONE exists in the system (created via seed)
    ├── Can create: ADMIN, MANAGER
    ├── Can promote/demote: ADMIN ↔ MANAGER
    ├── Can create projects → becomes PROJECT_HEAD
    ├── Full read+write access to ALL projects (bypasses all checks)
    └── Cannot be deleted or demoted
```

### ADMIN (Multiple Allowed)

```
ADMIN
    │
    ├── Multiple ADMINs can exist (created by SUPER_ADMIN)
    ├── Can create: MANAGER, USER
    ├── Can promote/demote: USER ↔ MANAGER
    ├── Can create projects → becomes PROJECT_HEAD
    ├── Read-only access to ALL projects
    └── Can activate/deactivate USER accounts
```

### MANAGER

```
MANAGER
    │
    ├── Created by ADMIN or SUPER_ADMIN
    ├── Can create: USER only
    ├── Cannot create projects
    ├── Can be assigned as PROJECT_MANAGER in projects
    └── Works within assigned projects only
```

### USER (Lowest)

```
USER
    │
    ├── Created by ADMIN, SUPER_ADMIN, or MANAGER
    ├── Cannot create anyone
    ├── Can only be TEAM_MEMBER in projects
    └── Read/Write access to assigned tasks only
```

### System Role Capabilities

| Action                       | SUPER_ADMIN | ADMIN  | MANAGER | USER |
| ---------------------------- | :---------: | :----: | :-----: | :--: |
| Create Admin                 |     ✅      |   ❌   |   ❌    |  ❌  |
| Create Manager               |     ✅      |   ✅   |   ❌    |  ❌  |
| Create User                  |     ✅      |   ✅   |   ✅    |  ❌  |
| Promote/Demote to Admin      |     ✅      |   ❌   |   ❌    |  ❌  |
| Promote/Demote to Manager    |     ✅      |   ✅   |   ❌    |  ❌  |
| Activate/Deactivate Accounts |     ✅      |   ✅   |   ❌    |  ❌  |
| View All Users               |     ✅      |   ✅   |   ❌    |  ❌  |
| **Create Projects**          |     ✅      |   ✅   |   ❌    |  ❌  |
| Access All Projects          |  ✅ (R+W)   | ✅ (R) |   ❌    |  ❌  |

---

## Project Roles (Contextual)

Project roles define **what a user can do within a specific project**:

### PROJECT_HEAD

```
PROJECT_HEAD
    │
    ├── The user who created the project (always ADMIN or SUPER_ADMIN)
    ├── Full control over the project
    ├── Can assign a PROJECT_MANAGER
    ├── Can add/remove any team members
    ├── Can update and delete the project
    └── Cannot be removed from the project
```

### PROJECT_MANAGER

```
PROJECT_MANAGER
    │
    ├── Must have MANAGER system role (enforced)
    ├── Only ONE project manager per project
    ├── Can create, update, delete tasks
    ├── Can assign tasks to team members
    ├── Can add team members
    ├── Can remove TEAM_MEMBERs only (not HEAD)
    └── Assigned by PROJECT_HEAD
```

### TEAM_MEMBER

```
TEAM_MEMBER
    │
    ├── Default role when added to a project
    ├── Can be MANAGER or USER system role
    ├── Can view project and all tasks
    ├── Can update tasks assigned to them
    ├── Can create subtasks on their tasks
    └── Cannot create or delete tasks
```

---

## How Roles Connect

### Project Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROJECT CREATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

   ADMIN or SUPER_ADMIN
           │
           │  POST /api/v1/projects
           │  { displayName: "New Project", description: "..." }
           │
           ▼
   ┌───────────────────┐
   │  Create Project   │
   └───────────────────┘
           │
           │  Automatically...
           ▼
   ┌───────────────────────────────────────────┐
   │  Creator becomes PROJECT_HEAD             │
   │  (ProjectMember record with PROJECT_HEAD) │
   └───────────────────────────────────────────┘
```

### Adding Team Members Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADDING TEAM MEMBERS                                   │
└─────────────────────────────────────────────────────────────────────────┘

   PROJECT_HEAD wants to add users to the project

   ┌─────────────────────────────────────────────────────────────────────┐
   │  Step 1: Add a MANAGER as PROJECT_MANAGER                          │
   │                                                                     │
   │    POST /api/v1/projects/:projectId/assign-manager                  │
   │    { email: "manager@example.com" }                                 │
   │                                                                     │
   │    ✅ Only users with MANAGER system role can be PROJECT_MANAGER   │
   │    ✅ Previous manager (if any) is demoted to TEAM_MEMBER          │
   └─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │  Step 2: Add MANAGERS or USERS as TEAM_MEMBERs                      │
   │                                                                     │
   │    POST /api/v1/projects/:projectId/members                         │
   │    { email: "user@example.com" }                                    │
   │                                                                     │
   │    ✅ MANAGERs join as TEAM_MEMBER (unless already PROJECT_MANAGER)│
   │    ✅ USERs always join as TEAM_MEMBER                              │
   │    ❌ ADMIN and SUPER_ADMIN CANNOT join as members                  │
   └─────────────────────────────────────────────────────────────────────┘
```

### System Role → Project Role Mapping

| System Role | Can Create Projects? | What Happens When Added to Project?                  |
| ----------- | :------------------: | ---------------------------------------------------- |
| SUPER_ADMIN |          ✅          | Becomes PROJECT_HEAD. Cannot join others' projects.  |
| ADMIN       |          ✅          | Becomes PROJECT_HEAD. Cannot join others' projects.  |
| MANAGER     |          ❌          | Can be TEAM_MEMBER or PROJECT_MANAGER (if assigned). |
| USER        |          ❌          | Always TEAM_MEMBER.                                  |

### Important Rules

1. **Only ADMIN and SUPER_ADMIN can create projects**

   - Whoever creates a project automatically becomes PROJECT_HEAD

2. **ADMIN and SUPER_ADMIN cannot join projects as members**

   - They already have implicit access (read or read+write)
   - They don't appear in the project members list (except as creator)

3. **Only MANAGER system role can be PROJECT_MANAGER**

   - A USER cannot be promoted to PROJECT_MANAGER
   - Enforced at the API level

4. **Each project has exactly ONE PROJECT_MANAGER**

   - If you assign a new manager, the previous one becomes TEAM_MEMBER

5. **Multiple ADMINs can exist**
   - Created by SUPER_ADMIN
   - Each can create their own projects and become PROJECT_HEAD

---

## User Creation Rules

### How Users Are Created

Since there's no public registration, users are created through these endpoints:

| Endpoint                      | Who Can Use                 | What It Creates |
| ----------------------------- | --------------------------- | --------------- |
| `POST /api/v1/system/admin`   | SUPER_ADMIN only            | Admin account   |
| `POST /api/v1/system/manager` | SUPER_ADMIN, ADMIN          | Manager account |
| `POST /api/v1/users/register` | SUPER_ADMIN, ADMIN, MANAGER | User account    |

### Creation Flow

```
1. Creator authenticates (has valid JWT)
2. Creator's role is verified (must have permission)
3. Creator confirms action with their password
4. New user is created with email verification pending
5. Action is logged in UserActionLog table
6. Verification email is sent to new user
```

### Password Confirmation

For sensitive operations, the system requires **password confirmation**:

```json
{
  "email": "newuser@example.com",
  "password": "newUserPassword",
  "fullName": "New User",
  "userPassword": "creatorPassword" // Creator's password for confirmation
}
```

This prevents unauthorized account creation even if a session is compromised.

---

## Permission Matrix

### Project Operations

| Action                 | SUPER_ADMIN | ADMIN | PROJECT_HEAD | PROJECT_MANAGER | TEAM_MEMBER |
| ---------------------- | :---------: | :---: | :----------: | :-------------: | :---------: |
| Create Project         |     ✅      |  ✅   |      -       |        -        |      -      |
| View Any Project       |     ✅      |  ✅   |      -       |        -        |      -      |
| Update Project         |     ✅      |  ❌   |      ✅      |       ❌        |     ❌      |
| Delete Project         |     ✅      |  ❌   |      ✅      |       ❌        |     ❌      |
| Add Team Member        |     ✅      |  ❌   |      ✅      |       ✅        |     ❌      |
| Remove Team Member     |     ✅      |  ❌   |      ✅      |      ✅\*       |     ❌      |
| Assign Project Manager |     ✅      |  ❌   |      ✅      |       ❌        |     ❌      |

\*PROJECT_MANAGER can only remove TEAM_MEMBERs, not PROJECT_HEAD or other managers

### Task Operations

| Action         | SUPER_ADMIN | PROJECT_HEAD | PROJECT_MANAGER | TEAM_MEMBER (Assigned) | TEAM_MEMBER (Not Assigned) |
| -------------- | :---------: | :----------: | :-------------: | :--------------------: | :------------------------: |
| View Tasks     |     ✅      |      ✅      |       ✅        |           ✅           |             ✅             |
| Create Task    |     ✅      |      ✅      |       ✅        |           ❌           |             ❌             |
| Update Task    |     ✅      |      ✅      |       ✅        |           ✅           |             ❌             |
| Delete Task    |     ✅      |      ✅      |       ✅        |           ❌           |             ❌             |
| Create SubTask |     ✅      |      ✅      |       ✅        |           ✅           |             ❌             |

---

## Authentication Flow

### Login Flow

```
┌─────────┐     POST /login      ┌──────────────┐
│  User   │ ──────────────────── │   Backend    │
└─────────┘   email + password   └──────────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │ Validate     │
                                 │ Credentials  │
                                 └──────────────┘
                                        │
               ┌────────────────────────┼────────────────────────┐
               ▼                        ▼                        ▼
        Email Verified?          Password Valid?           Account Active?
               │                        │                        │
               └────────────────────────┴────────────────────────┘
                                        │
                                        ▼
                                 ┌──────────────┐
                                 │  Generate    │
                                 │  JWT Tokens  │
                                 └──────────────┘
                                        │
                                        ▼
                            accessToken (15m) + refreshToken (7d)
                            Set in HTTP-only cookies
```

### Token Refresh Flow

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- Both tokens are stored in **HTTP-only cookies** for security

---

## Project Structure

```
src/
├── config/              # Configuration (env vars, logger)
├── constants/           # Application constants
├── controllers/         # Request handlers (business logic)
│   ├── user.controller.ts      # Auth, profile management
│   ├── system.controller.ts    # Admin operations (create users)
│   ├── project.controller.ts   # Project CRUD
│   ├── task.controller.ts      # Task management
│   └── ...
├── db/                  # Database connections
│   ├── prisma.ts        # Prisma client
│   └── redis.ts         # Redis client
├── generated/           # Prisma generated types
├── middlewares/         # Express middlewares
│   ├── auth.middleware.ts      # JWT verification, role checks
│   ├── validate.middleware.ts  # Zod validation
│   ├── rateLimit.middleware.ts # Rate limiting
│   └── error.middleware.ts     # Error handling
├── routes/              # API route definitions
├── schemas/             # Zod validation schemas
├── types/               # TypeScript types
├── utils/               # Helper functions
│   ├── mail.ts          # Email sending
│   ├── cloudinary.ts    # File upload
│   └── ...
├── app.ts               # Express app setup
├── index.ts             # Entry point
└── swagger.ts           # API documentation
```

### Request Flow

```
Request → Rate Limiter → Auth Middleware → Role Check → Validation → Controller → Response
```

---

## API Endpoints Overview

### Authentication (`/api/v1/users`)

| Method | Endpoint                   | Auth Required | Description               |
| ------ | -------------------------- | :-----------: | ------------------------- |
| POST   | /login                     |      ❌       | User login                |
| POST   | /logout                    |      ✅       | User logout               |
| POST   | /register                  |      ✅       | Create user (restricted)  |
| POST   | /refresh-access-token      |      ❌       | Refresh JWT tokens        |
| GET    | /current-user              |      ✅       | Get logged-in user info   |
| GET    | /verify-email/:token       |      ❌       | Verify email address      |
| POST   | /resend-email-verification |      ❌       | Resend verification email |
| POST   | /forgot-password           |      ❌       | Request password reset    |
| POST   | /reset-password/:token     |      ❌       | Reset password with token |
| POST   | /change-password           |      ✅       | Change current password   |
| PUT    | /update-user               |      ✅       | Update profile            |

### System Management (`/api/v1/system`)

| Method | Endpoint         | Roles Required     | Description              |
| ------ | ---------------- | ------------------ | ------------------------ |
| GET    | /                | ADMIN, SUPER_ADMIN | Get all users            |
| POST   | /admin           | SUPER_ADMIN only   | Create admin account     |
| POST   | /manager         | ADMIN, SUPER_ADMIN | Create manager account   |
| PUT    | /manager/:userId | ADMIN, SUPER_ADMIN | Promote/demote manager   |
| PUT    | /user/:userId    | ADMIN, SUPER_ADMIN | Activate/deactivate user |

### Projects (`/api/v1/projects`)

| Method | Endpoint                    | Permission Required     | Description            |
| ------ | --------------------------- | ----------------------- | ---------------------- |
| GET    | /                           | Any authenticated       | Get my projects        |
| GET    | /all                        | ADMIN, SUPER_ADMIN      | Get all projects       |
| GET    | /:projectId                 | Project member or Admin | Get project details    |
| POST   | /                           | **ADMIN, SUPER_ADMIN**  | Create project         |
| PUT    | /:projectId                 | PROJECT_HEAD            | Update project         |
| DELETE | /:projectId                 | PROJECT_HEAD            | Delete project         |
| GET    | /:projectId/members         | Project member          | Get project members    |
| POST   | /:projectId/members         | HEAD, MANAGER           | Add team member        |
| DELETE | /:projectId/members/:userId | HEAD, MANAGER           | Remove team member     |
| POST   | /:projectId/assign-manager  | PROJECT_HEAD            | Assign project manager |

### Tasks (`/api/v1/projects/:projectId/tasks`)

| Method | Endpoint             | Permission Required     | Description      |
| ------ | -------------------- | ----------------------- | ---------------- |
| GET    | /                    | Project member          | Get all tasks    |
| GET    | /:taskId             | Project member          | Get task details |
| POST   | /                    | HEAD, MANAGER           | Create task      |
| PUT    | /:taskId             | HEAD, MANAGER, Assignee | Update task      |
| DELETE | /:taskId             | HEAD, MANAGER           | Delete task      |
| POST   | /:taskId/subtasks    | Project member          | Create subtask   |
| PUT    | /subtasks/:subTaskId | Subtask creator         | Update subtask   |
| DELETE | /subtasks/:subTaskId | HEAD, MANAGER           | Delete subtask   |

---

## Database Schema

### Core Entities

```
┌─────────────┐     creates      ┌─────────────┐
│    User     │ ────────────────▶│   Project   │
│  (system    │                  │             │
│   role)     │                  └─────────────┘
└─────────────┘                         │
       │                                │ has
       │ member of (project role)       ▼
       ▼                          ┌─────────────┐
┌─────────────┐                   │    Task     │
│ProjectMember│◀──────────────────│             │
│ (HEAD/MGR/  │                   └─────────────┘
│  MEMBER)    │                         │
└─────────────┘                         │ has
                                        ▼
                                  ┌─────────────┐
                                  │   SubTask   │
                                  └─────────────┘
```

### User Model Fields

| Field           | Type    | Description                    |
| --------------- | ------- | ------------------------------ |
| id              | ULID    | Primary key                    |
| email           | String  | Unique email address           |
| password        | String  | Hashed password                |
| fullName        | String  | Display name                   |
| role            | Enum    | SUPER_ADMIN/ADMIN/MANAGER/USER |
| isEmailVerified | Boolean | Email verification status      |
| isActive        | Boolean | Account active status          |
| createdById     | String  | Who created this user          |
| avatar          | String  | Profile picture URL            |
| refreshToken    | String  | Current refresh token          |

---

## Getting Started

After understanding the architecture, see:

- **[SETUP.md](./SETUP.md)** - For development environment setup
- **[README.md](../README.md)** - For quick start and API examples

### Default Seeded Users

Run `npm run seed` to create initial users:

| Email                  | Password   | System Role | Notes                              |
| ---------------------- | ---------- | ----------- | ---------------------------------- |
| superadmin@example.com | `password` | SUPER_ADMIN | Has full system access             |
| admin@example.com      | `password` | ADMIN       | Can create projects, managers      |
| manager@example.com    | `password` | MANAGER     | Can be PROJECT_MANAGER in projects |
| user@example.com       | `password` | USER        | Can be TEAM_MEMBER in projects     |

### Seeded Project Structure

The seed also creates sample projects with this structure:

```
Project: "Website Redesign" (and others)
├── PROJECT_HEAD: admin@example.com (ADMIN)
├── PROJECT_MANAGER: manager@example.com (MANAGER)
└── TEAM_MEMBER: user@example.com (USER)
```

This demonstrates the complete role hierarchy in action!
