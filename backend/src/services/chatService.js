const crypto = require("crypto");

const store = require("../db/store");
const rag = require("./ragService");
const llm = require("./llmService");
const recommendationService = require("./recommendationService");
const personaEngine = require("../ml/personaEngine");

/**
 * Conversational advisor.
 *
 * Two jobs:
 *   1. Slot-filling — collect the profile fields the recommendation engine
 *      needs (data, calling, budget, roaming, individual/family).
 *   2. Question answering — anything else is answered by RAG over the
 *      project's own knowledge base.
 *
 * When the profile is complete the advisor calls the SAME recommendation
 * service every other surface uses, so the plans it shows are the engine's
 * Top 3 — the chatbot never ranks anything itself.
 */

const GREETING =
  "Hi! I'm your AI tariff advisor. Tell me how you use your phone — data, calls, budget, roaming — " +
  "and I'll match you against all 25 plans. You can also ask me things like " +
  '"which plans suit heavy streaming?" or "how are the recommendations scored?"';

const FIELD_ORDER = [
  "dataNeed",
  "callingNeed",
  "budget",
  "roamingRequired",
  "familyOrIndividual"
];

const QUESTIONS = {
  dataNeed:
    "Roughly how much mobile data do you use a month — light (under 5GB), moderate (5-20GB) or heavy (20GB+)?",
  callingNeed: "And how much do you talk on calls — light, moderate or heavy?",
  budget: "What's a comfortable monthly budget for your plan, in rupees?",
  roamingRequired: "Do you need roaming coverage (domestic or international travel)?",
  familyOrIndividual: "Last one — is this plan just for you, or for the whole family?"
};

const QUESTION_PATTERN =
  /\?|^(what|which|how|why|who|when|where|tell me|explain|compare|does|do|is|are|can)\b/i;

// ---------------------------------------------------------------
// Slot extraction
// ---------------------------------------------------------------

