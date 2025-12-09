#!/bin/sh
set -e

echo "Generating Prisma Client..."
npx prisma generate

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

# Seed only in development
if [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Environment is development. Running seed..."
  if npm run seed; then
    echo "Seed completed successfully!"
  else
    echo "Seed failed! Check logs above."
    # We don't exit here to allow the app to start even if seed fails, 
    # but in some strict cases you might want `exit 1`
  fi
else
  echo "🚀 Environment is production. Skipping seed."
fi

echo "Starting application..."
exec "$@"
