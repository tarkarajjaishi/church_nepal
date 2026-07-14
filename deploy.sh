#!/bin/bash
# Grace Nepal Church — VPS Deployment Script
# Run this in the VPS console as root

set -e

echo "=== Grace Nepal Church Deployment ==="
echo "Starting at $(date)"

# 1. System updates
echo "[1/8] Updating system..."
apt update -y && apt upgrade -y

# 2. Install Node.js 20
echo "[2/8] Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Install Bun
echo "[3/8] Installing Bun..."
curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$PATH"

# 4. Install Rust
echo "[4/8] Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# 5. Install PostgreSQL
echo "[5/8] Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# 6. Setup database
echo "[6/8] Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE grace_church;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'church_db_pass_2026';" 2>/dev/null || true

# 7. Clone and build
echo "[7/8] Cloning repository..."
cd /opt
git clone https://github.com/tarkarajjaishi/church_nepal.git church-nepal 2>/dev/null || (cd church-nepal && git pull)

echo "Building backend..."
cd /opt/church-nepal/backend
export DATABASE_URL="postgres://postgres:church_db_pass_2026@localhost:5432/grace_church"
cargo build --release

echo "Running migrations..."
for migration in migrations/*.sql; do
    echo "  Running $migration..."
    sudo -u postgres psql -d grace_church -f "$migration" 2>/dev/null || true
done

echo "Building frontend..."
cd /opt/church-nepal/nextjs
bun install
bun run build

# 8. Setup systemd services
echo "[8/8] Setting up services..."

# Backend service
cat > /etc/systemd/system/grace-church-backend.service << 'EOF'
[Unit]
Description=Grace Church Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/church-nepal/backend
Environment=DATABASE_URL=postgres://postgres:church_db_pass_2026@localhost:5432/grace_church
Environment=JWT_SECRET=grace_church_jwt_secret_2026
Environment=PORT=3002
ExecStart=/opt/church-nepal/backend/target/release/grace-church-backend
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (using next start)
cat > /etc/systemd/system/grace-church-frontend.service << 'EOF'
[Unit]
Description=Grace Church Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/church-nepal/nextjs
ExecStart=/root/.bun/bin/bun run start
Restart=always
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF

# Nginx reverse proxy
apt install -y nginx
cat > /etc/nginx/sites-available/grace-church << 'EOF'
server {
    listen 80;
    server_name _;

    # Static assets from Next.js build - serve directly
    location /_next/static/ {
        alias /opt/churchnepal/nextjs/.next/static/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 10M;
    }

    # Uploaded files
    location /api/uploads/ {
        proxy_pass http://127.0.0.1:3002/api/uploads/;
    }
}
EOF

ln -sf /etc/nginx/sites-available/grace-church /etc/nginx/sites-enabled/grace-church
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx
systemctl enable nginx

# Start services
systemctl daemon-reload
systemctl start grace-church-backend
systemctl start grace-church-frontend
systemctl enable grace-church-backend
systemctl enable grace-church-frontend

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo "Frontend: http://YOUR_SERVER_IP"
echo "Backend API: http://YOUR_SERVER_IP/api"
echo "Admin Panel: http://YOUR_SERVER_IP/admin/login"
echo "Admin Credentials: admin@gracenepal.org / admin123"
echo ""
echo "To check status:"
echo "  systemctl status grace-church-backend"
echo "  systemctl status grace-church-frontend"
echo "  systemctl status nginx"
