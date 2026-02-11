#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${OPENCLAW_GATEWAY_URL:-http://127.0.0.1:18789}"
TOKEN="${OPENCLAW_GATEWAY_TOKEN:-}"
AGENT_ID="${OPENCLAW_AGENT_ID:-main}"

headers=(
  -H "Content-Type: application/json"
  -H "x-openclaw-agent-id: ${AGENT_ID}"
)

if [[ -n "${TOKEN}" ]]; then
  headers+=( -H "Authorization: Bearer ${TOKEN}" )
fi

curl -sS "${BASE_URL}/v1/chat/completions" \
  "${headers[@]}" \
  -d '{
    "model": "openclaw",
    "messages": [
      {"role":"user","content":"Say hi in one sentence."}
    ]
  }' | {
    if command -v jq >/dev/null 2>&1; then
      jq .
    else
      cat
    fi
  }
