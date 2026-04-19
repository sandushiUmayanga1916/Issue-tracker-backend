# Issue Tracker — Backend

REST API built with **Express.js** and **MySQL**.

## Live Demo

- **Backend API:** https://issuetrackerbackend.netlify.app/api
- **Frontend:** https://trackflowissuetracker.netlify.app

## Tech Stack

- **Express.js** — REST API framework
- **MySQL2** — database driver
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT authentication
- **serverless-http** — wraps Express for Netlify Functions

## Local Development

### Prerequisites

- Node.js >= 18
- MySQL >= 8.0

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local MySQL credentials
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

Server runs at `http://localhost:5000`

## Deployment (Netlify + Railway)

### Database — Railway MySQL

1. Go to [railway.app](https://railway.app) → New Project → Deploy MySQL
2. Click MySQL service → **Connect** tab → copy **Public Network** credentials
3. Connect using TablePlus or any MySQL client and run the SQL below

```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
  priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
  severity ENUM('Minor', 'Major', 'Critical', 'Blocker') DEFAULT 'Minor',
  created_by INT NOT NULL,
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);
```

### Backend — Netlify Functions

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site → Import from Git
3. Build settings:
   - Build command: `echo 'Building functions'`
   - Publish directory: `public`
4. Add these environment variables in Netlify dashboard:

```
DB_HOST        = your-public-host.railway.app
DB_PORT        = your-public-port (NOT 3306)
DB_USER        = root
DB_PASSWORD    = your-railway-password
DB_NAME        = railway
JWT_SECRET     = your-random-secret-key
JWT_EXPIRES_IN = 7d
FRONTEND_URL   = https://your-frontend.netlify.app
```

5. Deploy — the `netlify.toml` handles all function routing automatically

## API Endpoints

All issue routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |

### Issues
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/issues` | List issues (search, filter, paginate) |
| GET | `/api/issues/stats` | Status counts |
| GET | `/api/issues/export?format=csv` | Export CSV or JSON |
| POST | `/api/issues` | Create issue |
| GET | `/api/issues/:id` | Get issue by ID |
| PUT | `/api/issues/:id` | Update issue |
| DELETE | `/api/issues/:id` | Delete issue |

### Query Parameters for GET /api/issues
| Param | Description |
|-------|-------------|
| `page` | Page number (default: 1) |
| `limit` | Items per page (default: 10) |
| `search` | Search title or description |
| `status` | Open, In Progress, Resolved, Closed |
| `priority` | Low, Medium, High, Critical |
| `severity` | Minor, Major, Critical, Blocker |
| `sort` | created_at, title, priority, status |
| `order` | ASC or DESC |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host (Railway public host) |
| `DB_PORT` | MySQL port (Railway public port) |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT expiry (default: 7d) |
| `FRONTEND_URL` | Allowed CORS origin |

## Project Structure

```
src/
├── config/
│   └── db.js               MySQL pool + table creation
├── middleware/
│   └── auth.js             JWT verification
├── controllers/
│   ├── authController.js
│   └── issuesController.js
├── routes/
│   ├── auth.js
│   └── issues.js
└── app.js                  Express app (no listen)
netlify/
└── functions/
    └── api.js              serverless-http wrapper
netlify.toml                function config + redirects
```