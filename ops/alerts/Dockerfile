FROM alpine:3.20

RUN apk add --no-cache curl

COPY check.sh /usr/local/bin/check.sh
RUN chmod +x /usr/local/bin/check.sh

ENTRYPOINT ["/usr/local/bin/check.sh"]