function extractProfile(text, prior = {}) {
  const lower = String(text || "").toLowerCase();
  const updated = { ...prior };

  if (updated.dataNeed === undefined) {
    if (/\bheavy\b|\bhigh\b|lots? of data|stream|gaming|hotspot|20\s*gb|\b[3-9]\d\s*gb/.test(lower))
      updated.dataNeed = "high";
    else if (/\bmoderate\b|\bmedium\b|average|normal/.test(lower)) updated.dataNeed = "medium";
    else if (/\blight\b|\blow\b|little|barely|hardly|minimal/.test(lower)) updated.dataNeed = "low";
  }

  if (updated.callingNeed === undefined) {
    if (/(talk|call)\w*\s+(a lot|lots|heavily)|heavy call|lots? of call|always on call/.test(lower))
      updated.callingNeed = "high";
    else if (/rarely call|barely call|hardly call|few calls|don'?t call/.test(lower))
      updated.callingNeed = "low";
    else if (/some calls|moderate call|average call/.test(lower)) updated.callingNeed = "medium";
  }

  if (updated.budget === undefined) {
    const match = lower.match(/(?:rs\.?|₹|inr|under|below|around|about|budget of)\s*(\d{2,5})/) ||
      lower.match(/(\d{2,5})\s*(?:rs|rupees|₹|inr|per month|a month|monthly)/);
    if (match) updated.budget = Number(match[1]);
  }

  if (updated.roamingRequired === undefined) {
    if (/\b(no|not|don'?t|never)\b[^.]*\b(roam|travel|abroad)/.test(lower))
      updated.roamingRequired = false;
    else if (/roam|travel|abroad|international|overseas/.test(lower))
      updated.roamingRequired = true;
  }

  if (updated.familyOrIndividual === undefined) {
    if (/family|household|shared|wife|husband|kids|children|parents|members/.test(lower))
      updated.familyOrIndividual = "family";
    else if (/individual|myself|just me|only me|solo|personal/.test(lower))
      updated.familyOrIndividual = "individual";
  }

  return updated;
}

/** A bare answer to the question we just asked ("yes", "low", "600"). */
function extractDirectAnswer(text, pendingField, profile) {
  const lower = String(text || "").trim().toLowerCase();
  const updated = { ...profile };

  if (!pendingField || updated[pendingField] !== undefined) return updated;

  if (pendingField === "budget") {
    const match = lower.match(/(\d{2,5})/);
    if (match) updated.budget = Number(match[1]);
    return updated;
  }

  if (pendingField === "roamingRequired") {
    if (/^(yes|yeah|yep|sure|ha|haan|y)\b/.test(lower)) updated.roamingRequired = true;
    else if (/^(no|nope|nah|nahi|n)\b/.test(lower)) updated.roamingRequired = false;
    return updated;
  }

  if (pendingField === "familyOrIndividual") {
    if (/famil|shared|household/.test(lower)) updated.familyOrIndividual = "family";
    else if (/me|myself|individual|self|solo|personal|single/.test(lower))
      updated.familyOrIndividual = "individual";
    return updated;
  }

  // dataNeed / callingNeed
  if (/^(high|heavy|a lot|lot|much)\b/.test(lower)) updated[pendingField] = "high";
  else if (/^(medium|moderate|average|mid|normal|ok|okay)\b/.test(lower))
    updated[pendingField] = "medium";
  else if (/^(low|light|little|less|minimal|few)\b/.test(lower)) updated[pendingField] = "low";

  return updated;
}

function missingField(profile) {
  return FIELD_ORDER.find((field) => profile[field] === undefined) ?? null;
}

/** Chat slots -> the profile shape the recommendation service accepts. */
function toRecommendationProfile(profile) {
  return {
    dataNeed: profile.dataNeed,
    callingNeed: profile.callingNeed,
    smsNeed: profile.smsNeed,
    budget: profile.budget,
    roamingRequired: profile.roamingRequired,
    familyOrIndividual: profile.familyOrIndividual
  };
}

// ---------------------------------------------------------------
// Session handling
// ---------------------------------------------------------------

async function start(customerId = null) {
  const session = {
    _id: `chat_${crypto.randomUUID()}`,
    customerId,
    profile: {},
    messages: [{ role: "assistant", content: GREETING, at: new Date().toISOString() }],
    complete: false,
    lastRecommendationId: null
  };

  await store.upsert("chatSessions", session);

  return { sessionId: session._id, reply: GREETING };
}

function summariseTop3(payload) {
  return payload.top3
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.plan.planName} (Rs ${entry.plan.price}, ${entry.plan.dailyDataGb} GB/day, ` +
        `${entry.plan.validityDays} days) - ${entry.matchPercent}% match. ${entry.explanation}`
    )
    .join("\n");
}

async function message(sessionId, text, customerId = null) {
  let session = sessionId ? await store.findById("chatSessions", sessionId) : null;

  if (!session) {
    const created = await start(customerId);
    session = await store.findById("chatSessions", created.sessionId);
  }

  const userMessage = String(text || "").trim();

  if (!userMessage) {
    const error = new Error("A chat message cannot be empty.");
    error.status = 400;
    throw error;
  }

  session.messages.push({ role: "user", content: userMessage, at: new Date().toISOString() });

  const pending = missingField(session.profile);

  let profile = extractProfile(userMessage, session.profile);
  profile = extractDirectAnswer(userMessage, pending, profile);
  session.profile = profile;

  const stillMissing = missingField(profile);
  const isQuestion = QUESTION_PATTERN.test(userMessage);

  let reply;
  let plans = null;
  let sources = [];
  let recommendation = null;

  // ---- knowledge question -> RAG ------------------------------------
  if (isQuestion && (stillMissing || session.complete)) {
    const retrieved = rag.answer(userMessage, 4);
    sources = retrieved.passages;

    const polished = await llm.complete(
      userMessage,
      retrieved.answer,
      session.messages.slice(0, -1)
    );

    reply = polished || retrieved.answer;

    if (stillMissing) {
      reply += `\n\n${QUESTIONS[stillMissing]}`;
    }
  } else if (stillMissing) {
    // ---- keep slot-filling -----------------------------------------
    const acknowledged = pending && profile[pending] !== undefined;
    const prefix = acknowledged ? "Got it. " : "";
    reply = `${prefix}${QUESTIONS[stillMissing]}`;
  } else {
    // ---- profile complete -> the engine ranks --------------------------
    recommendation = await recommendationService.recommendForProfile(
      toRecommendationProfile(profile),
      { customerId: session.customerId, source: "chat_profile" }
    );

    plans = recommendation.top3;
    session.lastRecommendationId = recommendation.recommendationId;
    session.complete = true;

    const retrieved = rag.answer(
      `${profile.dataNeed} data ${profile.callingNeed} calling budget ${profile.budget} ${
        profile.familyOrIndividual
      } plan`,
      3
    );
    sources = retrieved.passages;

    const factSheet =
      `Persona assigned by K-Means: ${recommendation.persona} (cluster ${recommendation.clusterId}).\n` +
      `Plans evaluated: ${recommendation.plansEvaluated}.\n` +
      `Top 3 from the recommendation engine:\n${summariseTop3(recommendation)}`;

    const polished = await llm.complete(
      `Present these recommendations to me. My profile: ${JSON.stringify(profile)}`,
      factSheet,
      session.messages.slice(0, -1)
    );

    reply =
      polished ||
      `Based on your profile the model puts you in the "${recommendation.persona}" segment, ` +
        `and the engine scored all ${recommendation.plansEvaluated} plans for you. ` +
        `Your best match is ${plans[0].plan.planName} at ${plans[0].matchPercent}%. ` +
        `Here are the top 3 — open "Why this plan?" on any card for the full score breakdown.`;
  }

  session.messages.push({ role: "assistant", content: reply, at: new Date().toISOString() });
  await store.upsert("chatSessions", session);

  const answered = FIELD_ORDER.filter((field) => profile[field] !== undefined).length;

  return {
    sessionId: session._id,
    reply,
    profile,
    profileComplete: !stillMissing,
    progress: Math.round((answered / FIELD_ORDER.length) * 100),
    plans,
    sources,
    llm: llm.enabled(),
    recommendationId: recommendation?.recommendationId ?? null,
    personaAssignment: recommendation?.personaAssignment ?? null
  };
}

async function getSession(sessionId) {
  return store.findById("chatSessions", sessionId);
}

/** Standalone RAG endpoint (no slot filling). */
async function ask(question) {
  const retrieved = rag.answer(question, 4);
  const polished = await llm.complete(question, retrieved.answer);

  return {
    question,
    answer: polished || retrieved.answer,
    grounded: retrieved.grounded,
    sources: retrieved.passages,
    llm: llm.enabled()
  };
}

module.exports = {
  start,
  message,
  getSession,
  ask,
  extractProfile,
  FIELD_ORDER,
  GREETING,
  personaEngine
};
