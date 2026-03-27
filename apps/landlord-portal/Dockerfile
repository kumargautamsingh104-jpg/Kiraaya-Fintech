# Use Node.js 20-alpine for a small footprint
FROM node:20-alpine AS base

# Install dependencies needed for Turbo
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo

# Step 1: Prune monorepo
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @kiraaya/web --docker

# Step 2: Install dependencies
FROM base AS installer
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

# Step 3: Build the project
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/node_modules ./node_modules
RUN turbo build --filter=@kiraaya/web...

# Step 4: Final runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output and static assets
COPY --from=builder --chown=nextjs:nodejs /app/apps/landlord-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/landlord-portal/.next/static ./apps/landlord-portal/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/landlord-portal/public ./apps/landlord-portal/public

USER nextjs

EXPOSE 3000

# Start using the standalone server.js
CMD ["node", "apps/landlord-portal/server.js"]
