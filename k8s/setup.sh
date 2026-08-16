#!/usr/bin/env bash
# ChurchNepal -> k3s. Run from the repository root on the server:
#
#   sudo ./k8s/setup.sh
#
# This reflects how the live deployment on ubuntu-kathmandu-01 was actually
# done, which is NOT the generic "install k3s and let Traefik have :80" recipe:
#
#   * k3s is already installed there with `--disable traefik --disable servicelb`,
#     because the host's nginx already fronts padmacakes.com and nepalidriver.com.
#     So services are NodePort and nginx proxies to 127.0.0.1:<nodePort>.
#   * Docker is NOT installed and the box has 2 cores / ~1.4Gi free, so the
#     images are built elsewhere and imported. Compiling Rust here would risk
#     OOMing the live sites.
#
# Build and ship the images from a machine that has docker:
#
#   docker build -t churchnepal/church-api:dev  -f backend/Dockerfile               backend
#   docker build -t churchnepal/church-ui:dev   -f nextjs/Dockerfile                nextjs
#   docker build -t churchnepal/control-ui:dev  -f control-plane/nextjs/Dockerfile  control-plane/nextjs
#   docker build -t churchnepal/control-api:dev -f control-plane/backend/Dockerfile .   # root context!
#   docker save churchnepal/{church-api,church-ui,control-api,control-ui}:dev -o images.tar
#   scp images.tar ubuntu@<host>:/tmp/churchnepal-images.tar
#
# Safe to re-run: it never regenerates an existing secret, because that would
# leave the database with a password nothing knows.
set -euo pipefail

NS=churchnepal
IMAGES_TAR="${IMAGES_TAR:-/tmp/churchnepal-images.tar}"
SECRET_FILE=/root/churchnepal-credentials.txt

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run with sudo"
[ -f k8s/churchnepal.yaml ] || die "run this from the repository root"
command -v k3s >/dev/null || die "k3s is not installed on this host"

kubectl() { k3s kubectl "$@"; }

# ---------------------------------------------------------------- images
if [ -f "$IMAGES_TAR" ]; then
  say "Importing images from $IMAGES_TAR"
  k3s ctr images import "$IMAGES_TAR"
else
  say "No $IMAGES_TAR — assuming images are already in containerd"
fi
for i in church-api church-ui control-api control-ui; do
  k3s ctr images ls -q | grep -q "churchnepal/$i:dev" \
    || die "image churchnepal/$i:dev missing — build and copy images.tar over first"
done

# ---------------------------------------------------------------- secrets
kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f - >/dev/null

if kubectl -n "$NS" get secret churchnepal-secrets >/dev/null 2>&1; then
  say "Secrets already exist — keeping them"
else
  say "Generating secrets"
  # hex, NOT base64. `openssl rand -base64` emits '/' and '+', and a '/' in the
  # password terminates the userinfo part of postgres://user:pass@host, so the
  # driver reads the rest as host/port and dies with "invalid port number".
  # That took both Rust services down in a crash loop on first deploy.
  PGPW="$(openssl rand -hex 24)"
  SUPER_PW="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)"
  kubectl -n "$NS" create secret generic churchnepal-secrets \
    --from-literal=POSTGRES_PASSWORD="$PGPW" \
    --from-literal=JWT_SECRET="$(openssl rand -hex 32)" \
    --from-literal=INTERNAL_API_SECRET="$(openssl rand -hex 24)" \
    --from-literal=SUPER_ADMIN_EMAIL="owner@churchnepal.com" \
    --from-literal=SUPER_ADMIN_PASSWORD="$SUPER_PW" >/dev/null
  umask 077
  printf 'ChurchNepal control plane\n  URL:      https://churchnepal.com/admin/login\n  email:    owner@churchnepal.com\n  password: %s\n' "$SUPER_PW" > "$SECRET_FILE"
  say "Console password written to $SECRET_FILE (mode 600)"
fi

# ---------------------------------------------------------------- workloads
say "Applying manifests"
kubectl apply -f k8s/churchnepal.yaml

say "Waiting for pods"
kubectl -n "$NS" rollout status deploy/church-api   --timeout=300s || true
kubectl -n "$NS" rollout status deploy/control-api  --timeout=300s || true
kubectl -n "$NS" get pods

# ---------------------------------------------------------------- nginx
say "Installing the nginx site"
cp k8s/nginx-churchnepal.conf /etc/nginx/sites-available/churchnepal
ln -sf /etc/nginx/sites-available/churchnepal /etc/nginx/sites-enabled/churchnepal

# The TLS blocks reference a certificate that may not exist yet; get it first,
# using the HTTP-only form of the config, then reload with TLS.
if [ ! -d /etc/letsencrypt/live/churchnepal ]; then
  say "No certificate yet — obtaining one over HTTP-01"
  # Temporarily strip the TLS server blocks so nginx can start on :80 alone.
  sed '/^# ── Platform/,$d' k8s/nginx-churchnepal.conf > /etc/nginx/sites-available/churchnepal
  nginx -t && systemctl reload nginx
  certbot certonly --nginx --non-interactive --agree-tos --cert-name churchnepal \
    -d churchnepal.com -d www.churchnepal.com -d admin.churchnepal.com \
    -d gracechurchkathmandu.churchnepal.com -d hillsidechurchpokhara.churchnepal.com \
    -d newlifechurchdharan.churchnepal.com -d riversidechurchlalitpur.churchnepal.com
  cp k8s/nginx-churchnepal.conf /etc/nginx/sites-available/churchnepal
fi

say "Testing nginx config BEFORE reloading — other sites share this nginx"
nginx -t || die "nginx config invalid; not reloading. Live sites untouched."
systemctl reload nginx

say "Done"
cat "$SECRET_FILE" 2>/dev/null || true
cat <<EOF

  https://churchnepal.com          control plane + marketing site
  https://<slug>.churchnepal.com   a church site

A NEW church needs its subdomain added to the certificate:
  certbot certonly --nginx --cert-name churchnepal --expand -d <slug>.churchnepal.com
or switch to a wildcard (needs a Cloudflare API token):
  apt install python3-certbot-dns-cloudflare
EOF
