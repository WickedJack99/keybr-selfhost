FROM node:24-bookworm-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

COPY . .

RUN HUSKY=0 npm ci

RUN npm run compile && npm run build

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
