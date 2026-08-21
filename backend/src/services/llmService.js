const env = require("../config/env");

/**
 * Optional LLM polish for the advisor.
 *
 * The application is fully functional without it: when no API key is
 * configured, callers fall back to the deterministic, retrieval-grounded
 * reply. When a key IS configured the model is only ever asked to rephrase
 * facts it is given — it is never allowed to invent plans, prices or scores,
 * and it never influences ranking.
 */

const SYSTEM_PROMPT = `You are the tariff advisor for the SmartTariff AI recommendation system.

Hard rules:
- Use ONLY the facts inside the CONTEXT block. Never invent a plan, a price, a data allowance or a statistic.
- The Top 3 recommendations and their match scores are produced by the recommendation engine. Report them exactly as given; never reorder them and never substitute a different plan.
- If the context does not answer the question, say so plainly and offer what the catalogue does cover.
- Be concise and friendly. Two to four short sentences unless listing plans.
- Reply in the same language style the user writes in (English / Hindi / Hinglish).`;

async function complete(userMessage, context, history = []) {
  if (!env.llmEnabled) return null;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: `CONTEXT\n${context}` },
    ...history.slice(-6).map((entry) => ({
      role: entry.role === "assistant" ? "assistant" : "user",
      content: entry.content
    })),
    { role: "user", content: userMessage }
  ];

  try {
    const response = await fetch(`${env.openAiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiKey}`
      },
      body: JSON.stringify({
        model: env.chatModel,
        temperature: 0.3,
        max_tokens: 400,
        messages
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      console.warn(`[llm] ${response.status} ${response.statusText} — falling back to grounded reply.`);
      return null;
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (error) {
    console.warn(`[llm] request failed (${error.message}) — falling back to grounded reply.`);
    return null;
  }
}

module.exports = { complete, enabled: () => env.llmEnabled };
