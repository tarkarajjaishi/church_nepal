# Build context: the REPOSITORY ROOT, not this directory.
#
#   docker build -f control-plane/backend/Dockerfile -t churchnepal/control-api:dev .
#
# It has to be the root because provisioning a new church replays the *church*
# migrations (CHURCH_MIGRATIONS_DIR, 71 files under backend/migrations), which
# live outside this directory. Building with this folder as context produces an
# image that starts fine and then fails on the first church created.

FROM rust:1-bookworm AS chef
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY control-plane/backend/Cargo.toml control-plane/backend/Cargo.lock ./
COPY control-plane/backend/src ./src
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY control-plane/backend/Cargo.toml control-plane/backend/Cargo.lock ./
COPY control-plane/backend/src ./src
COPY control-plane/backend/migrations ./migrations
RUN cargo build --release --bin churchnepal-control-plane

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*
# Explicit uid/gid so the manifest can set fsGroup to match. Left implicit, the
# mounted uploads volume stays root-owned, this user cannot mkdir inside it, and
# provisioning fails per church with "Permission denied (os error 13)" while the
# process otherwise looks healthy.
RUN addgroup --system --gid 10001 app && adduser --system --uid 10001 --ingroup app app
WORKDIR /app
COPY --from=builder /app/target/release/churchnepal-control-plane /usr/local/bin/
# Its own migrations, for the control database.
COPY --from=builder /app/migrations /app/migrations
# The church migrations, replayed into each new church's database at provision.
COPY backend/migrations /app/church-migrations
USER app
EXPOSE 3100
CMD ["churchnepal-control-plane"]
