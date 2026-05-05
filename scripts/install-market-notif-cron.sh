#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   APP_DIR=/path/to/app CRON_SCHEDULE="* * * * *" bash scripts/install-market-notif-cron.sh
#
# Defaults:
# - APP_DIR: current working directory
# - CRON_SCHEDULE: every minute
# - CRON_LOG_FILE: $APP_DIR/logs/market-notif.log

APP_DIR="${APP_DIR:-$(pwd)}"
CRON_SCHEDULE="${CRON_SCHEDULE:-* * * * *}"
CRON_LOG_FILE="${CRON_LOG_FILE:-$APP_DIR/logs/market-notif.log}"
WORKER_COMMAND="${WORKER_COMMAND:-cd \"$APP_DIR\" && /usr/bin/env npm run worker:market-notif >> \"$CRON_LOG_FILE\" 2>&1}"

mkdir -p "$(dirname "$CRON_LOG_FILE")"

CRON_TAG="# trive-sca market notif worker"
CRON_LINE="$CRON_SCHEDULE $WORKER_COMMAND $CRON_TAG"

EXISTING_CRON="$(crontab -l 2>/dev/null || true)"
FILTERED_CRON="$(printf "%s\n" "$EXISTING_CRON" | awk '!/trive-sca market notif worker/')"

{
  printf "%s\n" "$FILTERED_CRON" | sed '/^[[:space:]]*$/d'
  printf "%s\n" "$CRON_LINE"
} | crontab -

echo "Installed/updated cron:"
echo "$CRON_LINE"
