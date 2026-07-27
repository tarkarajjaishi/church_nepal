# ====== Chef: Plan dependencies ======
FROM rust:latest AS chef
RUN cargo install cargo-chef
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN cargo chef prepare --recipe-path recipe.json

# ====== Chef: Cook dependencies ======
FROM chef AS chef
COPY src ./src
COPY migrations ./migrations
RUN cargo chef cook --release --recipe-path recipe.json

# ====== Builder: Build application ======
FROM chef AS builder
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release --recipe-path recipe.json

# ====== Runtime: Minimal image ======
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*
# Create non-root user
RUN addgroup --system app && adduser --system --ingroup app app
USER app
COPY --from=builder /app/target/release/grace-church-backend /usr/local/bin/
EXPOSE 3002
CMD ["grace-church-backend"]
