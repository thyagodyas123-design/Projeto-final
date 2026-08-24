FROM node:22-alpine

RUN apk add --no-cache sqlite

WORKDIR /workspace
COPY . .

CMD ["node", "apps/gateway/src/health.mjs"]
