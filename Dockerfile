FROM node:22-alpine

RUN apk add --no-cache sqlite

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/storefront/package.json apps/storefront/
COPY apps/classroom/package.json apps/classroom/
COPY apps/auth/package.json apps/auth/
COPY apps/admin/package.json apps/admin/
COPY apps/catalog/package.json apps/catalog/
COPY apps/progress/package.json apps/progress/
COPY apps/files/package.json apps/files/
COPY apps/gateway/package.json apps/gateway/
COPY packages/ packages/

RUN pnpm install --frozen-lockfile

COPY . .

# Multi-zone: o rewrite do Next é resolvido em build-time e gravado no
# routes-manifest. O host do classroom precisa ser definido ANTES do build.
ENV CLASSROOM_HOST=classroom

RUN pnpm run build

CMD ["node", "apps/gateway/src/health.mjs"]
