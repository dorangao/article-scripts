# Approach B: Mini Codex Gateway

This approach builds a local OpenAI-style endpoint by wrapping `codex exec`.

Both variants expose:

```http
POST /v1/chat/completions
```

## Common requirements

- Codex CLI installed.
- One-time auth completed (`codex login`).

## Python (FastAPI)

Files:

- `python/mini_gateway.py`
- `python/requirements.txt`
- `python/smoke-test.sh`

Run:

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export MINI_ROUTER_TOKEN="supersecret"
python mini_gateway.py
```

Test:

```bash
cd python
./smoke-test.sh
```

## Node (Express + TypeScript)

Files:

- `node/src/server.ts`
- `node/package.json`
- `node/tsconfig.json`
- `node/smoke-test.sh`

Run:

```bash
cd node
npm install
export MINI_ROUTER_TOKEN="supersecret"
npm run dev
```

Optional: set a different port if `8787` is busy.

```bash
export MINI_ROUTER_PORT="8788"
npm run dev
```

Test:

```bash
cd node
./smoke-test.sh
```

## Important defaults

- Router binds to `127.0.0.1` by default.
- Router requires `Authorization: Bearer <MINI_ROUTER_TOKEN>` only if token is set.
- Router uses `CODEX_DEFAULT_MODEL` when request `model` is omitted (default: `gpt-5-codex`).
- `codex exec` runs with:
  - `--sandbox read-only`
  - `--ask-for-approval never`
  - `-c model_reasoning_effort="<CODEX_REASONING_EFFORT>"` (defaults to `high`)
  - `--skip-git-repo-check`

## Troubleshooting

If you see `EADDRINUSE` on `127.0.0.1:8787`, another process is already listening.

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
kill <pid>
```

Or run the router on a different port:

```bash
export MINI_ROUTER_PORT="8788"
npm run dev
```

If you see `unexpected argument '--ask-for-approval'`, you are likely hitting an older running gateway process.

```bash
lsof -nP -iTCP:8787 -sTCP:LISTEN
kill <pid>
npm run dev
```

If you see `unknown variant 'xhigh' in model_reasoning_effort`, set an explicit valid effort:

```bash
export CODEX_REASONING_EFFORT="high"
```

Or fix your global Codex config:

```bash
# ~/.codex/config.toml
model_reasoning_effort = "high"
```

If you see `The model ... does not exist or you do not have access`, select a model you can use:

```bash
export CODEX_DEFAULT_MODEL="gpt-5-codex"
```
