#!/bin/sh
# Restore a backup by timestamp (e.g. restore.sh 20260711-030000 [db|uploads|all]).
# Pulls artifacts from S3 unless already staged in /backups. STOP app + backend
# before running — see instructions/backup_restore.md.
set -eu

STAMP=${1:?usage: restore.sh <STAMP> [db|uploads|all]}
WHAT=${2:-all}
STAGE=/backups
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${POSTGRES_DB:-postgres}

DB_FILE="db-${STAMP}.dump"
UPLOADS_FILE="uploads-${STAMP}.tar.gz"

fetch() { # fetch <remote-prefix> <file>
  [ -f "$STAGE/$2" ] && return 0
  mc alias set s3 "$BACKUP_S3_ENDPOINT" "$BACKUP_S3_ACCESS_KEY" "$BACKUP_S3_SECRET_KEY" > /dev/null
  mc cp "s3/$BACKUP_S3_BUCKET/$1/$2" "$STAGE/"
}

export PGPASSWORD="$POSTGRES_PASSWORD"

if [ "$WHAT" = db ] || [ "$WHAT" = all ]; then
  fetch db "$DB_FILE"
  echo "[restore] terminating connections to $DB_NAME"
  psql -h "$DB_HOST" -p "$DB_PORT" -U postgres -d "$DB_NAME" -q -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
  echo "[restore] restoring $DB_FILE into $DB_NAME"
  # --clean --if-exists: drop and recreate objects; roles (app_runtime) must
  # already exist — on a fresh volume the db/init scripts create them.
  pg_restore -h "$DB_HOST" -p "$DB_PORT" -U postgres -d "$DB_NAME" --clean --if-exists "$STAGE/$DB_FILE"
  echo "[restore] db done"
fi

if [ "$WHAT" = uploads ] || [ "$WHAT" = all ]; then
  fetch uploads "$UPLOADS_FILE"
  echo "[restore] restoring uploads"
  find /uploads -mindepth 1 -delete
  tar -xzf "$STAGE/$UPLOADS_FILE" -C /uploads
  echo "[restore] uploads done"
fi

echo "[restore] complete — restart backend + app"
