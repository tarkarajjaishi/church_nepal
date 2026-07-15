FROM rust:latest AS builder

WORKDIR /build

# Copy manifests
COPY Cargo.* ./

# Copy source tree
COPY src ./src

# Build for release
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/target/release/grace-church-backend /usr/local/bin/

EXPOSE 3002

CMD ["grace-church-backend"]
