const crypto = require("crypto");

const store = require("../db/store");
const catalog = require("./catalogService");
const personaEngine = require("../ml/personaEngine");

/**
 * Customer profiles. Existing customers come from the Group 1 feature
 * pipeline (cleaned_telecom.csv + customer_features.csv) with the cluster
 * label K-Means assigned in the batch run. New customers are created from
 * the onboarding wizard and assigned a persona by the same model.
 */

/** Shapes a stored customer for the client. */
function toApi(customer) {
  const features = customer.features || {};

  return {
    _id: customer._id,
    customerId: customer.customerId,
    name: customer.name,
    age: customer.age,
    city: customer.city,
    operator: customer.operator,
    networkType: customer.networkType,
    contractType: customer.contractType,
    tenureMonths: customer.tenureMonths,
    monthlySpend: customer.monthlySpend,
    clusterId: customer.clusterId,
    currentPlanId: customer.currentPlanId,
    source: customer.source,
    createdAt: customer.createdAt ?? null,

    usage: {
      dataGB: features.monthly_data_gb ?? null,
      avgDailyDataGB: features.avg_daily_data_gb ?? null,
      streamingHours: features.streaming_hours ?? null,
      hotspotDataGB: features.hotspot_data_gb ?? null,
      callMinutes: features.monthly_voice_minutes ?? null,
      totalCalls: features.total_calls ?? null,
      avgCallMin: features.avg_minutes_per_call ?? null,
      smsCount: features.monthly_sms ?? null,
      internationalMinutes: features.international_minutes ?? null,
      roamingVoiceMinutes: features.roaming_voice_minutes ?? null,
      roamingDataGB: features.roaming_data_gb ?? null,
      monthlyRecharge: features.monthly_recharge ?? null
    },

    features
  };
}

async function get(customerId) {
  const customer = await store.findById("customers", customerId);
  if (!customer) return null;
  return toApi(customer);
}

async function list(limit = 25, clusterId = null) {
  const query = clusterId === null || clusterId === undefined ? {} : { clusterId: Number(clusterId) };
  const docs = await store.find("customers", query, { limit });
  return docs.map(toApi);
}

async function usage(customerId) {
  const customer = await get(customerId);
  return customer ? customer.usage : null;
}

/**
 * Creates a customer from an onboarding profile and assigns a persona with
 * the persisted K-Means model. Imputed features are returned so the client
 * can show exactly what was inferred rather than measured.
 */
async function createFromProfile(profile = {}, options = {}) {
  const persona = personaEngine.profileToPersona(profile);
  const id = options.customerId || `CUSTNEW_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const doc = {
    _id: id,
    customerId: id,
    name: options.name || profile.name || "New customer",
    age: profile.age ?? null,
    city: profile.city ?? "",
    operator: profile.operator ?? "",
    networkType: profile.networkType ?? "",
    contractType: profile.familyOrIndividual === "family" ? "Family" : "Individual",
    tenureMonths: persona.features.tenure_months,
    monthlySpend: persona.features.monthly_recharge,
    churn: 0,
    clusterId: persona.clusterId,
    currentPlanId: options.currentPlanId ?? null,
    features: persona.features,
    source: options.source || "onboarding",
    createdAt: new Date().toISOString()
  };

  await store.upsert("customers", doc);

  return {
    customer: toApi(doc),
    personaAssignment: {
      clusterId: persona.clusterId,
      persona: persona.persona,
      confidence: persona.confidence,
      distances: persona.distances,
      imputedFeatures: persona.imputedFeatures,
      providedFeatures: persona.providedFeatures,
      pca: personaEngine.projectToPca(persona.vector)
    }
  };
}

async function setCurrentPlan(customerId, planId) {
  const plan = catalog.getPlans().find((item) => item._id === planId);

  if (!plan) {
    const error = new Error(`Plan ${planId} is not in the 25-plan catalogue.`);
    error.status = 404;
    throw error;
  }

  const updated = await store.updateById("customers", customerId, { currentPlanId: planId });

  if (!updated) {
    const error = new Error(`Customer ${customerId} not found.`);
    error.status = 404;
    throw error;
  }

  return toApi(updated);
}

async function clusterCustomers(clusterId, limit = 12) {
  return list(limit, clusterId);
}

module.exports = {
  toApi,
  get,
  list,
  usage,
  createFromProfile,
  setCurrentPlan,
  clusterCustomers
};
