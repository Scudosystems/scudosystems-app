#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# set-vercel-env.sh  –  Push all required env vars to the Vercel project
#
# USAGE:
#   1.  Get a Vercel Personal Access Token at https://vercel.com/account/tokens
#   2.  Run from the scudosystem folder:
#         VERCEL_TOKEN=your_token bash scripts/set-vercel-env.sh
#
# The script reads values from your local .env.local file automatically.
# No secrets are stored in this script.
# ─────────────────────────────────────────────────────────────────────────────

set -e

PROJECT_ID="prj_6lj19tLapuua9469tGg7ihPQs8aj"
TEAM_ID="team_49S79rqkrhd6qwSKLcB4j5fn"
API="https://api.vercel.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.local"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "ERROR: VERCEL_TOKEN is not set."
  echo "  Get one at https://vercel.com/account/tokens then run:"
  echo "  VERCEL_TOKEN=xxx bash scripts/set-vercel-env.sh"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env.local not found at $ENV_FILE"
  exit 1
fi

# Read a value from .env.local
get_env() {
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d'=' -f2-
}

# Load values from .env.local
NEXT_PUBLIC_SUPABASE_URL=$(get_env "NEXT_PUBLIC_SUPABASE_URL")
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(get_env "NEXT_PUBLIC_SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY=$(get_env "SUPABASE_SERVICE_ROLE_KEY")
STRIPE_SECRET_KEY=$(get_env "STRIPE_SECRET_KEY")
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$(get_env "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET=$(get_env "STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_IDS_JSON=$(get_env "STRIPE_PRICE_IDS_JSON")
STRIPE_JOB_OFFER_PRICE_ID=$(get_env "STRIPE_JOB_OFFER_PRICE_ID")
ADMIN_EMAIL=$(get_env "ADMIN_EMAIL")
NEXT_PUBLIC_ADMIN_EMAIL=$(get_env "NEXT_PUBLIC_ADMIN_EMAIL")

# Validate required vars loaded
for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var not found in .env.local"
    exit 1
  fi
done

# Map: KEY | plain|encrypted
declare -a VARS=(
  "NEXT_PUBLIC_SUPABASE_URL|$NEXT_PUBLIC_SUPABASE_URL|plain"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY|$NEXT_PUBLIC_SUPABASE_ANON_KEY|plain"
  "SUPABASE_SERVICE_ROLE_KEY|$SUPABASE_SERVICE_ROLE_KEY|encrypted"
  "NEXT_PUBLIC_APP_URL|https://scudosystems-app-scudosystems.vercel.app|plain"
  "ADMIN_EMAIL|${ADMIN_EMAIL:-hello@scudosystems.com}|plain"
  "NEXT_PUBLIC_ADMIN_EMAIL|${NEXT_PUBLIC_ADMIN_EMAIL:-hello@scudosystems.com}|plain"
  "NEXT_PUBLIC_DEMO_MODE|false|plain"
  "STRIPE_SECRET_KEY|$STRIPE_SECRET_KEY|encrypted"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY|plain"
  "STRIPE_WEBHOOK_SECRET|$STRIPE_WEBHOOK_SECRET|encrypted"
  "STRIPE_PRICE_IDS_JSON|$STRIPE_PRICE_IDS_JSON|plain"
  "STRIPE_JOB_OFFER_PRICE_ID|$STRIPE_JOB_OFFER_PRICE_ID|plain"
)

echo "Reading env vars from .env.local and setting ${#VARS[@]} variables on Vercel..."
echo ""

for entry in "${VARS[@]}"; do
  KEY="${entry%%|*}"
  REST="${entry#*|}"
  VALUE="${REST%|*}"
  TYPE="${entry##*|}"

  if [ -z "$VALUE" ]; then
    echo "  -  $KEY  (skipped – not found in .env.local)"
    continue
  fi

  PAYLOAD=$(python3 -c "
import json, sys
key   = sys.argv[1]
value = sys.argv[2]
vtype = sys.argv[3]
env   = [{'key': key, 'value': value, 'type': vtype, 'target': ['production','preview','development']}]
print(json.dumps(env))
" "$KEY" "$VALUE" "$TYPE")

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$API/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID&upsert=true" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)

  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
    echo "  ✓  $KEY"
  else
    BODY=$(echo "$RESPONSE" | head -1)
    echo "  ✗  $KEY  (HTTP $HTTP_CODE: $BODY)" | head -c 200
    echo ""
  fi
done

echo ""
echo "Done! Visit your Vercel project to trigger a new deployment:"
echo "  https://vercel.com/scudosystems/scudosystems-app"
