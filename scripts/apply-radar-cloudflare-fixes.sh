#!/usr/bin/env bash
# Apply Radar Control Room Cloudflare fixes for b2b-better.com
# Usage: CF_API_TOKEN=your_token ./scripts/apply-radar-cloudflare-fixes.sh
set -euo pipefail

ZONE_NAME="${CF_ZONE_NAME:-b2b-better.com}"
API="https://api.cloudflare.com/client/v4"

if [[ -z "${CF_API_TOKEN:-}" ]]; then
  echo "Error: set CF_API_TOKEN (Zone:DNS:Edit + Zone:Settings:Edit permissions)" >&2
  exit 1
fi

cf_api() {
  local method="$1" path="$2"
  shift 2
  curl -sS -X "$method" "${API}${path}" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "$@"
}

echo "→ Resolving zone ID for ${ZONE_NAME}..."
ZONE_ID=$(cf_api GET "/zones?name=${ZONE_NAME}" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')")
if [[ -z "$ZONE_ID" ]]; then
  echo "Error: zone not found" >&2
  exit 1
fi
echo "  Zone ID: ${ZONE_ID}"

set_setting() {
  local id="$1" value="$2"
  echo "→ Setting ${id} = ${value}"
  cf_api PATCH "/zones/${ZONE_ID}/settings/${id}" -d "{\"value\":\"${value}\"}" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('success') else 1)"
}

echo ""
echo "=== Phase 1: Zone SSL / HTTPS ==="
set_setting ssl strict
set_setting always_use_https on
cf_api PATCH "/zones/${ZONE_ID}/settings/security_header" -d '{
  "value": {
    "strict_transport_security": {
      "enabled": true,
      "max_age": 31536000,
      "include_subdomains": true,
      "preload": false,
      "nosniff": true
    }
  }
}' | python3 -c "import json,sys; d=json.load(sys.stdin); print('  HSTS:', 'ok' if d.get('success') else d)"

echo ""
echo "=== Phase 2: Bot protection ==="
set_setting bot_fight_mode on 2>/dev/null || echo "  (bot_fight_mode may require dashboard if API rejects)"

echo ""
echo "=== Phase 3: Proxy prod-dog CNAME ==="
RECORDS=$(cf_api GET "/zones/${ZONE_ID}/dns_records?name=prod-dog.${ZONE_NAME}")
RECORD_ID=$(echo "$RECORDS" | python3 -c "import json,sys; r=json.load(sys.stdin).get('result',[]); print(r[0]['id'] if r else '')")
if [[ -n "$RECORD_ID" ]]; then
  echo "→ Enabling proxy on prod-dog.${ZONE_NAME}"
  cf_api PATCH "/zones/${ZONE_ID}/dns_records/${RECORD_ID}" -d '{"proxied":true}' | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ', 'ok' if d.get('success') else d)"
else
  echo "  prod-dog record not found — skip or add manually"
fi

echo ""
echo "=== Phase 4: DMARC TXT record ==="
DMARC_EXISTS=$(cf_api GET "/zones/${ZONE_ID}/dns_records?type=TXT&name=_dmarc.${ZONE_NAME}" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('result',[])))")
if [[ "$DMARC_EXISTS" == "0" ]]; then
  echo "→ Creating _dmarc TXT record"
  cf_api POST "/zones/${ZONE_ID}/dns_records" -d "{
    \"type\": \"TXT\",
    \"name\": \"_dmarc\",
    \"content\": \"v=DMARC1; p=none; rua=mailto:hello@built-better.co.uk; pct=100\",
    \"ttl\": 1
  }" | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ', 'ok' if d.get('success') else d)"
else
  echo "  _dmarc TXT already exists — review content manually"
fi

echo ""
echo "Done. Refresh Radar Control Room in a few minutes."
echo "Manual follow-ups:"
echo "  - AI Labyrinth: Security → Bots (dashboard)"
echo "  - Turnstile: acknowledge in Radar until server forms exist"
echo "  - MFA #9: acknowledge — Google SSO + 2FA"
echo "  - Subdomain TLS findings (_dmarc/mta-sts/_domainconnect): often false positives after zone HSTS"
