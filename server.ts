import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 15000,
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error("GATEWAY_TIMEOUT: Upstream Gemini request timed out.")), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

function formatGeminiError(err: unknown): { status: number; message: string; code: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("GATEWAY_TIMEOUT") || raw.includes("AbortError") || raw.includes("timed out")) {
    return {
      status: 504,
      code: "GATEWAY_TIMEOUT",
      message: "Gemini API request timed out. Please try again.",
    };
  }
  if (raw.includes("API_KEY_INVALID") || raw.includes("400")) {
    return {
      status: 400,
      code: "API_KEY_INVALID",
      message: "Invalid Gemini API key. Check your GEMINI_API_KEY in Settings > Secrets.",
    };
  }
  if (raw.includes("PERMISSION_DENIED") || raw.includes("403")) {
    return {
      status: 403,
      code: "PERMISSION_DENIED",
      message: "Gemini API permission denied. Verify your key in Settings > Secrets.",
    };
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return {
      status: 429,
      code: "RESOURCE_EXHAUSTED",
      message: "Rate limit reached. Please try again in a moment.",
    };
  }
  return {
    status: 500,
    code: "GEMINI_ERROR",
    message: raw || "Failed to reach Gemini service.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/gemini/spotlight", async (req: Request, res: Response) => {
    const query = typeof req.body?.query === "string" ? req.body.query.trim() : "";
    if (!query) {
      res.status(400).json({ error: "Query is required." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Add it in Settings > Secrets.",
        code: "MISSING_API_KEY",
      });
      return;
    }

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: query,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              "You are the Agentic OS Orchestrator inside Spotlight on Sequoia Web OS (created by Ali Abid Rasheed for DevFest Pakistan 2026). " +
              "Answer the user's query concisely in 1 to 3 sentences AND emit an ordered `actions` array whenever the user wants to control or automate the desktop OS. " +
              "Supported action types: " +
              "1) open_app (target: finder | safari | terminal | notes | calculator | settings) " +
              "2) create_note (title: string, body: string) — use this to generate full content directly into Notes! " +
              "3) run_terminal_cmd (command: string, e.g. 'neofetch', 'ls', 'whoami', 'uname') " +
              "4) set_theme (target: light | dark) " +
              "5) set_wallpaper (target: sequoia | sonoma | sierra | silk). " +
              "For multi-step requests like 'Write a hackathon pitch in Notes and check system status in Terminal', return BOTH create_note and open_app(terminal) + run_terminal_cmd('neofetch'). " +
              "If it is purely an informational question with no OS task, return an empty actions array.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answer: {
                  type: Type.STRING,
                  description: "Direct, concise answer for Spotlight UI.",
                },
                actions: {
                  type: Type.ARRAY,
                  description: "Ordered list of OS orchestration steps to execute.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: {
                        type: Type.STRING,
                        description: "One of: open_app, create_note, run_terminal_cmd, set_theme, set_wallpaper",
                      },
                      target: {
                        type: Type.STRING,
                        description: "App id, theme name, or wallpaper id",
                      },
                      title: {
                        type: Type.STRING,
                        description: "Note title when type is create_note",
                      },
                      body: {
                        type: Type.STRING,
                        description: "Full note body when type is create_note",
                      },
                      command: {
                        type: Type.STRING,
                        description: "Shell command when type is run_terminal_cmd",
                      },
                      label: {
                        type: Type.STRING,
                        description: "Human-readable step label like 'Create Hackathon Pitch in Notes'",
                      },
                    },
                  },
                },
              },
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json({
        answer: typeof parsed.answer === "string" ? parsed.answer : "Orchestrating workspace actions.",
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
    }
  });

  app.post("/api/gemini/terminal", async (req: Request, res: Response) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const cwd = typeof req.body?.cwd === "string" ? req.body.cwd : "~/Desktop";
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Add it in Settings > Secrets.",
        code: "MISSING_API_KEY",
      });
      return;
    }

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: `Current working directory: ${cwd}\nUser query: ${prompt}`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              "You are a concise macOS zsh terminal assistant. Provide crisp, plain-text terminal-friendly answers, shell snippets, or explanations. Avoid heavy markdown formatting; keep lines clean and readable in a monospace console.",
          },
        })
      );
      res.json({ output: response.text ?? "" });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
    }
  });

  app.post("/api/gemini/notes", async (req: Request, res: Response) => {
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    const mode = req.body?.mode === "polish" ? "polish" : "summarize";
    if (!content) {
      res.status(400).json({ error: "Note content is empty." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: "GEMINI_API_KEY is not configured. Add it in Settings > Secrets.",
        code: "MISSING_API_KEY",
      });
      return;
    }

    const instruction =
      mode === "summarize"
        ? "Summarize this note clearly into a concise overview and key bullet takeaways. Return clean plain text ready to insert into Apple Notes."
        : "Polish and refine the grammar, clarity, and structure of this note while preserving its original meaning and voice. Return clean plain text ready to replace the note body.";

    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: content,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction: instruction,
          },
        })
      );
      res.json({ result: response.text ?? "" });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message, code: formatted.code });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get("*", (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sequoia Web OS server running on http://0.0.0.0:${PORT} (${isProduction ? "production" : "development"})`);
  });
}

startServer();
