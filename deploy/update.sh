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
# - nginx is not restarted: its configuration is not part of this repo, and
#   it just serves the files or proxies to the django socket
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

systemctl daemon-reload
systemctl restart r2lab-django
