# Build context: this directory (backend/).
#
# The previous version could not build: it redefined stage `chef` as itself,
# and passed `--recipe-path` to `cargo build`, which is a cargo-chef flag.

FROM rust:1-bookworm AS chef
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
# Dependencies cook first and cache independently of source changes.
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release --bin grace-church-backend

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*
# Explicit uid/gid so the manifest can set fsGroup to match — this user has to
# write into the shared uploads volume. See control-plane/backend/Dockerfile.
RUN addgroup --system --gid 10001 app && adduser --system --uid 10001 --ingroup app app
WORKDIR /app
COPY --from=builder /app/target/release/grace-church-backend /usr/local/bin/
# Needed at runtime when DB_MIGRATE_ON_STARTUP=true.
COPY --from=builder /app/migrations /app/migrations
USER app
EXPOSE 3002
CMD ["grace-church-backend"]
