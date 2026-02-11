#!/usr/bin/env python3
"""Local OpenAI-style chat endpoint backed by `codex exec`."""

import os
import subprocess
import time
from typing import Literal, Optional

import uvicorn
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

HOST = os.getenv("MINI_ROUTER_HOST", "127.0.0.1")
PORT = int(os.getenv("MINI_ROUTER_PORT", "8787"))
GATEWAY_TOKEN = os.getenv("MINI_ROUTER_TOKEN")
CODEX_BIN = os.getenv("CODEX_BIN", "codex")
CODEX_TIMEOUT_SECONDS = int(os.getenv("CODEX_EXEC_TIMEOUT_SECONDS", "180"))
CODEX_REASONING_EFFORT = os.getenv("CODEX_REASONING_EFFORT", "high")
CODEX_DEFAULT_MODEL = os.getenv("CODEX_DEFAULT_MODEL", "gpt-5-codex")

app = FastAPI(title="Local AI Router (Codex-backed)")


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    messages: list[Message] = Field(min_length=1)
    model: Optional[str] = None
    stream: bool = False


def to_prompt(messages: list[Message]) -> str:
    parts: list[str] = []
    for message in messages:
        parts.append(f"[{message.role.upper()}]\n{message.content}\n")
    parts.append("[ASSISTANT]\n")
    return "\n".join(parts)


def run_codex(prompt: str, model: Optional[str]) -> str:
    effective_model = model or CODEX_DEFAULT_MODEL
    args = [
        CODEX_BIN,
        "--ask-for-approval",
        "never",
        "exec",
        "-c",
        f'model_reasoning_effort="{CODEX_REASONING_EFFORT}"',
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
    ]
    if effective_model:
        args += ["--model", effective_model]
    args.append(prompt)

    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=CODEX_TIMEOUT_SECONDS,
            check=False,
        )
    except FileNotFoundError as exc:
        raise RuntimeError(f"{CODEX_BIN} was not found in PATH") from exc
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            f"codex exec timed out after {CODEX_TIMEOUT_SECONDS} seconds"
        ) from exc

    if proc.returncode != 0:
        message = (proc.stderr or proc.stdout or "").strip()
        raise RuntimeError(message or f"codex exec failed (exit {proc.returncode})")

    return proc.stdout.strip()


@app.get("/healthz")
def healthz() -> dict[str, bool]:
    return {"ok": True}


@app.post("/v1/chat/completions")
def chat(req: ChatRequest, authorization: Optional[str] = Header(default=None)):
    if GATEWAY_TOKEN and authorization != f"Bearer {GATEWAY_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    if req.stream:
        raise HTTPException(
            status_code=400,
            detail="stream=true is not implemented by this mini gateway",
        )

    try:
        answer = run_codex(to_prompt(req.messages), req.model)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": str(exc),
                    "type": "router_error",
                }
            },
        )

    now = int(time.time())
    return {
        "id": f"chatcmpl_{now}",
        "object": "chat.completion",
        "created": now,
        "model": req.model or CODEX_DEFAULT_MODEL,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": answer},
                "finish_reason": "stop",
            }
        ],
    }


if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)
