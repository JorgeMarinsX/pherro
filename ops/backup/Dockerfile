# Pherro backup sidecar: nightly pg_dump + uploads archive, shipped to
# S3-compatible object storage (MinIO) via mc. Restore via restore.sh.
FROM postgres:16-alpine

RUN apk add --no-cache curl \
  && ARCH=$(case "$(uname -m)" in x86_64) echo amd64 ;; aarch64) echo arm64 ;; *) echo amd64 ;; esac) \
  && curl -fsSL "https://dl.min.io/client/mc/release/linux-${ARCH}/mc" -o /usr/local/bin/mc \
  && chmod +x /usr/local/bin/mc

COPY entrypoint.sh backup.sh restore.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/backup.sh /usr/local/bin/restore.sh \
  && mkdir -p /backups /uploads

ENTRYPOINT ["entrypoint.sh"]
CMD ["cron"]
