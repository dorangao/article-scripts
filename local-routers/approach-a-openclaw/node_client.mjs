#!/usr/bin/env node

const baseUrl = process.env.OPENCLAW_GATEWAY_URL ?? "http://127.0.0.1:18789";
const token = process.env.OPENCLAW_GATEWAY_TOKEN ?? "";
const agent = process.env.OPENCLAW_AGENT_ID ?? "main";

async function chat(prompt) {
  const headers = {
    "Content-Type": "application/json",
    "x-openclaw-agent-id": agent,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "openclaw",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

chat("Draft a README for a small CLI tool.")
  .then((text) => console.log(text))
  .catch((err) => {
    console.error(String(err));
    process.exit(1);
  });
