# Church Nepal Project

**Repository**: https://github.com/tarkarajjaishi/church_nepal.git
**Stack**: React/Vite + Rust/Axum + PostgreSQL
**Package Manager**: pnpm

## Project Structure

```
FullProductionSetup-main/
├── src/                    # Frontend (React)
│   └── app/
│       ├── components/     # Shared UI components (site + figma)
│       ├── lib/            # Hooks, data, utilities, language
│       └── pages/          # 18 page components
├── backend/                # Backend (Rust/Axum)
│   ├── src/
│   │   ├── handlers/       # 13 API handlers (12 entities + auth + users)
│   │   ├── models/         # Data models
│   │   ├── auth.rs         # JWT authentication
│   │   └── main.rs         # Entry point
│   └── migrations/         # SQL migrations (001-004)
├── admin/                  # Admin SPA (embeds main site + admin panel)
│   └── src/
│       ├── main.tsx        # Routes: / = main site, /admin = admin panel
│       ├── pages/          # Dashboard, Login, CrudPage, UserManagement
│       └── components/     # Layout, sidebar navigation
└── vault/                  # Obsidian knowledge base
```

## Ports (Production)

| Service | Port | URL |
|---------|------|-----|
| Admin Panel (main site + admin) | 5174 | http://localhost:5174 |
| Backend API | 3002 | http://localhost:3002/api |
| PostgreSQL | 5432 | localhost:5432 |

## Routing

| URL | What it shows |
|-----|--------------|
| `/` | Full church website (Home, About, Sermons, Events, etc.) |
| `/admin/login` | Admin login page |
| `/admin/dashboard` | Admin dashboard with stats |
| `/admin/*` | CRUD pages for all 12 entities + user management |

## Admin Credentials

- **Email**: admin@gracenepal.org
- **Password**: admin123

## Key Commands

```bash
# Start PostgreSQL
Start-Process -FilePath "pg_ctl" -ArgumentList "start -D `"C:/Program Files/PostgreSQL/18/data`"" -WindowStyle Hidden

# Start Backend
cd backend && cargo run

# Start Admin Panel (serves both main site and admin)
cd admin && pnpm dev
```

## Related
- [[02 - Architecture/Backend|Backend Architecture]]
- [[02 - Architecture/Frontend|Frontend Architecture]]
- [[01 - Project/ADMIN-PANEL|Admin Panel Details]]
