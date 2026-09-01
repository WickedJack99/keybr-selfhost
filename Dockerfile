FROM node:24-bookworm-slim AS build

# Lage uses Git to fingerprint workspace files while compiling. Coolify's
# Docker context intentionally excludes the source repository's .git folder,
# so provide a temporary build-only snapshot instead of depending on it.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /usr/src/app

COPY . .

RUN git init --quiet \
    && git config user.email "docker-build@localhost" \
    && git config user.name "Docker build" \
    && git add --all \
    && git commit --quiet --message "Docker build snapshot" \
    && HUSKY=0 npm ci \
    && npm run compile \
    && npm run build \
    && rm -rf .git

FROM node:24-bookworm-slim

WORKDIR /usr/src/app

COPY --from=build /usr/src/app ./

ENV NODE_ENV=production \
    DATA_DIR=/data \
    DATABASE_CLIENT=sqlite \
    DATABASE_FILENAME=/data/database.sqlite \
    PRIVATE_MODE=true \
    SOURCE_CODE_URL=https://github.com/aradzie/keybr.com \
    SERVER_PORT=3000 \
    SERVER_PORT_WS=3001

RUN mkdir -p /data && chown node:node /data

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["npm", "run", "start-docker"]
