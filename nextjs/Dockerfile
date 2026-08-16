# Build context: this directory (nextjs/).
#
# Deliberately does NOT set NEXT_PUBLIC_API_URL. NEXT_PUBLIC_* values are
# inlined into the client bundle at build time, so baking a fixed API host here
# would send every church's browser to the same Host header — which the backend
# reads as the tenant. Left unset, the browser calls the API same-origin at
# /api and the ingress routes it with the tenant's own hostname intact.

FROM node:20-slim AS builder
WORKDIR /app
# .npmrc carries legacy-peer-deps — see it for why. Copied alongside the
# manifests so the install layer behaves identically here, in CI and locally.
COPY package*.json .npmrc ./
RUN npm ci
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
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# The image optimiser writes here at runtime. Copied as root and run as `app`,
# it threw EACCES on every remote image and re-encoded them on each request
# instead of caching — the errors are only visible in the pod log.
RUN mkdir -p /app/.next/cache && chown -R app:app /app/.next
USER app
EXPOSE 3000
CMD ["node", "server.js"]
