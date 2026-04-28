FROM node:20-slim

RUN apt-get update && apt-get install -y \
  python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db ./packages/db
COPY apps/worker ./apps/worker

WORKDIR /app/apps/worker

ENV NODE_ENV=production
ENV AUTH_DIR=/app/auth_sessions

VOLUME ["/app/auth_sessions"]

CMD ["pnpm", "start"]
