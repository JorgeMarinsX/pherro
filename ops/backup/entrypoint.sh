#!/bin/sh
# cron (default): schedule nightly backup.sh via BACKUP_CRON.
# backup / restore: one-off run (docker compose run --rm backup backup).
set -eu

case "${1:-cron}" in
  cron)
    echo "${BACKUP_CRON:-0 3 * * *} /usr/local/bin/backup.sh > /proc/1/fd/1 2>&1" > /etc/crontabs/root
    echo "[entrypoint] crond up, schedule: ${BACKUP_CRON:-0 3 * * *}"
    exec crond -f
    ;;
  backup)
    exec backup.sh
    ;;
  restore)
    shift
    exec restore.sh "$@"
    ;;
  *)
    exec "$@"
    ;;
esac
