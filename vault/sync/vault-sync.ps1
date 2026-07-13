# Vault Auto-Sync Script
# Automatically commits and pushes vault changes to git

$projectRoot = "C:\churchnepal.com\FullProductionSetup-main"
$vaultDir = "$projectRoot\vault"

# Change to project root
Set-Location $projectRoot

# Check if there are vault changes
$vaultChanges = git status --porcelain | Where-Object { $_ -match "^.*vault/" }

if ($vaultChanges) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    
    # Stage vault changes
    git add vault/
    
    # Count changes
    $changeCount = ($vaultChanges | Measure-Object).Count
    
    # Commit with descriptive message
    git commit -m "vault: auto-sync $changeCount file(s) - $timestamp"
    
    # Push to remote
    git push
    
    Write-Host "[$timestamp] Vault synced: $changeCount file(s) pushed"
} else {
    # Uncomment below for verbose output
    # Write-Host "[$(Get-Date -Format 'HH:mm:ss')] No vault changes"
}
