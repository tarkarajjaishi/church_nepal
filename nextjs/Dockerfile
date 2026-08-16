# Build context: this directory (nextjs/).
#
# Deliberately does NOT set NEXT_PUBLIC_API_URL. NEXT_PUBLIC_* values are
# inlined into the client bundle at build time, so baking a fixed API host here
# would send every church's browser to the same Host header — which the backend
# reads as the tenant. Left unset, the browser calls the API same-origin at
# /api and the ingress routes it with the tenant's own hostname intact.

FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# ponytail: --legacy-peer-deps because @testing-library/react@15 pins
# @types/react@^18 and this project is on 19, so npm refuses to resolve. The
# real fix is bumping it to v16 (the first release supporting React 19), which
# needs the vitest suite re-run — deliberately not done as part of a deploy.
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
# Next's standalone server binds this; without it the container listens on
# loopback only and the Service never gets a healthy endpoint.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# The standalone output already contains a pruned node_modules — running
# `npm ci --omit=dev` here (as this file used to) installs a second, conflicting
# tree over the top of it.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN addgroup --system app && adduser --system --ingroup app app
USER app
EXPOSE 3000
CMD ["node", "server.js"]
