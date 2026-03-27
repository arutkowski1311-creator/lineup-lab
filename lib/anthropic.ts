import Anthropic from "@anthropic-ai/sdk";

function getAnthropic() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

interface GenerateContentParams {
  type: string;
  platform: string;
  tone: string;
  operatorName: string;
  context?: string;
}

export async function generateContent({
  type,
  platform,
  tone,
  operatorName,
  context,
}: GenerateContentParams): Promise<string> {
  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a marketing content writer for ${operatorName}, a dumpster rental and roll-off container business. Generate a ${type} for ${platform} in a ${tone} tone.${context ? ` Additional context: ${context}` : ""}\n\nReturn only the content, no explanations.`,
      },
    ],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

interface GenerateInsightParams {
  operatorName: string;
  data: string;
  insightType: string;
}

export async function generateInsight({
  operatorName,
  data,
  insightType,
}: GenerateInsightParams): Promise<{ title: string; body: string; dollarImpact: number | null }> {
  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a business intelligence analyst for ${operatorName}, a dumpster rental operator. Analyze the following ${insightType} data and provide ONE specific, actionable insight.\n\nData:\n${data}\n\nRespond in JSON format:\n{"title": "short headline", "body": "full insight with specific numbers and recommended action", "dollarImpact": estimated dollar impact or null}`,
      },
    ],
  });

  const block = message.content[0];
  const text = block.type === "text" ? block.text : "{}";
  try {
    return JSON.parse(text);
  } catch {
    return { title: "Insight", body: text, dollarImpact: null };
  }
}

interface ClassifyIntentParams {
  message: string;
  customerContext?: string;
}

export async function classifyIntent({
  message,
  customerContext,
}: ClassifyIntentParams): Promise<{ intent: string; confidence: number }> {
  const response = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `Classify the intent of this customer message for a dumpster rental business.\n\nMessage: "${message}"${customerContext ? `\nCustomer context: ${customerContext}` : ""}\n\nValid intents: drop_request, pickup_request, reschedule, complaint, driver_note, other\n\nRespond in JSON: {"intent": "...", "confidence": 0.0-1.0}`,
      },
    ],
  });

  const block = response.content[0];
  const text = block.type === "text" ? block.text : '{"intent":"other","confidence":0.5}';
  try {
    return JSON.parse(text);
  } catch {
    return { intent: "other", confidence: 0.5 };
  }
}
