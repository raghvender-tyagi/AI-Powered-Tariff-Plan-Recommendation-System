const crypto = require("crypto");

const env = require("../config/env");
const store = require("../db/store");
const catalog = require("./catalogService");
const personaEngine = require("../ml/personaEngine");
const { explain } = require("./explanationService");

// The existing Group 2 engine — the single source of truth for scoring
// and ranking. Nothing in this file re-implements or overrides it.
const RecommendationEngine = require(env.paths.recommendationEngine);

const engine = new RecommendationEngine();

/**
 * Maps an API profile onto the exact customer record the engine expects.
 * The engine reads: monthly_data_gb, streaming_hours, monthly_voice_minutes,
 * monthly_recharge (or budget) and customer_id.
 */
function toEngineCustomer(features, customerId) {
  return {
    customer_id: customerId || null,
    monthly_data_gb: features.monthly_data_gb,
    streaming_hours: features.streaming_hours,
    monthly_voice_minutes: features.monthly_voice_minutes,
    monthly_recharge: features.monthly_recharge
  };
}

function decorate(scoredRows, engineCustomer, cluster, planById) {
  return scoredRows.map((row, index) => {
    const plan = planById.get(row.planId);

    if (!plan) {
      throw new Error(`Plan ${row.planId} is missing from the catalogue.`);
    }

    const explanation = explain(plan, row, engineCustomer, cluster);

    return {
      planId: row.planId,
      rank: index + 1,
      plan,
      // The engine's score is already on a 0-100 scale.
      score: Number((row.score / 100).toFixed(4)),
      matchPercent: Math.round(row.score),
      rawScore: row.score,
      breakdown: {
        usageFit: Math.round(row.usageFit),
        budgetFit: Math.round(row.budgetFit),
        personaMatch: Math.round(row.personaMatch)
      },
      explanation: explanation.summary,
      explanationDetail: explanation
    };
  });
}

/**
 * Core path. Everything (new user, existing customer, chat, what-if)
 * funnels through here so ranking can only ever come from one place.
 */
function rank({ features, clusterId, customerId = null }) {
  const clusters = catalog.getClusters();
  const cluster = clusters.find((item) => item.clusterLabel === Number(clusterId));

  if (!cluster) {
    throw new Error(`Cluster ${clusterId} not found in cluster profiles.`);
  }

  const planById = new Map(catalog.getPlans().map((plan) => [plan._id, plan]));
  const engineCustomer = toEngineCustomer(features, customerId);

  const result = engine.recommend(engineCustomer, clusterId);

  const ranked = decorate(result.ranked, engineCustomer, cluster, planById);

  return {
    customerId: result.customerId,
    clusterId: result.clusterId,
    persona: result.persona,
    plansEvaluated: result.plansEvaluated,
    scoringWeights: result.scoringWeights,
    cluster,
    top3: ranked.slice(0, 3),
    ranked
  };
}

async function persist(record) {
  const doc = {
    _id: record._id || `rec_${crypto.randomUUID()}`,
    customerId: record.customerId ?? null,
    source: record.source,
    clusterId: record.clusterId,
    persona: record.persona,
    profile: record.profile ?? {},
    plansEvaluated: record.plansEvaluated,
    recommendedPlans: record.top3.map((entry) => ({
      planId: entry.planId,
      rank: entry.rank,
      score: entry.score,
      matchPercent: entry.matchPercent,
      breakdown: entry.breakdown
    })),
    generatedAt: new Date().toISOString()
  };

  await store.upsert("recommendations", doc);
  return doc;
}

/**
 * NEW USER: profile from onboarding / advisor -> K-Means persona -> engine.
 */
async function recommendForProfile(profile = {}, options = {}) {
  const persona = personaEngine.profileToPersona(profile);
  const clusterId = profile.clusterId ?? profile.clusterOverride ?? persona.clusterId;

  const result = rank({
    features: persona.features,
    clusterId,
    customerId: options.customerId ?? null
  });

  const payload = {
    ...result,
    profile,
    features: persona.features,
    personaAssignment: {
      clusterId: persona.clusterId,
      persona: persona.persona,
      confidence: persona.confidence,
      distances: persona.distances,
      imputedFeatures: persona.imputedFeatures,
      providedFeatures: persona.providedFeatures,
      method: "nearest centroid on the persisted K-Means (k=2) model",
      pca: personaEngine.projectToPca(persona.vector)
    },
    source: options.source || "profile"
  };

  if (options.persist !== false) {
    const saved = await persist({
      customerId: options.customerId ?? null,
      source: payload.source,
      clusterId: result.clusterId,
      persona: result.persona,
      profile,
      plansEvaluated: result.plansEvaluated,
      top3: result.top3
    });
    payload.recommendationId = saved._id;
    payload.generatedAt = saved.generatedAt;
  }

  return payload;
}

/**
 * EXISTING CUSTOMER: uses the cluster label K-Means already assigned in the
 * batch run, and the customer's real engineered features.
 */
async function recommendForCustomer(customerId, options = {}) {
  const customer = await store.findById("customers", customerId);

  if (!customer) {
    const error = new Error(`Customer ${customerId} not found.`);
    error.status = 404;
    throw error;
  }

  const features = customer.features || {};
  const clusterId = options.clusterOverride ?? customer.clusterId;

  if (clusterId === null || clusterId === undefined) {
    const error = new Error(
      `Customer ${customerId} has no cluster assignment. Run the clustering job first.`
    );
    error.status = 409;
    throw error;
  }

  const result = rank({ features, clusterId, customerId });

  const payload = {
    ...result,
    customer,
    features,
    personaAssignment: {
      clusterId: Number(clusterId),
      persona: result.persona,
      confidence: 1,
      method: "batch K-Means label from customer_clusters.csv",
      imputedFeatures: [],
      providedFeatures: Object.keys(features)
    },
    source: options.source || "cluster"
  };

  if (options.persist !== false) {
    const saved = await persist({
      customerId,
      source: payload.source,
      clusterId: result.clusterId,
      persona: result.persona,
      profile: { derivedFrom: "customer_features.csv" },
      plansEvaluated: result.plansEvaluated,
      top3: result.top3
    });
    payload.recommendationId = saved._id;
    payload.generatedAt = saved.generatedAt;
  }

  return payload;
}

async function history(customerId, limit = 20) {
  const docs = await store.find(
    "recommendations",
    { customerId },
    { sort: { generatedAt: -1 }, limit }
  );
  return docs;
}

module.exports = {
  engine,
  rank,
  toEngineCustomer,
  recommendForProfile,
  recommendForCustomer,
  history
};
