#!/bin/sh

# Exit on error
set -e

# Run Prisma migrations to ensure DB schema is up to date
echo "Running database migrations..."
# In a standalone build, node_modules are bundled but prisma CLI isn't included in the standalone bundle.
# We need to ensure prisma is available or run it from the root if we copied it.
# However, for an easier approach, the user can run migrations manually or we can include prisma in the final stage.

# Improved approach: Use npx prisma migrate deploy if node_modules/prisma exists
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy --schema=packages/db/schema.prisma
else
  echo "Prisma CLI not found, skipping auto-migration. Ensure DB is migrated manually."
fi

# Start the application
echo "Starting Kiraaya API..."
node server.js
