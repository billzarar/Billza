#!/bin/sh
set -e

echo "=== Billza Backend Container Starting ==="

# Wait for PostgreSQL if configured
if [ "$USE_POSTGRES" = "true" ] || [ "$USE_POSTGRES" = "True" ] || [ "$USE_POSTGRES" = "1" ]; then
    echo "Waiting for PostgreSQL database at ${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}..."
    while ! python -c "import socket; s = socket.socket(); s.settimeout(2); s.connect(('${POSTGRES_HOST:-db}', int('${POSTGRES_PORT:-5432}'))); s.close()" 2>/dev/null; do
        sleep 1
    done
    echo "PostgreSQL is ready!"
fi

# Run database migrations and asset collection if enabled
if [ "$RUN_MIGRATIONS" != "false" ] && [ "$RUN_MIGRATIONS" != "0" ]; then
    echo "Applying database migrations..."
    python manage.py migrate --noinput

    # Collect static files
    echo "Collecting static assets..."
    python manage.py collectstatic --noinput || true

    # Seed demo data if requested
    if [ "$SEED_DEMO_DATA" = "true" ] || [ "$SEED_DEMO_DATA" = "True" ] || [ "$SEED_DEMO_DATA" = "1" ]; then
        echo "Seeding demo records..."
        python manage.py seed_demo_data || true
    fi
else
    echo "Skipping migrations and static collection (RUN_MIGRATIONS is set to false)."
fi

echo "=== Initialization Complete. Launching Application ==="
exec "$@"
