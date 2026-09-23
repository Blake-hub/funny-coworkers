# Frontend image: multi-stage, builder produces Next standalone output inside the container
# Build: docker build -t pmis-frontend:1.0.0 ./frontend
# Note: do not set NEXT_PUBLIC_API_URL during build; let the client use relative /api proxied by Next server rewrites

# ---------- builder ----------
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependency manifests first to leverage layer caching
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build (output: standalone mode)
COPY . .
# Client connects directly to backend port 8080 (already exposed), bypassing Next standalone rewrites limitation
# Pass deploy IP at build time: docker build --build-arg DEPLOY_HOST=10.0.18.81 -t pmis-frontend:1.0.0 ./frontend
ARG DEPLOY_HOST=localhost
ENV NEXT_PUBLIC_API_URL=http://${DEPLOY_HOST}:8080/api
ENV NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false
RUN npm run build

# ---------- runner ----------
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Standalone output ships a trimmed node_modules and server.js
COPY --from=builder /app/.next/standalone ./
# Standalone does not include static assets, copy them separately
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Standalone server listens on port 3000
CMD ["node", "server.js"]
