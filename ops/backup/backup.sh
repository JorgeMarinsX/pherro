#!/bin/sh
# Full backup: Postgres (custom-format dump + role globals) + uploads volume,
# staged in /backups then copied to S3 (MinIO). Fails loud if S3 is unreachable
# so orchestration/logs surface it — a backup that never leaves the server is
# not a backup.
set -eu

STAMP=$(date -u +%Y%m%d-%H%M%S)
STAGE=/backups
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${POSTGRES_DB:-postgres}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

DB_FILE="db-${STAMP}.dump"
GLOBALS_FILE="globals-${STAMP}.sql"
UPLOADS_FILE="uploads-${STAMP}.tar.gz"

echo "[backup] ${STAMP} starting"
export PGPASSWORD="$POSTGRES_PASSWORD"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U postgres -d "$DB_NAME" -Fc -Z 6 -f "$STAGE/$DB_FILE"
# Sanity: archive must be listable or the dump is corrupt.
pg_restore --list "$STAGE/$DB_FILE" > /dev/null
pg_dumpall -h "$DB_HOST" -p "$DB_PORT" -U postgres --globals-only > "$STAGE/$GLOBALS_FILE"
tar -czf "$STAGE/$UPLOADS_FILE" -C /uploads .
echo "[backup] staged: $(du -sh "$STAGE/$DB_FILE" "$STAGE/$UPLOADS_FILE" | tr '\n' ' ')"

if [ -z "${BACKUP_S3_ENDPOINT:-}" ]; then
  echo "[backup] ERROR: BACKUP_S3_ENDPOINT unset — dump staged locally only, NOT off-server" >&2
  exit 1
fi

mc alias set s3 "$BACKUP_S3_ENDPOINT" "$BACKUP_S3_ACCESS_KEY" "$BACKUP_S3_SECRET_KEY" > /dev/null
mc mb --ignore-existing "s3/$BACKUP_S3_BUCKET" > /dev/null
mc cp "$STAGE/$DB_FILE" "s3/$BACKUP_S3_BUCKET/db/"
mc cp "$STAGE/$GLOBALS_FILE" "s3/$BACKUP_S3_BUCKET/globals/"
mc cp "$STAGE/$UPLOADS_FILE" "s3/$BACKUP_S3_BUCKET/uploads/"

# Retention: remote prune past RETENTION_DAYS; local stage keeps ~2 days.
mc rm --recursive --force --older-than "${RETENTION_DAYS}d" "s3/$BACKUP_S3_BUCKET/" || true
find "$STAGE" -type f -mtime +1 -delete

echo "[backup] ${STAMP} done"
