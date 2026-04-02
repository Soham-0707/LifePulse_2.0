import { AnalysisResult, RoutineEntry } from "@/types/app";

interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(analysis: AnalysisResult | null, entries: RoutineEntry[]) {
  const latest = entries[0];
  const analysisBlock = analysis
    ? `Status: ${analysis.status}. Risk score: ${(analysis.riskScore * 100).toFixed(1)}%. Reasons: ${analysis.reasons.join(" ")} Actions: ${analysis.actions.join(" ")}.`
    : "No analysis available yet.";

  const latestBlock = latest
    ? `Latest routine: mood ${latest.mood}/5, stress ${latest.stress}/10, sleep ${latest.sleepHours}h, energy ${latest.energy}/10, social ${latest.social}/10, activities ${latest.activities.join(", ")}, journal ${latest.journal}.`
    : "No routine entries yet.";

  return [
    "You are LifePulse Copilot, a calm and practical wellbeing assistant.",
    "Respond naturally like a modern chat assistant, while staying warm and practical.",
    "Keep responses concise, useful, and personalized.",
    "Use short bullet points when listing actions, but normal paragraphs for conversation.",
    "Do not diagnose diseases. Recommend seeking professional help for severe or persistent symptoms.",
    "If user expresses crisis intent, encourage contacting local emergency services or a crisis hotline immediately.",
    analysisBlock,
    latestBlock,
  ].join(" ");
}

export async function requestWellnessChatReply(
  message: string,
  analysis: AnalysisResult | null,
  entries: RoutineEntry[],
  history: ChatHistoryMessage[],
) {
  const response = await fetch("/api/wellness-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemPrompt: buildSystemPrompt(analysis, entries),
      history: history.slice(-12),
      message,
    }),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? `AI request failed (${response.status})`);
  }

  const json = (await response.json()) as { reply?: string };
  const content = json.reply?.trim();
  if (!content) {
    throw new Error("AI returned an empty response.");
  }

  return content;
}
