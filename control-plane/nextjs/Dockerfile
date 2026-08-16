# Build context: this directory (control-plane/nextjs/).
#
# Unlike the church UI, this one is single-tenant, so baking the API base is
# safe. "/api" keeps it same-origin behind the ingress.

FROM node:20-slim AS builder
WORKDIR /app
ARG NEXT_PUBLIC_CONTROL_API=/api
ENV NEXT_PUBLIC_CONTROL_API=$NEXT_PUBLIC_CONTROL_API
COPY package*.json ./
# ponytail: see the note in nextjs/Dockerfile — same @testing-library/react
# peer conflict, same deferred fix.
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3200
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN addgroup --system app && adduser --system --ingroup app app
USER app
EXPOSE 3200
CMD ["node", "server.js"]
