#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="${CF_PAGES_PROJECT:-genovy}"
OUTPUT_DIR="${CF_PAGES_OUTPUT:-public}"
ROOT_DOMAIN="${CF_ROOT_DOMAIN:-genovy.com}"
WWW_DOMAIN="${CF_WWW_DOMAIN:-www.genovy.com}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Missing CLOUDFLARE_API_TOKEN"
  exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "Missing CLOUDFLARE_ACCOUNT_ID"
  echo "Find it at: https://dash.cloudflare.com -> Workers & Pages -> right sidebar"
  exit 1
fi

echo "Deploying ${OUTPUT_DIR} to Cloudflare Pages project: ${PROJECT_NAME}"
npx wrangler pages deploy "${OUTPUT_DIR}" --project-name="${PROJECT_NAME}" --commit-dirty=true

attach_domain() {
  local domain="$1"
  local status
  status=$(curl -sS -o /tmp/cf-domain.json -w '%{http_code}' \
    -X POST "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/domains" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"name\":\"${domain}\"}")

  if [[ "${status}" == "200" || "${status}" == "409" ]]; then
    echo "Attached domain: ${domain}"
    return 0
  fi

  echo "Failed to attach ${domain} (HTTP ${status})"
  cat /tmp/cf-domain.json
  return 1
}

attach_domain "${ROOT_DOMAIN}"
attach_domain "${WWW_DOMAIN}"

echo
echo "Done. DNS for ${ROOT_DOMAIN} should now point at Pages."
echo "Check status: https://dash.cloudflare.com -> Workers & Pages -> ${PROJECT_NAME} -> Custom domains"
