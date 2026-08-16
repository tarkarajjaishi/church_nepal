#!/usr/bin/env bash
# ChurchNepal -> single-node k3s. Run from the repository root:
#
#   export CLOUDFLARE_API_TOKEN=...        # Zone:DNS:Edit on churchnepal.com
#   sudo -E ./k8s/setup.sh
#
# Safe to re-run: it never regenerates existing secrets (doing so would change
# POSTGRES_PASSWORD out from under a database that already has data) and never
# touches anything outside the `churchnepal` namespace.
#
# It WILL take ports 80 and 443 when k3s installs Traefik. Anything already
# serving on them stops working. `/usr/local/bin/k3s-uninstall.sh` reverses it.
set -euo pipefail

DOMAIN="${DOMAIN:-churchnepal.com}"
ACME_EMAIL="${ACME_EMAIL:-owner@${DOMAIN}}"
CERT_MANAGER_VERSION="${CERT_MANAGER_VERSION:-v1.16.2}"
NS=churchnepal
SECRET_FILE=/root/churchnepal-credentials.txt

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run with sudo"
[ -f k8s/churchnepal.yaml ] || die "run this from the repository root"
command -v docker >/dev/null || die "docker is required to build the images"

# ---------------------------------------------------------------- preflight
say "Ports 80/443 before we start"
ss -tlnp '( sport = :80 or sport = :443 )' || true
if [ -z "${ASSUME_YES:-}" ]; then
  echo
  echo "k3s installs Traefik, which binds 80 and 443. Any service listed above"
  echo "loses them. Continue?  [type: yes]"
  read -r reply
  [ "$reply" = "yes" ] || die "aborted"
fi

# ---------------------------------------------------------------- k3s
if command -v k3s >/dev/null; then
  say "k3s already installed, skipping"
else
  say "Installing k3s"
  curl -sfL https://get.k3s.io | sh -
fi
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl() { k3s kubectl "$@"; }

say "Waiting for the node to be Ready"
for i in $(seq 1 60); do
  kubectl get nodes 2>/dev/null | grep -q ' Ready ' && break
  sleep 2
done
kubectl get nodes | grep -q ' Ready ' || die "node never became Ready"

# ---------------------------------------------------------------- images
say "Building images (first run compiles Rust from scratch — expect 10-20 min)"
docker build -t churchnepal/church-api:dev   -f backend/Dockerfile               backend
docker build -t churchnepal/church-ui:dev    -f nextjs/Dockerfile                nextjs
docker build -t churchnepal/control-ui:dev   -f control-plane/nextjs/Dockerfile  control-plane/nextjs
# Context is the repo root: provisioning replays backend/migrations, which lives
# outside the control plane's own directory.
docker build -t churchnepal/control-api:dev  -f control-plane/backend/Dockerfile .

say "Importing images into k3s containerd"
for i in church-api church-ui control-api control-ui; do
  docker save "churchnepal/$i:dev" | k3s ctr images import -
done

# ---------------------------------------------------------------- secrets
kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -

if kubectl -n "$NS" get secret churchnepal-secrets >/dev/null 2>&1; then
  say "Secrets already exist — keeping them (regenerating would orphan the database)"
else
  say "Generating secrets"
  SUPER_PW="$(openssl rand -base64 24)"
  kubectl -n "$NS" create secret generic churchnepal-secrets \
    --from-literal=POSTGRES_PASSWORD="$(openssl rand -base64 36)" \
    --from-literal=JWT_SECRET="$(openssl rand -base64 36)" \
    --from-literal=INTERNAL_API_SECRET="$(openssl rand -base64 36)" \
    --from-literal=SUPER_ADMIN_EMAIL="owner@${DOMAIN}" \
    --from-literal=SUPER_ADMIN_PASSWORD="$SUPER_PW"
  umask 077
  cat > "$SECRET_FILE" <<EOF
ChurchNepal control plane
  URL:      https://${DOMAIN}/admin/login
  email:    owner@${DOMAIN}
  password: ${SUPER_PW}
EOF
  say "Console password written to $SECRET_FILE (mode 600)"
fi

# ---------------------------------------------------------------- app
say "Applying application manifests"
kubectl apply -f k8s/churchnepal.yaml

# ---------------------------------------------------------------- tls
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  if kubectl get crd certificates.cert-manager.io >/dev/null 2>&1; then
    say "cert-manager already installed, skipping"
  else
    say "Installing cert-manager $CERT_MANAGER_VERSION"
    kubectl apply -f "https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.yaml"
    kubectl -n cert-manager rollout status deploy/cert-manager-webhook --timeout=180s
  fi

  kubectl -n cert-manager create secret generic cloudflare-api-token \
    --from-literal=api-token="$CLOUDFLARE_API_TOKEN" \
    --dry-run=client -o yaml | kubectl apply -f -

  say "Requesting the wildcard certificate (DNS-01, usually 1-3 min)"
  sed "s/owner@churchnepal.com/${ACME_EMAIL}/" k8s/tls.yaml | kubectl apply -f -
else
  say "CLOUDFLARE_API_TOKEN not set — skipping TLS."
  echo "The site will answer on HTTP only. To finish TLS later:"
  echo "  export CLOUDFLARE_API_TOKEN=...   && sudo -E ./k8s/setup.sh"
fi

# ---------------------------------------------------------------- wait
say "Waiting for pods"
kubectl -n "$NS" wait --for=condition=available --timeout=300s deploy --all || true

say "Status"
kubectl -n "$NS" get pods,svc,ingress
if kubectl -n "$NS" get certificate churchnepal-tls >/dev/null 2>&1; then
  echo
  kubectl -n "$NS" get certificate churchnepal-tls
fi

cat <<EOF

$(cat "$SECRET_FILE" 2>/dev/null || echo "(credentials file already existed; see $SECRET_FILE)")

Point Cloudflare at this host, all DNS-only (grey cloud):
    A   *      -> this server's IP
    A   @      -> this server's IP
    A   www    -> this server's IP
    A   admin  -> this server's IP

Then:
    https://${DOMAIN}                       control plane + marketing site
    https://<church-slug>.${DOMAIN}         a church site

Logs:      k3s kubectl -n $NS logs -l app=control-api -f
Rollback:  /usr/local/bin/k3s-uninstall.sh
EOF
