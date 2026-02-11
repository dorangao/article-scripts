# Approach A: OpenClaw Local Router

Use OpenClaw Gateway to expose an OpenAI-compatible endpoint on localhost.

## 1) Authenticate OpenClaw with Codex subscription OAuth

```bash
openclaw onboard --auth-choice openai-codex
# or
openclaw models auth login --provider openai-codex
```

## 2) Enable `/v1/chat/completions`

Merge the example in `openclaw.json.example` into `~/.openclaw/openclaw.json`.

## 3) Start OpenClaw Gateway

Use your normal OpenClaw startup command so Gateway is listening (default example uses `127.0.0.1:18789`).

## 4) Smoke test

```bash
export OPENCLAW_GATEWAY_URL="http://127.0.0.1:18789"
export OPENCLAW_GATEWAY_TOKEN="<your gateway bearer token>"  # optional if gateway auth disabled
export OPENCLAW_AGENT_ID="main"
./smoke-test.sh
```

## 5) Client examples

- Python: `python_client.py`
- Node fetch: `node_client.mjs`

Both call `POST /v1/chat/completions` with `model: "openclaw"`.
