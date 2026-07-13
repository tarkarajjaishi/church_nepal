# Windows Development Gotchas

## PostgreSQL Process Termination

**Problem**: `pg_ctl start` runs postmaster as child of calling shell. When shell exits, Windows kills all child processes.

**Solution**: Use `Start-Process -WindowStyle Hidden` for detached process.

```powershell
# BAD
pg_ctl start -D "C:\Program Files\PostgreSQL\18\data"

# GOOD
Start-Process -FilePath "pg_ctl" -ArgumentList "start -D `"C:\Program Files\PostgreSQL\18\data`"" -WindowStyle Hidden
```

## Vite Dev Server

**Problem**: PowerShell `Start-Job` doesn't keep the process alive.

**Solution**: Use `Start-Process -FilePath "cmd.exe"` with `-WindowStyle Minimized`.

```powershell
Start-Process -FilePath "cmd.exe" -ArgumentList "/c pnpm dev" -WindowStyle Minimized
```

## Native Binary Install

**Problem**: esbuild and @tailwindcss/oxide postinstall scripts hang in PowerShell.

**Solution**: Run manually:
```bash
node "node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/install.js"
node "node_modules/.pnpm/@tailwindcss+oxide@4.1.12/node_modules/@tailwindcss/oxide/scripts/install.js"
```

## Port Conflicts

**Port 3000**: Occupied by another Node.js project (kidschooler.com). Vite defaults to 5173.

**Port 3001**: May conflict with nepsetrading (PID 21608). Kill conflicting PID first.

## Rust on Windows

**Requirement**: VS Build Tools 2022 with C++ workload.

**Install**:
```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

**Gotcha**: GNU toolchain broken (dlltool "Invalid bfd target"). Use MSVC.

## pnpm Workspace

**Problem**: Original `pnpm-workspace.yaml` only had Linux in `supportedArchitectures`.

**Solution**: Add `win32` and `libc`:
```yaml
supportedArchitectures:
  - win32
  - linux
  - libc:
    - glibc
    - musl
```

## Related
- [[02 - Architecture/Database|Database]]
- [[02 - Architecture/Backend|Backend]]
