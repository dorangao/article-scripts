import express from "express";
import { spawn } from "child_process";

type Role = "system" | "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type ChatRequest = {
  messages: Message[];
  model?: string;
  stream?: boolean;
};

const app = express();
app.use(express.json({ limit: "2mb" }));

const HOST = process.env.MINI_ROUTER_HOST ?? "127.0.0.1";
const PORT = Number.parseInt(process.env.MINI_ROUTER_PORT ?? "8787", 10);
const TOKEN = process.env.MINI_ROUTER_TOKEN;
const CODEX_BIN = process.env.CODEX_BIN ?? "codex";
const CODEX_REASONING_EFFORT = process.env.CODEX_REASONING_EFFORT ?? "high";
const CODEX_DEFAULT_MODEL = process.env.CODEX_DEFAULT_MODEL ?? "gpt-5-codex";
const rawTimeoutMs = Number.parseInt(process.env.CODEX_EXEC_TIMEOUT_MS ?? "180000", 10);
const CODEX_TIMEOUT_MS = Number.isFinite(rawTimeoutMs) && rawTimeoutMs > 0 ? rawTimeoutMs : 180000;

function isRole(value: unknown): value is Role {
  return value === "system" || value === "user" || value === "assistant";
}

function isMessages(value: unknown): value is Message[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    return isRole(role) && typeof content === "string" && content.length > 0;
  });
}

function toPrompt(messages: Message[]): string {
  const parts: string[] = [];
  for (const message of messages) {
    parts.push(`[${message.role.toUpperCase()}]\n${message.content}\n`);
  }
  parts.push("[ASSISTANT]\n");
  return parts.join("\n");
}

function runCodex(prompt: string, model?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const effectiveModel = model ?? CODEX_DEFAULT_MODEL;
    const args = [
      "--ask-for-approval",
      "never",
      "exec",
      "-c",
      `model_reasoning_effort="${CODEX_REASONING_EFFORT}"`,
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
    ];

    if (effectiveModel) {
      args.push("--model", effectiveModel);
    }

    args.push(prompt);

    const child = spawn(CODEX_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, CODEX_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);

      if (timedOut) {
        reject(new Error(`codex exec timed out after ${CODEX_TIMEOUT_MS}ms`));
        return;
      }

      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error((stderr || stdout).trim() || `codex exec failed (exit ${code})`));
    });
  });
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.post("/v1/chat/completions", async (req, res) => {
  if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as Partial<ChatRequest>;

  if (body.stream === true) {
    res.status(400).json({ error: "stream=true is not implemented by this mini gateway" });
    return;
  }

  if (!isMessages(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: "messages[] is required" });
    return;
  }

  const model = typeof body.model === "string" && body.model.length > 0 ? body.model : undefined;

  try {
    const answer = await runCodex(toPrompt(body.messages), model);
    const now = Math.floor(Date.now() / 1000);

    res.json({
      id: `chatcmpl_${now}`,
      object: "chat.completion",
      created: now,
      model: model ?? CODEX_DEFAULT_MODEL,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: answer },
          finish_reason: "stop",
        },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: { message, type: "router_error" } });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Local AI Router listening on http://${HOST}:${PORT}`);
});

server.on("error", (err) => {
  if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} on ${HOST} is already in use. Stop the existing process or set MINI_ROUTER_PORT to a free port.`
    );
    process.exit(1);
  }

  console.error(err);
  process.exit(1);
});
