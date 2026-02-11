#!/usr/bin/env python3
"""Simple OpenClaw chat completions client."""

import os
import requests

BASE_URL = os.getenv("OPENCLAW_GATEWAY_URL", "http://127.0.0.1:18789")
TOKEN = os.getenv("OPENCLAW_GATEWAY_TOKEN", "")
AGENT_ID = os.getenv("OPENCLAW_AGENT_ID", "main")


def chat(prompt: str) -> str:
    headers = {
        "Content-Type": "application/json",
        "x-openclaw-agent-id": AGENT_ID,
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    response = requests.post(
        f"{BASE_URL}/v1/chat/completions",
        headers=headers,
        json={
            "model": "openclaw",
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120,
    )
    response.raise_for_status()
    body = response.json()
    return body["choices"][0]["message"]["content"]


if __name__ == "__main__":
    print(chat("Write a tiny palindrome checker in Python."))
