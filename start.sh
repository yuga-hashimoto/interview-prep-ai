#!/bin/sh
# Copy dev.db to /tmp so it's writable in Cloud Run
cp /app/dev.db /tmp/dev.db
export DATABASE_URL="file:/tmp/dev.db"

# Execute the main command
exec node server.js
