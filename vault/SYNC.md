# Vault Auto-Sync

The vault automatically syncs changes to git every 5 minutes.

## How It Works

1. **Cron job** runs `vault-sync.ps1` every 5 minutes
2. Script checks for changes in `vault/` directory
3. If changes exist, auto-commits with timestamp
4. Pushes to `origin/main`

## Manual Sync

### Option 1: Run the batch file
```
vault-sync.bat
```

### Option 2: Run PowerShell directly
```powershell
powershell -ExecutionPolicy Bypass -File "vault\sync\vault-sync.ps1"
```

### Option 3: Git commands
```bash
git add vault/
git commit -m "vault: manual sync"
git push
```

## Sync Log

The sync script logs activity to the console. Each sync shows:
- Timestamp
- Number of files changed
- Confirmation of push

## Cron Job

**Job ID**: 587a0878
**Schedule**: Every 5 minutes (`*/5 * * * *`)
**Command**: `vault-sync.ps1`

To cancel: Delete the cron job or run `/loops cancel 587a0878`

## What Gets Synced

- `vault/00 - Daily/` - Daily logs
- `vault/01 - Project/` - Project docs
- `vault/02 - Architecture/` - Architecture docs
- `vault/03 - Knowledge/` - Knowledge base
- `vault/04 - Decisions/` - Decision log
- `vault/HOME.md` - Index page
- `vault/templates/` - Templates
- `vault/sync/` - Sync logs
- `vault/.obsidian/` - Obsidian config

## What's Excluded

Nothing in `vault/` is excluded - all vault content is tracked.

## Troubleshooting

### Changes not syncing?
1. Check if cron job is running: `/loops`
2. Run manual sync: `vault-sync.bat`
3. Check git status: `git status`

### Merge conflicts?
The vault is only edited by this session, so conflicts are unlikely. If they occur:
```bash
git pull --rebase origin main
```
