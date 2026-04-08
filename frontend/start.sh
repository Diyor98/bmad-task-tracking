#!/bin/sh
set -e

echo "start.sh: BACKEND_URL=${BACKEND_URL}"
echo "start.sh: PORT=${PORT}"

envsubst '$BACKEND_URL $PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo "start.sh: generated config line 16:"
sed -n '16p' /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
