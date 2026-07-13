# Church Nepal Project

**Repository**: `C:\churchnepal.com\FullProductionSetup-main`
**Stack**: React/Vite + Rust/Axum + PostgreSQL
**Package Manager**: pnpm

## Project Structure

```
FullProductionSetup-main/
├── src/                    # Frontend (React)
│   └── app/
│       ├── components/     # Shared UI components
│       ├── lib/            # Hooks, data, utilities
│       └── pages/          # Page components
├── backend/                # Backend (Rust/Axum)
│   ├── src/
│   │   ├── handlers/       # API route handlers
│   │   ├── models/         # Data models
│   │   ├── auth.rs         # JWT authentication
│   │   └── main.rs         # Entry point
│   └── migrations/         # SQL migrations
├── admin/                  # Admin SPA (separate Vite project)
│   └── src/
│       ├── pages/          # Dashboard, Login, CrudPage
│       └── components/     # Admin UI components
└── vault/                  # This knowledge base
```

## Ports
| Service | Port | Notes |
|---------|------|-------|
| Vite Dev | 5173 | Frontend |
| Admin SPA | 5174 | Separate Vite project |
| Backend API | 3001 | Rust/Axum |
| PostgreSQL | 5432 | Database |

## Key Commands

```bash
# Frontend
pnpm dev

# Backend
cd backend && cargo run

# Admin
cd admin && pnpm dev

# Database
pg_ctl start -D "C:\Program Files\PostgreSQL\18\data"
```

## Related
- [[02 - Architecture/Backend|Backend Architecture]]
- [[02 - Architecture/Frontend|Frontend Architecture]]
