# Troubleshooting Log

## Port 3001 Conflict with NepseTrading

**Symptom**: Backend fails to start or responds from wrong process.

**Cause**: Another project (nepsetrading, PID 21608) occupies port 3001 on 0.0.0.0.

**Solution**: Changed backend to use port 3002. Updated in `backend/.env`:
```
PORT=3002
```

**Note**: Admin panel API client already points to `http://localhost:3002/api`.

## Vite Plugin Version Conflict

**Symptom**: `@vitejs/plugin-react` errors.

**Cause**: `@vitejs/plugin-react@6.0.3` requires Vite 7+. When Vite resolves to 6.3.5, incompatible.

**Solution**: Use `@vitejs/plugin-react@4.7.0` instead.

## pnpm Workspace No-Op

**Symptom**: `pnpm install` in admin/ doesn't install dependencies.

**Cause**: `admin` wasn't in `pnpm-workspace.yaml` packages list. Dependencies hoisted to root causing version conflicts.

**Solution**: Add `admin` to packages:
```yaml
packages:
  - "."
  - "admin"
```

## Native Binary Hang

**Symptom**: `pnpm install` hangs on esbuild or @tailwindcss/oxide.

**Cause**: Postinstall scripts hang in PowerShell.

**Solution**: Run install scripts manually (see [[03 - Knowledge/Windows-Gotchas|Windows Gotchas]]).

## Related
- [[03 - Knowledge/Windows-Gotchas|Windows Gotchas]]

## Admin Panel Credentials

**Email**: admin@gracenepal.org
**Password**: admin123

**Note**: Stored in PostgreSQL `users` table with bcrypt hashed password.

## lucide-react Bible Icon Not Found

**Symptom**: Blank white screen or build error `"Bible" is not exported by lucide-react`.

**Cause**: `Bible` icon doesn't exist in lucide-react 0.487.0.

**Solution**: Use `BookMarked` instead:
```tsx
// BAD
import { Bible } from 'lucide-react'

// GOOD
import { BookMarked } from 'lucide-react'
```
