# Multi-tenant church platform — setup

One master control site provisions many church sites. Each church gets its own
**subdomain**, its own **Postgres database**, and its own **storage folder** —
all named identically by the church slug (e.g. `gracechurchkathmandu`).

```
churchnepal.com                     → Master Control (create/manage churches)
gracechurchkathmandu.churchnepal.com → a church site (its own DB + storage)
hillsidechurch.churchnepal.com       → another church site (its own DB + storage)
```

## Pieces & ports

| Component            | Path                    | Dev port | Stack        |
|----------------------|-------------------------|----------|--------------|
| Master control API   | `control-plane/backend` | 3100     | Rust / Axum  |
| Master control UI    | `control-plane/nextjs`  | 3200     | Next.js      |
| Church app API       | `backend`               | 3002     | Rust / Axum  |
| Church app UI        | `nextjs`                | 3000     | Next.js      |
| PostgreSQL           | Docker (`gc-pg`)        | 5432     | one instance |

The church app is **one process that serves every church**, routing each request
to the right database by the request's subdomain (see `backend/src/tenant.rs`).

## Run locally

1. **Postgres** (one instance, holds every church DB):
   ```
   docker start gc-pg    # user postgres / password `password` / port 5432
   ```

2. **Master control API** (auto-creates its control DB + a super-admin on first run):
   ```
   cd control-plane/backend
   cp .env.example .env          # then edit SUPER_ADMIN_PASSWORD
   cargo run                     # http://localhost:3100
   ```

3. **Master control UI**:
   ```
   cd control-plane/nextjs
   npm install
   npm run dev                   # http://localhost:3200
   ```
   Sign in with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`, type a church name,
   click **Create church** → you get the subdomain + one-time admin login.

4. **Church app** (serves all churches):
   ```
   cd backend && cargo run       # http://localhost:3002  (multi-tenant)
   cd nextjs && npm run dev       # http://localhost:3000
   ```

### Testing a church locally (no DNS needed)
Browsers resolve `*.localhost` to 127.0.0.1, and the router also accepts it:
```
curl -H "Host: gracechurchkathmandu.churchnepal.com" http://localhost:3002/api/content-blocks
# or open in a browser:
http://gracechurchkathmandu.localhost:3000
```
With **no** subdomain, `localhost:3002` falls back to `DEFAULT_TENANT` (dev DB).

## How provisioning works (`control-plane/backend/src/provision.rs`)
Name → slug → `CREATE DATABASE <slug>` → run `backend/migrations/*.sql` into it →
`mkdir storage/<slug>/` → generate an admin user + random password (bcrypt) →
insert it into the new church DB → record the church in the control DB.
The password is returned **once** and never stored in plaintext.

## Production hosting
1. **DNS:** point `churchnepal.com` and a wildcard `*.churchnepal.com` at your server.
2. **Reverse proxy:** use the included `Caddyfile` (routes apex → control, `*` → church
   app, preserving the Host header). Wildcard HTTPS needs a DNS-challenge cert —
   add your registrar's DNS provider block, e.g.:
   ```
   *.churchnepal.com {
       tls { dns cloudflare {env.CF_API_TOKEN} }
       ...
   }
   ```
3. **Frontends:** build each Next.js app and set `NEXT_PUBLIC_API_URL` to same-origin
   (`/api`) so the tenant Host header reaches the backend.
4. **Env:** set strong `JWT_SECRET`, `SUPER_ADMIN_PASSWORD`, and a Postgres user with
   `CREATEDB` for `PG_SUPER_URL`.

## Deleting a church
The master UI's **Delete** drops the church's database and removes its storage
folder. Irreversible — back up first (`pg_dump <slug>`).
