# Vault Sync Script

This file describes the auto-sync process.

## What Gets Synced

1. **Project MEMORY.md** → Vault files
2. **Session checkpoints** → Daily logs
3. **Task progress** → TODO.md
4. **Architecture decisions** → Architecture docs

## Sync Process

At the end of each session (or on-demand):
1. Read project MEMORY.md
2. Update relevant vault files
3. Log sync in SYNC-LOG.md
4. Update daily log with session work

## Manual Sync

To sync manually, ask: "Sync the vault"

## Auto Sync

A loop runs every 30 minutes to check for changes and sync if needed.
