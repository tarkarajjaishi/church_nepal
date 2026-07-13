# TODO & Roadmap

## Current Phase: PRODUCTION READY

### Completed Features
- [x] Frontend - All 18 pages + shared components
- [x] Backend - Full REST API (13 handlers including users)
- [x] Database - PostgreSQL with seed data (13 tables)
- [x] Frontend API wiring with React Query
- [x] Detail pages (Sermons, Events, Ministries, Privacy, Terms)
- [x] Admin panel - Full CRUD for all 12 entities
- [x] Admin authentication - JWT login/logout
- [x] Admin protected routes
- [x] User management (CRUD)
- [x] Enhanced Dashboard with stats, quick actions, content panels
- [x] Main site embedded in admin panel at /
- [x] Admin panel at /admin prefix
- [x] CORS fix (host: true in vite.config.ts)
- [x] Git repo pushed to GitHub

### Backlog (Future Enhancements)
- [ ] Image upload component
- [ ] Bilingual support (EN/NE) in admin
- [ ] Search and filtering in admin
- [ ] Error handling improvements
- [ ] Responsive design for mobile
- [ ] Move hardcoded contact info to settings API
- [ ] Rate limiting
- [ ] Email notifications

## Services Running
| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | Running |
| Backend API | 3002 | Running |
| Admin Panel | 5174 | Running |

## Related
- [[01 - Project/ADMIN-PANEL|Admin Panel Details]]
- [[01 - Project/README|Project Overview]]
