# Database Architecture

**Engine**: PostgreSQL 18
**Connection**: `postgres://postgres:church@localhost:5432/grace_church`

## Tables

| Table | Purpose | Rows |
|-------|---------|------|
| users | Admin users | ~5 |
| sermons | Sermon recordings | ~10 |
| events | Church events | ~10 |
| ministries | Ministry programs | ~8 |
| leaders | Church leaders | ~6 |
| gallery | Photo gallery | ~10 |
| testimonies | Member testimonies | ~8 |
| notices | Announcements | ~5 |
| members | Church members | ~5 |
| service_times | Service schedule | ~4 |
| verses | Bible verses | ~5 |
| campaigns | Giving campaigns | ~4 |
| settings | Site settings | ~10 |

## Seed Data

- `002_seed.sql` - Initial seed
- `003_more_seed.sql` - Expanded seed

## Migrations

Located in `backend/migrations/`

## Connection Pool

SQLx uses 7 connection pools (one per service).

## Gotchas

### Windows Process Termination
```powershell
# BAD: pg_ctl as child of shell - dies when shell exits
pg_ctl start -D "C:\Program Files\PostgreSQL\18\data"

# GOOD: Detached process
Start-Process -FilePath "pg_ctl" -ArgumentList "start -D `"C:\Program Files\PostgreSQL\18\data`"" -WindowStyle Hidden
```

### Data Directory
- Windows: `C:\Program Files\PostgreSQL\18\data`
- Service needs admin to start

## Related
- [[02 - Architecture/Backend|Backend]]
- [[03 - Knowledge/Windows-Gotchas|Windows Gotchas]]
