# ---------- Builder ----------
FROM node:20-slim AS builder
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies (including dev) for building
RUN npm ci
# Copy source code
COPY . .
# Build for production (standalone output)
RUN npm run build

# ---------- Runtime ----------
FROM node:20-slim
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install production dependencies only
RUN npm ci --omit=dev
# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder /app/public ./public
# Create non-root user
RUN addgroup --system app && adduser --system --ingroup app app
USER app
# Expose port
EXPOSE 3000
# Start the app
CMD ["node", "server.js"]
