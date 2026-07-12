#!/bin/sh
# Disk-usage watchdog: checks the host root fs (mounted at /host, ro) every
# DISK_CHECK_INTERVAL seconds and posts to ALERT_WEBHOOK_URL when usage crosses
# DISK_ALERT_THRESHOLD %. One alert per crossing (re-arms below threshold - 5).
set -u

THRESHOLD="${DISK_ALERT_THRESHOLD:-80}"
INTERVAL="${DISK_CHECK_INTERVAL:-900}"
STATE=/tmp/disk-alerted

if [ -z "${ALERT_WEBHOOK_URL:-}" ]; then
  echo "[alerts] ALERT_WEBHOOK_URL not set — nowhere to alert, exiting" >&2
  exit 1
fi

notify() {
  msg="$1"
  # "text" (Slack/Mattermost/ntfy) + "content" (Discord) in one payload.
  curl -fsS -m 15 -X POST -H 'Content-Type: application/json' \
    -d "{\"text\":\"$msg\",\"content\":\"$msg\"}" \
    "$ALERT_WEBHOOK_URL" > /dev/null 2>&1 \
    || echo "[alerts] webhook delivery failed" >&2
}

echo "[alerts] watching /host, threshold ${THRESHOLD}%, every ${INTERVAL}s"

while true; do
  usage=$(df -P /host | awk 'NR==2 { gsub("%",""); print $5 }')
  if [ -z "$usage" ]; then
    echo "[alerts] could not read disk usage" >&2
  elif [ "$usage" -ge "$THRESHOLD" ]; then
    if [ ! -f "$STATE" ]; then
      echo "[alerts] disk at ${usage}% — alerting"
      notify "⚠️ Pherro: disco do servidor em ${usage}% (limite ${THRESHOLD}%). Libere espaço ou aumente o volume."
      touch "$STATE"
    fi
  elif [ "$usage" -lt "$((THRESHOLD - 5))" ] && [ -f "$STATE" ]; then
    echo "[alerts] disk back to ${usage}% — re-armed"
    rm -f "$STATE"
  fi
  sleep "$INTERVAL"
done
