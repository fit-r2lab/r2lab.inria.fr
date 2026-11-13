#!/bin/bash
#
# Apply the current checkout to the production site: copy it over to
# /var/www/r2lab.inria.fr, rebuild the react part, sync the django venv
# and restart the django app.
#
# Called by r2lab-embedded/services/run-updates.sh after it has moved this
# repo to the latest origin commit; can also be run by hand to force a redeploy.
# The git update itself is NOT done here, since resetting a repo under a
# running script is unsafe.
#
# Notes
# - the nginx configuration lives in deploy/nginx/ and is installed under
#   /etc/nginx; it is checked with nginx -t and only then reloaded; if the
#   check fails the previous configuration is put back
# - /docs/ is served statically from /var/www/r2lab-docs, which is populated
#   by the r2lab-docs repo, not by this one
# - the raw/ subdir is published by the other repo r2lab.inria.fr-raw
#

set -euo pipefail

cd "$(dirname "$(readlink -f "$0")")/.."

export PATH="/root/.local/bin:$PATH"

PUBLISH_PATH=/var/www/r2lab.inria.fr

# no --delete, as this would remove the contents of raw/
rsync -ai --exclude .git ./ $PUBLISH_PATH/
(cd $PUBLISH_PATH/react && npm install && npm run build)
rsync -ai nepi-ng-index.html /var/www/nepi-ng/index.html

(cd $PUBLISH_PATH/django && uv sync --frozen)

# nginx config: install, check, reload - or roll back
NGINX_BACKUP=$(mktemp -d)
cp -a /etc/nginx/nginx.conf /etc/nginx/conf.d "$NGINX_BACKUP"/
rsync -ai deploy/nginx/ /etc/nginx/
if nginx -t; then
    systemctl reload nginx
else
    echo "update.sh: nginx -t failed, restoring previous configuration"
    cp -a "$NGINX_BACKUP"/nginx.conf /etc/nginx/nginx.conf
    rsync -a --delete "$NGINX_BACKUP"/conf.d/ /etc/nginx/conf.d/
    exit 1
fi
rm -rf "$NGINX_BACKUP"

systemctl daemon-reload
systemctl restart r2lab-django
