# Issue Tracker — Backend

REST API built with **Express.js** and **MySQL**.

## Prerequisites

- Node.js >= 18
- MySQL >= 8.0

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials and JWT secret
   ```

3. **Create MySQL database**
   ```sql
   CREATE DATABASE issue_tracker;
   ```
   > Tables are created automatically on first run.

4. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

Server runs at `http://localhost:5000`

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user (auth required) |

### Issues (all require `Authorization: Bearer <token>`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/issues` | List issues (supports search, filter, pagination) |
| GET | `/api/issues/stats` | Get status counts |
| GET | `/api/issues/export?format=csv` | Export issues (csv or json) |
| POST | `/api/issues` | Create an issue |
| GET | `/api/issues/:id` | Get issue by ID |
| PUT | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue |

### Query Parameters for `GET /api/issues`
- `page` — page number (default: 1)
- `limit` — items per page (default: 10)
- `search` — search by title or description
- `status` — filter by status (Open, In Progress, Resolved, Closed)
- `priority` — filter by priority (Low, Medium, High, Critical)
- `severity` — filter by severity (Minor, Major, Critical, Blocker)
- `sort` — sort field (created_at, title, priority, status)
- `order` — ASC or DESC

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT expiry (default: 7d) |
| `FRONTEND_URL` | Allowed CORS origin |
