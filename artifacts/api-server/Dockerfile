# Dockerfile for API server (artifacts/api-server)
# Builds the full workspace, then runs the compiled api-server.
FROM node:20-alpine AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only lockfiles first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Copy workspace package manifests
COPY artifacts/api-server/package.json artifacts/api-server/

# Copy the rest of the repository
COPY . .

# Install dependencies and build the api-server
RUN pnpm install --frozen-lockfile --no-optional
RUN pnpm --filter @workspace/api-server build

FROM node:20-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=base /usr/src/app/ ./

EXPOSE 3001
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
