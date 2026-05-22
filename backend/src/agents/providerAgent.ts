import OpenAI from "openai";
import { ApiError } from "../middleware/error.middleware";

// ─── Output Interface ─────────────────────────────────────────────────────────

export interface ProviderAgentOutput {
  /** The conversational reply to send back to the provider */
  replyText: string;
  /** Action indicating what the frontend should fetch */
  action: "fetch_jobs" | "fetch_earnings" | "none";
  /** If the provider specifically asks for a type of job (e.g. Carpenter), extract it */
  requestedCategory?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const PROVIDER_AGENT_SYSTEM_PROMPT = `You must respond with ONLY a valid JSON object. No text before or after. No markdown. No explanation. Start your response with { and end with }

You are a conversational AI agent for providers (service professionals like carpenters, plumbers, electricians) on the Mahir marketplace in Pakistan.
Your job is to chat with the provider in the exact language they used (Urdu, Roman Urdu, or English) and determine what action they want to take.

RULES:
- Always output valid JSON.
- DO NOT include markdown code blocks (e.g., no \`\`\`json ... \`\`\`).
- DO NOT include any preamble or postamble.
- Output MUST be pure, raw JSON.
- Your 'replyText' must be a friendly, conversational response in the SAME language the provider used.
- Your 'action' MUST be exactly one of: "fetch_jobs", "fetch_earnings", or "none".
- If they ask for jobs, work, tasks, or if there is anything to do, set action to "fetch_jobs".
  - If they mention a specific trade (e.g. "Carpenter", "AC Technician", "Plumber"), include it as 'requestedCategory'.
- If they ask about money, balance, kamaai, paisa, earnings, or wallet, set action to "fetch_earnings".
- If they just say hello or chat normally, set action to "none".

EXAMPLES:
User: "Koi kaam hai?"
Output: {"replyText": "Ji zaroor, main check karta hoon aap ke liye qareeb kon se kaam available hain.", "action": "fetch_jobs"}

User: "Carpenter ki koi hai job"
Output: {"replyText": "Main check karta hoon ke qareeb mein koi carpenter ka kaam available hai ya nahi.", "action": "fetch_jobs", "requestedCategory": "Carpenter"}

User: "Mene kitne paise kamaye?"
Output: {"replyText": "Main aap ki abhi tak ki kamayi ka hisaab nikalta hoon.", "action": "fetch_earnings"}

User: "Salam"
Output: {"replyText": "Walaikum Assalam! Main aap ka Mahir Agent hoon. Batayen main aap ki kya madad kar sakta hoon? Aap apna wallet balance dekh sakte hain ya naye jobs dhoond sakte hain.", "action": "none"}

OUTPUT FORMAT (strict):
{
  "replyText": string,
  "action": "fetch_jobs" | "fetch_earnings" | "none",
  "requestedCategory"?: string
}`;

// ─── Agent Executor ───────────────────────────────────────────────────────────

export async function run(rawInput: string, providerCategory: string): Promise<ProviderAgentOutput> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    throw new ApiError(500, "GROQ_API_KEY is not set in environment");
  }

  const client = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });

  const modelName = "llama-3.3-70b-versatile";

  // Provide contextual awareness to the LLM
  const userMessage = `Provider Category: ${providerCategory || "Unknown"}
Provider Message: "${rawInput}"`;

  let rawJson = "";
  try {
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: PROVIDER_AGENT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    rawJson = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    if (!rawJson.startsWith("{")) {
      throw new Error(`Invalid JSON start: ${rawJson.slice(0, 20)}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ApiError(502, `Provider Agent LLM Connection Error: ${message}`);
  }

  try {
    const parsed = JSON.parse(rawJson);

    if (!isProviderAgentOutput(parsed)) {
      // Fallback instead of crashing if LLM outputs slightly wrong action
      if (typeof parsed.replyText === "string") {
        return { replyText: parsed.replyText, action: "none" };
      }
      throw new Error("Schema mismatch");
    }

    return parsed;
  } catch (err: unknown) {
    console.error(`[ProviderAgent] JSON Parse Failure. Raw: ${rawJson}`);
    throw new ApiError(
      502,
      `Provider Agent failed to parse LLM response.`
    );
  }
}

// ─── Runtime Type Guard ───────────────────────────────────────────────────────

function isProviderAgentOutput(value: unknown): value is ProviderAgentOutput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v["replyText"] === "string" &&
    (v["action"] === "fetch_jobs" || v["action"] === "fetch_earnings" || v["action"] === "none")
  );
}
