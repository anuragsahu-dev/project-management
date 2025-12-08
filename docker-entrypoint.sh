#!/bin/sh
set -e

# Generate Prisma client
echo "Generating Prisma Client..."
npx prisma generate

# Run migrations (ensure DB is up to date)
# Using a retry loop to handle DB startup delays
echo "Deploying migrations..."
MAX_RETRIES=30
count=0
until npx prisma migrate deploy; do
  count=$((count + 1))
  if [ $count -ge $MAX_RETRIES ]; then
    echo "Migration failed after $MAX_RETRIES attempts."
    exit 1
  fi
  echo "Migration failed, retrying in 2s (Attempt $count/$MAX_RETRIES)..."
  sleep 2
done

npm run seed

# Exec the main command
echo "Starting application..."
exec "$@"
