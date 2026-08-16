# Build context: this directory (control-plane/nextjs/).
#
# Unlike the church UI, this one is single-tenant, so baking the API base is
# safe. "/api" keeps it same-origin behind the ingress.

FROM node:20-slim AS builder
WORKDIR /app
ARG NEXT_PUBLIC_CONTROL_API=/api
ENV NEXT_PUBLIC_CONTROL_API=$NEXT_PUBLIC_CONTROL_API
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3200
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# Same EACCES trap as the church UI — see nextjs/Dockerfile.
RUN mkdir -p /app/.next/cache && chown -R app:app /app/.next
USER app
EXPOSE 3200
CMD ["node", "server.js"]
