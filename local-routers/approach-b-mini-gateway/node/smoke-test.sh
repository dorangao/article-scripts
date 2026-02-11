#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${MINI_ROUTER_BASE_URL:-http://127.0.0.1:8787}"
TOKEN="${MINI_ROUTER_TOKEN:-}"

headers=( -H "Content-Type: application/json" )
if [[ -n "${TOKEN}" ]]; then
  headers+=( -H "Authorization: Bearer ${TOKEN}" )
fi

response="$(curl -sS "${BASE_URL}/v1/chat/completions" \
  "${headers[@]}" \
  -d '{
    "messages": [
      {"role":"system","content":"You are concise."},
      {"role":"user","content":"Write a TypeScript function to reverse a string."}
    ]
  }')"

if command -v jq >/dev/null 2>&1; then
  printf '%s\n' "${response}" | jq .
else
  printf '%s\n' "${response}"
fi
