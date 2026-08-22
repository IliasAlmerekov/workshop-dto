#!/bin/sh
set -e

PORT="${PORT:-8080}"

# Render both live config files fresh from their templates on every start,
# via redirection rather than in-place editing. This is what makes it safe
# to run regardless of restart count or a changed PORT: an in-place `sed -i`
# on the live file is a one-shot migration that either matches nothing on a
# second run (leaving a stale port after a PORT change) or, worse, matches
# its own already-substituted output (corrupting "Listen 8080" into
# "Listen 808080" on a plain restart, as it once did here).
sed "s/__PORT__/${PORT}/g" /etc/apache2/sites-available/000-default.conf.template \
  > /etc/apache2/sites-available/000-default.conf
sed "s/^Listen 80\$/Listen ${PORT}/" /etc/apache2/ports.conf.template \
  > /etc/apache2/ports.conf

exec "$@"
