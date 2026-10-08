#!/usr/bin/env bash
# Update hrmsystem on the server: download the latest code, rebuild, restart.
#
#   /opt/hrmsystem/app/deploy/deploy.sh        (as root, on the server)
#
# Run manually after a change, or automatically by the GitHub Actions
# "Deploy to Production" workflow over SSH on every push to main.
set -euo pipefail

# git pull replaces THIS file while it runs. Bash reads a script as it goes, so a changed
# file would run garbled. Everything lives in main() so bash has read it all before starting.
main() {
APP_USER=hrmapp
APP_DIR=/opt/hrmsystem/app
ENV_FILE=/etc/hrmsystem.env
SERVICE=hrmsystem
PORT=3002
BRANCH=${BRANCH:-main}
KEY=/home/$APP_USER/.ssh/id_ed25519

log()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
fail() { printf '\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }
as_app() { runuser -u "$APP_USER" -- "$@"; }

[ "$(id -u)" = 0 ] || fail "run as root"
[ -d "$APP_DIR/.git" ] || fail "$APP_DIR is not set up yet."
[ -r "$ENV_FILE" ] || fail "$ENV_FILE is missing."

cd "$APP_DIR"
BEFORE=$(as_app git rev-parse --short HEAD)

log "Downloading the latest code"
as_app env GIT_SSH_COMMAND="ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
  git pull --ff-only origin "$BRANCH"
echo "$BEFORE -> $(as_app git rev-parse --short HEAD)"

log "Installing libraries"
as_app npm ci --no-audit --no-fund

log "Refreshing settings and building the website"
install -o "$APP_USER" -g "$APP_USER" -m 600 "$ENV_FILE" "$APP_DIR/.env"
as_app env NODE_OPTIONS=--max-old-space-size=1536 npm run build

log "Restarting the app"
systemctl restart "$SERVICE"

CODE=000
for _ in $(seq 1 30); do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 3 "http://127.0.0.1:$PORT/" || true)
  [ "$CODE" != 000 ] && break
  sleep 1
done

case "$CODE" in
  200) echo "The app is running." ;;
  *)   journalctl -u "$SERVICE" -n 30 --no-pager || true
       fail "the app did not start. The last log lines are above. Previous version was $BEFORE." ;;
esac
}

main "$@"
exit
