FROM rust:latest AS builder

WORKDIR /build

# Copy manifests
COPY Cargo.* ./

# Copy source tree + control-plane migrations (sqlx::migrate! embeds them)
COPY src ./src
COPY migrations ./migrations

# Build for release
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release/churchnepal-control-plane /usr/local/bin/

EXPOSE 3100

CMD ["churchnepal-control-plane"]
