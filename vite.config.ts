import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

interface WellnessChatBody {
  systemPrompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  message: string;
}

function parseNumeric(text: string, label: string, min: number, max: number) {
  const match = text.match(new RegExp(`${label}\\s*[:=]?\\s*(\\d{1,2}(?:\\.\\d+)?)`, "i"));
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (Number.isNaN(value)) {
    return null;
  }
  return Math.max(min, Math.min(max, value));
}

function buildTwoHourPlan(stress: number, energy: number, sleepHours: number) {
  const firstBlock = stress >= 7
    ? "00-20 min: downshift first with paced breathing (4-4-6) and shoulder/neck release."
    : "00-20 min: start with one tiny win task to create momentum.";

  const secondBlock = energy <= 4
    ? "20-50 min: do low-friction work only (email cleanup, notes, small admin)."
    : "20-50 min: one deep-work sprint on your highest priority task.";

  const thirdBlock = sleepHours < 6
    ? "50-75 min: active recovery break (walk + water), avoid extra caffeine if possible."
    : "50-75 min: short recovery break (walk/stretch/hydrate).";

  const fourthBlock = stress >= 7
    ? "75-120 min: split remaining work into 2 x 20-minute chunks with 5-minute pauses."
    : "75-120 min: complete one meaningful task and write tomorrow's top 3 priorities.";

  return [firstBlock, secondBlock, thirdBlock, fourthBlock];
}

function buildLocalWellnessReply(message: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
  const text = message.toLowerCase();
  const recentUserText = history
    .filter((item) => item.role === "user")
    .slice(-3)
    .map((item) => item.content.toLowerCase())
    .join(" ");
  const contextText = `${recentUserText} ${text}`;

  const intentMap = [
    {
      key: "anxiety",
      test: /anxiety|anxious|panic|nervous|racing thoughts/,
      lines: [
        "Do one grounding round: 5 things you see, 4 feel, 3 hear, 2 smell, 1 taste.",
        "Slow your exhale (inhale 4s, exhale 6s) for 2 minutes.",
        "Pick one safe, concrete next action in the next 10 minutes.",
      ],
    },
    {
      key: "stress",
      test: /stress|overwhelm|overwhelmed|pressure|burnout/,
      lines: [
        "List top 3 stressors and act on only one now.",
        "Use one 20-minute focus sprint, then take a 5-minute reset break.",
        "Reduce input load for one hour: fewer tabs, fewer notifications.",
      ],
    },
    {
      key: "sleep",
      test: /sleep|insomnia|tired|fatigue|exhausted|night wake/,
      lines: [
        "Set a wind-down alarm 45 minutes before sleep.",
        "Dim lights and avoid heavy scrolling near bedtime.",
        "If thoughts race, write a 3-line brain dump before bed.",
      ],
    },
    {
      key: "focus",
      test: /focus|procrastin|distract|productiv|study|exam/,
      lines: [
        "Define one micro-goal you can finish in 10 minutes.",
        "Use a timer: 25 minutes work, 5 minutes break.",
        "Start with the easiest high-value step to overcome friction.",
      ],
    },
    {
      key: "mood",
      test: /sad|down|lonely|low mood|depress|hopeless/,
      lines: [
        "Get daylight and light movement for 10-15 minutes.",
        "Reach out to one trusted person with a simple check-in text.",
        "Choose one soothing activity: shower, journaling, gentle music, or walk.",
      ],
    },
    {
      key: "habits",
      test: /habit|routine|discipline|consisten|daily plan/,
      lines: [
        "Anchor one habit to an existing routine (after brushing teeth, after breakfast).",
        "Track only one behavior for 7 days before adding more.",
        "Make it tiny: 2 minutes minimum version on hard days.",
      ],
    },
    {
      key: "relationships",
      test: /relationship|fight|argument|partner|friend|family conflict/,
      lines: [
        "Pause before replying when emotions are high.",
        "Use one calm sentence: I feel X, I need Y, can we do Z.",
        "Schedule a short repair conversation when both are calmer.",
      ],
    },
  ];

  const matched = intentMap.find((item) => item.test.test(contextText));
  const lines = matched?.lines ?? [
    "Hydrate and take a 2-minute breathing reset.",
    "Choose one important task and do a short focused block.",
    "Plan one recovery action later today (walk, stretch, or early sleep).",
  ];

  const wants2HourPlan = /next 2 hours|2 hour plan|two hour plan|personalized plan|plan for today/.test(contextText);
  const stress = parseNumeric(contextText, "stress", 1, 10) ?? 7;
  const energy = parseNumeric(contextText, "energy", 1, 10) ?? 5;
  const sleepHours = parseNumeric(contextText, "sleep", 1, 12) ?? 6;
  const twoHourPlan = wants2HourPlan ? buildTwoHourPlan(stress, energy, sleepHours) : [];

  const safetyLine = /hurt myself|suicide|kill myself|self-harm/.test(contextText)
    ? "If you feel at risk of harming yourself, contact local emergency services or a crisis hotline immediately."
    : "";

  return [
    "I hear you. Here is a practical plan for right now:",
    `- ${lines[0]}`,
    `- ${lines[1]}`,
    `- ${lines[2]}`,
    wants2HourPlan ? "\nPersonalized 2-hour plan:" : "",
    ...twoHourPlan.map((item) => `- ${item}`),
    "If you share stress (1-10), energy (1-10), and sleep hours, I can refine this further.",
    safetyLine,
  ]
    .filter(Boolean)
    .join("\n");
}

function wellnessChatProxyPlugin(runtimeEnv: Record<string, string>) {
  const handler = async (req: any, res: any, next: any) => {
    if (req.method !== "POST" || req.url !== "/api/wellness-chat") {
      next();
      return;
    }

    const apiKey = runtimeEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    const model = runtimeEnv.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const baseUrl =
      runtimeEnv.GEMINI_BASE_URL || process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

    let rawBody = "";
    req.on("data", (chunk: Buffer) => {
      rawBody += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const parsed = JSON.parse(rawBody) as WellnessChatBody;

        if (!apiKey) {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              reply: buildLocalWellnessReply(parsed.message, parsed.history ?? []),
              mode: "local-fallback",
              notice: "GEMINI_API_KEY missing. Using local wellness fallback.",
            }),
          );
          return;
        }

        const historyWindow = (parsed.history ?? []).slice(-12).map((item) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content }],
        }));

        const response = await fetch(
          `${baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: parsed.systemPrompt }],
            },
            contents: [
              ...historyWindow,
              { role: "user", parts: [{ text: parsed.message }] },
            ],
            generationConfig: {
              temperature: 0.4,
            },
          }),
        },
        );

        const json = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          error?: { message?: string };
        };

        if (!response.ok) {
          const localReply = buildLocalWellnessReply(parsed.message, parsed.history ?? []);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              reply: localReply,
              mode: "local-fallback",
              notice: json.error?.message ?? "Gemini unavailable. Returned local fallback response.",
            }),
          );
          return;
        }

        const reply = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();

        if (!reply) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "AI returned an empty response" }));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ reply }));
      } catch {
        const localReply = buildLocalWellnessReply("I need help with stress and routine");
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            reply: localReply,
            mode: "local-fallback",
            notice: "Invalid chat request payload. Returned local fallback response.",
          }),
        );
      }
    });
  };

  return {
    name: "wellness-chat-proxy",
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  ...(() => {
    const env = loadEnv(mode, process.cwd(), "");
    return {
      plugins: [react(), wellnessChatProxyPlugin(env), mode === "development" && componentTagger()].filter(Boolean),
    };
  })(),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
