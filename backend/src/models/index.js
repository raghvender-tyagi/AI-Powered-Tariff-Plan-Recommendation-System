const mongoose = require("mongoose");

const { Schema } = mongoose;

/**
 * Mongoose schemas for the five collections the application persists.
 * The 25-plan catalogue, the cluster profiles and the plan -> cluster
 * mapping all originate from clustering_model/data/processed and are
 * mirrored here so the API can be queried like a normal MERN backend.
 */

const planSchema = new Schema(
  {
    _id: { type: String, required: true }, // e.g. "FLEX_1" (catalogue plan id)
    planName: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    validityDays: { type: Number, required: true },
    differentiator: { type: String },

    // Allowance shape as published in plan_catalog.json
    allowanceType: { type: String, required: true }, // personal | shared_pool | business_pool
    dailyDataGb: { type: Number, required: true },
    monthlyDataGb: { type: Number, required: true }, // dailyDataGb * 30 (derived)
    dataGB: { type: Number }, // alias of monthlyDataGb for the client plan shape
    members: { type: Number, default: null },
    employees: { type: Number, default: null },

    // Presentation + relative tiers derived from the catalogue's distribution
    planId: { type: String },
    categoryLabel: { type: String },
    categoryColor: { type: String },
    priceTier: { type: String },
    dataTier: { type: String },
    pricePerGb: { type: Number, default: null },
    personaCustomerCount: { type: Number, default: 0 },
    personaCustomerPercentage: { type: Number, default: 0 },

    // Group 2 plan -> cluster mapping
    clusterId: { type: Number, required: true },
    clusterIds: { type: [Number], default: [] },
    persona: { type: String, required: true },

    benefits: { type: [String], default: [] },
    searchText: { type: String, default: "" },
    // Sparse TF-IDF embedding: [[term, weight], ...] from embeddingService.
    embedding: { type: [Schema.Types.Mixed], default: [] }
  },
  { timestamps: true, _id: false }
);

const clusterSchema = new Schema(
  {
    _id: { type: Number, required: true }, // cluster label from K-Means
    clusterLabel: { type: Number, required: true },
    personaName: { type: String, required: true },
    description: { type: String, default: "" },
    customerCount: { type: Number, default: 0 },
    customerPercentage: { type: Number, default: 0 },
    centroid: { type: [Number], default: [] },
    averages: { type: Schema.Types.Mixed, default: {} },
    traits: { type: Schema.Types.Mixed, default: {} },
    color: { type: String, default: "#60a5fa" }
  },
  { timestamps: true, _id: false }
);

const customerSchema = new Schema(
  {
    _id: { type: String, required: true }, // e.g. "CUST00001"
    customerId: { type: String, required: true },
    name: { type: String, default: "" },
    age: { type: Number, default: null },
    city: { type: String, default: "" },
    operator: { type: String, default: "" },
    networkType: { type: String, default: "" },
    contractType: { type: String, default: "" },
    tenureMonths: { type: Number, default: 0 },
    monthlySpend: { type: Number, default: 0 },
    churn: { type: Number, default: 0 },

    clusterId: { type: Number, default: null },
    currentPlanId: { type: String, default: null },

    // Raw + derived usage exactly as produced by the Group 1 pipeline
    features: { type: Schema.Types.Mixed, default: {} },

    source: { type: String, default: "dataset" } // dataset | onboarding | chat
  },
  { timestamps: true, _id: false }
);

const recommendationSchema = new Schema(
  {
    _id: { type: String, required: true },
    customerId: { type: String, default: null },
    source: { type: String, default: "cluster" }, // cluster | profile | chat_profile | what_if
    clusterId: { type: Number, default: null },
    persona: { type: String, default: "" },
    profile: { type: Schema.Types.Mixed, default: {} },
    plansEvaluated: { type: Number, default: 0 },
    recommendedPlans: { type: [Schema.Types.Mixed], default: [] },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, _id: false }
);

const chatSessionSchema = new Schema(
  {
    _id: { type: String, required: true },
    customerId: { type: String, default: null },
    profile: { type: Schema.Types.Mixed, default: {} },
    messages: { type: [Schema.Types.Mixed], default: [] },
    lastRecommendationId: { type: String, default: null },
    complete: { type: Boolean, default: false }
  },
  { timestamps: true, _id: false }
);

const jobSchema = new Schema(
  {
    _id: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, default: "queued" }, // queued | running | success | failed
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null }
  },
  { timestamps: true, _id: false }
);

const COLLECTIONS = {
  plans: planSchema,
  clusters: clusterSchema,
  customers: customerSchema,
  recommendations: recommendationSchema,
  chatSessions: chatSessionSchema,
  jobs: jobSchema
};

const models = {};

function getModel(name) {
  if (!models[name]) {
    models[name] =
      mongoose.models[name] || mongoose.model(name, COLLECTIONS[name], name);
  }
  return models[name];
}

module.exports = { COLLECTIONS, getModel };
