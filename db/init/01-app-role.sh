#!/bin/sh
# Runs once at Postgres volume init. Creates the non-superuser runtime role —
# superusers bypass RLS, so the app must NOT connect as `postgres`.
set -eu

: "${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 -U postgres -d "${POSTGRES_DB:-postgres}" <<SQL
CREATE ROLE app_runtime
  LOGIN PASSWORD '${APP_DB_PASSWORD}'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

GRANT CONNECT ON DATABASE "${POSTGRES_DB:-postgres}" TO app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;

-- Tables created later by migrations (as postgres) stay readable/writable.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
SQL
