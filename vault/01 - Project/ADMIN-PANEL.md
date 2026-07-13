# Admin Panel Status

**Location**: `C:\churchnepal.com\FullProductionSetup-main\admin`
**Port**: 5174 (separate Vite project)

## Routing Structure

| URL | What it shows |
|-----|--------------|
| `/` | Landing page with "Visit Website" (→ :5173) and "Admin Panel" (→ /admin) |
| `/admin/login` | Admin login page |
| `/admin/dashboard` | Dashboard (after login) |
| `/admin/*` | All CRUD pages (sermons, events, ministries, etc.) |

## Current State - COMPLETED

### Pages Built
| Page | Status | Route |
|------|--------|-------|
| Landing Page | ✅ Done | `/` |
| Login | ✅ Done | `/admin/login` |
| Dashboard | ✅ Done | `/admin/dashboard` |
| User Management | ✅ Done | `/admin/users` |
| CrudPage | ✅ Done | Reusable for all 12 entities |
| Layout (Sidebar) | ✅ Done | With section dividers |

### All CRUD Routes
- `/admin/sermons` - Sermons management
- `/admin/events` - Events management
- `/admin/ministries` - Ministries management
- `/admin/leaders` - Leaders management
- `/admin/gallery` - Gallery management
- `/admin/testimonies` - Testimonies management
- `/admin/notices` - Notices management
- `/admin/members` - Members management
- `/admin/service-times` - Service Times management
- `/admin/verses` - Verses management
- `/admin/campaigns` - Campaigns management
- `/admin/settings` - Settings management

## Architecture

```
admin/src/
├── main.tsx          # Entry point with all routes
├── pages/
│   ├── Login.tsx     # Authentication
│   ├── Dashboard.tsx # Stats overview + quick actions
│   └── CrudPage.tsx  # Reusable CRUD component
├── pages/
│   └── UserManagement.tsx  # User CRUD
├── components/
│   └── Layout.tsx    # Sidebar + outlet layout
└── lib/
    ├── api.ts        # Axios client (port 3002)
    └── auth.tsx      # JWT auth context
```

## Credentials

**Email**: admin@gracenepal.org
**Password**: admin123

## Services

| Service | Port |
|---------|------|
| PostgreSQL | 5432 |
| Backend API | 3002 |
| Main Website | 5173 |
| Admin Panel | 5174 |

## Related
- [[02 - Architecture/Backend|Backend API]]
- [[01 - Project/TODO|TODO]]
