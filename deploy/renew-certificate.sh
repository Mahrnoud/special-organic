#!/bin/sh
set -eu
# Called only for this certificate, never stop the shared web server.
if [ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/special-organic.com ]; then
    /usr/sbin/nginx -t
    /bin/systemctl reload nginx
fi
