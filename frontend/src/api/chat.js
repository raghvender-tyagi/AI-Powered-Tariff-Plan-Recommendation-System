import { http, callWithFallback, sleep } from './client';
import { getRecommendationsByProfile } from './recommendations';

const GREETING =
  "Hi! I'm your AI tariff advisor. Tell me a bit about how you use your phone — data, calls, texts, budget, roaming — and I'll find the best-fit plans for you. You can also just say \"help me find a plan\" to get started.";

// POST /api/chat/start
export const startChat = (customerId) =>
  callWithFallback(
    () => http.post('/chat/start', { customerId }),
    () => ({ sessionId: `demo_session_${Date.now()}`, reply: GREETING }),
  );

const FIELD_ORDER = ['dataNeed', 'callingNeed', 'budget', 'roamingRequired', 'familyOrIndividual'];
const QUESTIONS = {
  dataNeed: "Roughly how much mobile data do you use a month — low (under 5GB), medium (5–20GB), or high (20GB+)?",
  callingNeed: 'And how much do you talk — low, medium, or a lot of calling?',
  budget: "What's your comfortable monthly budget for a plan, in ₹?",
  roamingRequired: 'Do you need roaming coverage (domestic or international travel)?',
  familyOrIndividual: 'Is this plan just for you, or for the whole family?',
};

const NEED_GB = { low: 3, medium: 12, high: 35 };
const NEED_MIN = { low: 150, medium: 500, high: 1200 };

function extractFromText(text, profile) {
  const t = text.toLowerCase();
  const updated = { ...profile };
  if (!updated.dataNeed) {
    if (/\bhigh\b|lots? of data|stream/.test(t)) updated.dataNeed = 'high';
    else if (/\bmedium\b|moderate/.test(t)) updated.dataNeed = 'medium';
    else if (/\blow\b|little|barely/.test(t)) updated.dataNeed = 'low';
  }
  if (!updated.callingNeed) {
    if (/\ba lot\b|\bhigh\b|talk a lot|calling a lot/.test(t)) updated.callingNeed = 'high';
    else if (/\bmedium\b|moderate/.test(t)) updated.callingNeed = 'medium';
    else if (/\blow\b|barely call|rarely call/.test(t)) updated.callingNeed = 'low';
  }
  if (!updated.budget) {
    const m = t.match(/(\d{2,5})/);
    if (m) updated.budget = Number(m[1]);
  }
  if (updated.roamingRequired === undefined) {
    if (/\byes\b|\bneed roaming\b|travel/.test(t)) updated.roamingRequired = true;
    else if (/\bno\b|don'?t travel|not really/.test(t)) updated.roamingRequired = false;
  }
  if (!updated.familyOrIndividual) {
    if (/family|household|shared/.test(t)) updated.familyOrIndividual = 'family';
    else if (/individual|myself|just me|solo/.test(t)) updated.familyOrIndividual = 'individual';
  }
  return updated;
}

function nextQuestion(profile) {
  const missing = FIELD_ORDER.find((f) => profile[f] === undefined);
  return missing ? QUESTIONS[missing] : null;
}

// POST /api/chat/message  { sessionId, message }
// Demo fallback runs a lightweight local version of the extract_profile
// tool-calling flow described in the plan (section 6.6), entirely client
// side, clearly no substitute for the real Claude-powered service.
export const sendChatMessage = (sessionId, message, priorProfile = {}) =>
  callWithFallback(
    () => http.post('/chat/message', { sessionId, message }),
    async () => {
      await sleep(650);
      const profile = extractFromText(message, priorProfile);
      const question = nextQuestion(profile);
      if (question) {
        return { reply: question, profileComplete: false, profile };
      }
      const finalProfile = {
        dataNeedGB: NEED_GB[profile.dataNeed] ?? 10,
        callNeedMin: NEED_MIN[profile.callingNeed] ?? 400,
        budget: profile.budget ?? 600,
        roamingRequired: !!profile.roamingRequired,
        familyOrIndividual: profile.familyOrIndividual ?? 'individual',
      };
      const { data } = await getRecommendationsByProfile(finalProfile);
      return {
        reply:
          "Great, I've got what I need. Based on your usage I've matched you with these plans — take a look below.",
        profileComplete: true,
        profile: finalProfile,
        plans: data.plans,
      };
    },
  );
