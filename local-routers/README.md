# Local AI Routers (Two Approaches)

**Article:** [Solo Devs: Build a Local AI Router (OpenAI-Compatible) That Uses OpenClaw and Codex OAuth Instead](https://medium.com/@dorangao/solo-devs-build-a-local-ai-router-openai-compatible-that-uses-openclaw-and-codex-oauth-instead-4eca81d3807e)

This folder implements both approaches from the article:

- `approach-a-openclaw/`: Use OpenClaw Gateway as an OpenAI-compatible local router.
- `approach-b-mini-gateway/`: Run a tiny server that wraps `codex exec`.

Both expose the same endpoint shape:

```http
POST /v1/chat/completions
```

## Prerequisites

- Codex CLI installed and authenticated once (`codex login`).
- For Approach A: OpenClaw installed and configured.
- For Approach B (Python): Python 3.10+.
- For Approach B (Node): Node.js 18+.

## Quick map

- OpenClaw router docs and examples: `approach-a-openclaw/README.md`
- FastAPI mini gateway: `approach-b-mini-gateway/python/mini_gateway.py`
- Express mini gateway: `approach-b-mini-gateway/node/src/server.ts`

## Security baseline

- Bind to `127.0.0.1` unless you intentionally need remote access.
- Require a bearer token (`MINI_ROUTER_TOKEN` / OpenClaw Gateway auth).
- Treat local auth stores (`~/.codex/auth.json`, keyrings, OpenClaw auth state) as secrets.
