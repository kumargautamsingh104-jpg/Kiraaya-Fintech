# Use Node.js 20-alpine for a small footprint
FROM node:20-alpine AS base

# Install dependencies needed for Turbo and Prisma
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g turbo

# Step 1: Prune monorepo
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @kiraaya/api --docker

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
# Generate Prisma client
RUN cd packages/db && npx prisma generate
RUN turbo build --filter=@kiraaya/api...

# Step 4: Final runner
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

CMD ["npm", "start"]
