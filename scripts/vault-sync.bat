@echo off
REM Vault Auto-Sync - Run this to sync vault changes to git
powershell -ExecutionPolicy Bypass -File "%~dp0vault\sync\vault-sync.ps1"
