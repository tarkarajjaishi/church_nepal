#!/bin/bash
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATUS_DIR="$REPO_ROOT/storage/status"
mkdir -p "$STATUS_DIR"

now() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
ts() { date +"%Y-%m-%d"; }
incident_id() { echo "inc-$(date +%s)-$((RANDOM % 10000))"; }

probe_url() {
    local url="$1"
    local code
    code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    echo "$code"
}

components_file="$STATUS_DIR/components.json"
incidents_file="$STATUS_DIR/incidents.jsonl"
prev_file="$STATUS_DIR/prev_status.txt"

declare -A prev_status
if [ -f "$prev_file" ]; then
    while IFS=$'\t' read -r name status; do
        prev_status["$name"]="$status"
    done < "$prev_file"
fi

declare -a comp_names
declare -a comp_statuses
declare -a incident_entries

to_operational() { echo "operational"; }
to_down() { echo "down"; }
to_degraded() { echo "degraded"; }

record_component() {
    local name="$1"
    local status="$2"
    comp_names+=("$name")
    comp_statuses+=("$status")
    local prev="${prev_status[$name]:-}"
    if [ "$prev" = "operational" ] && [ "$status" != "operational" ]; then
        incident_entries+=("{\"id\":\"$(incident_id)\",\"date\":\"$(ts)\",\"title\":\"$name is $status\",\"resolution\":\"Automated probe detected $name status changed to $status\",\"status\":\"investigating\"}")
    fi
    if [ "$prev" != "operational" ] && [ "$status" = "operational" ]; then
        incident_entries+=("{\"id\":\"$(incident_id)\",\"date\":\"$(ts)\",\"title\":\"$name restored\",\"resolution\":\"Automated probe detected recovery for $name\",\"status\":\"resolved\"}")
    fi
}

control_code=$(probe_url "http://localhost:3100/readyz")
record_component "API" "$( [ "$control_code" = "200" ] && to_operational || to_down )"

frontend_code=$(probe_url "http://localhost:3200/")
record_component "Website / Marketing" "$( [ "$frontend_code" = "200" ] && to_operational || to_down )"

admin_code=$(probe_url "http://localhost:3200/admin")
record_component "Admin Dashboard" "$( [ "$admin_code" = "200" ] && to_operational || to_down )"

church_code=$(probe_url "http://localhost:3002/")
record_component "Church Sites" "$( [ "$church_code" = "200" ] && to_operational || to_down )"

db_code=000
if command -v psql >/dev/null 2>&1; then
    export PGPASSWORD="${POSTGRES_PASSWORD:-password}"
    db_code=$(psql -Atqc "SELECT 1;" "postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-password}@${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-grace_church}" 2>/dev/null || echo "000")
else
    db_code=$(probe_url "http://localhost:3100/readyz")
fi
record_component "Database" "$( { [ "$db_code" = "1" ] || [ "$db_code" = "200" ]; } && to_operational || to_down )"

if [ -d "$REPO_ROOT/storage" ]; then
    record_component "Media / Storage" "operational"
else
    record_component "Media / Storage" "down"
fi

record_component "Email Delivery" "operational"

components_json="["
for i in "${!comp_names[@]}"; do
    if [ "$i" -gt 0 ]; then
        components_json+=","
    fi
    components_json+="{\"name\":\"${comp_names[$i]}\",\"status\":\"${comp_statuses[$i]}\"}"
done
components_json+="]"
echo "$components_json" > "$components_file"

{
    for i in "${!comp_names[@]}"; do
        printf "%s\t%s\n" "${comp_names[$i]}" "${comp_statuses[$i]}"
    done
} > "$prev_file"

if [ "${#incident_entries[@]}" -gt 0 ]; then
    for entry in "${incident_entries[@]}"; do
        echo "$entry" >> "$incidents_file"
    done
fi

echo "[$(now)] health-check completed"
