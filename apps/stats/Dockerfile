FROM node:21-alpine AS base
FROM base AS builder

RUN apk add --no-cache libc6-compat g++ make py3-pip
RUN apk update

# Set working directory

WORKDIR /app
COPY . .
COPY ./.docker.yarnrc.yml ./.yarnrc.yml
RUN corepack enable
RUN yarn install
RUN yarn dlx turbo prune stats --docker

# Add lockfile and package.json's of isolated subworkspace

FROM base AS installer
RUN apk add --no-cache libc6-compat g++ make py3-pip
RUN apk update
WORKDIR /app

# First install dependencies (as they change less often)

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project and its dependencies

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN yarn turbo run build --filter=stats...

FROM base AS runner
WORKDIR /app

# Don't run production as root

RUN addgroup --system --gid 1001 node-runner
RUN adduser --system --uid 1001 node-runner
USER node-runner
COPY --from=installer /app .
ENV NODE_ENV=production

CMD node apps/stats/dist/index-prod.js
