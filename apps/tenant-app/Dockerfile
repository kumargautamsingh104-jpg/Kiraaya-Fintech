# Use Node.js 20-alpine for a small footprint
FROM node:20-alpine AS base

# Install dependencies needed for Turbo
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo

# Step 1: Prune monorepo
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @kiraaya/mobile --docker

# Step 2: Install dependencies
FROM base AS installer
WORKDIR /app
COPY .gitignore .gitignore
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/package-lock.json ./package-lock.json
RUN npm install

# Step 3: Build the project for web
FROM base AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
COPY --from=installer /app/node_modules ./node_modules

# Add web support dependencies if missing (Expo needs these for web)
RUN cd apps/tenant-app && npm install react-native-web react-dom @expo/metro-runtime

# Build web distribution
RUN turbo build --filter=@kiraaya/mobile...

# Step 4: Final runner (Serve the static files)
FROM base AS runner
WORKDIR /app

RUN npm install -g serve

# Copy the exported web build (usually in dist or web-build)
# Expo 51+ exports to 'dist' by default
COPY --from=builder /app/apps/tenant-app/dist ./public

EXPOSE 3000

# Start serving the static web app
CMD ["serve", "-s", "public", "-l", "3000"]
