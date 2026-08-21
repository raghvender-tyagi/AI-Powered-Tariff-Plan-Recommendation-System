const express = require("express");

const env = require("../config/env");
const store = require("../db/store");
const catalog = require("../services/catalogService");
const customerService = require("../services/customerService");
const recommendationService = require("../services/recommendationService");
const comparisonService = require("../services/comparisonService");
const whatIfService = require("../services/whatIfService");
const chatService = require("../services/chatService");
const ragService = require("../services/ragService");
const adminService = require("../services/adminService");
const personaEngine = require("../ml/personaEngine");
const { sign, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/** Wraps an async handler so rejections reach the error middleware. */
const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

// ===============================================================
// Health & meta
// ===============================================================

router.get(
  "/health",
  wrap(async (_req, res) => {
    const plans = catalog.getPlans();

    res.json({
      status: "ok",
      uptimeSeconds: Math.round(process.uptime()),
      env: env.nodeEnv,
      database: store.status(),
      catalogue: { plans: plans.length, clusters: catalog.getClusters().length },
      llm: env.llmEnabled ? "configured" : "not configured (deterministic replies)",
      timestamp: new Date().toISOString()
    });
  })
);

router.get(
  "/model",
  wrap(async (_req, res) => {
    const artifacts = personaEngine.loadArtifacts();

    res.json({
      ...catalog.modelSummary(),
      artifacts: {
        generatedAt: artifacts.generatedAt,
        featureOrder: artifacts.featureOrder,
        preprocessing: artifacts.preprocessing,
        validation: artifacts.validation,
        personas: artifacts.personas
      }
    });
  })
);

// ===============================================================
// Auth
// ===============================================================

router.post(
  "/auth/login",
  wrap(async (req, res) => {
    const { username, password } = req.body || {};

    if (username !== env.adminUsername || password !== env.adminPassword) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    return res.json({
      token: sign({ sub: username, role: "admin" }),
      user: { username, role: "admin" }
    });
  })
);

// ===============================================================
// Plans (the 25-plan catalogue)
// ===============================================================

router.get(
  "/plans",
  wrap(async (req, res) => {
    let plans = catalog.getPlans();

    if (req.query.category) {
      plans = plans.filter(
        (plan) => plan.category.toUpperCase() === String(req.query.category).toUpperCase()
      );
    }

    if (req.query.clusterId !== undefined) {
      plans = plans.filter((plan) => plan.clusterId === Number(req.query.clusterId));
    }

    if (req.query.maxPrice) {
      plans = plans.filter((plan) => plan.price <= Number(req.query.maxPrice));
    }

    res.json(plans);
  })
);

router.get(
  "/plans/search",
  wrap(async (req, res) => {
    const query = String(req.query.q || "").trim();

    if (!query) return res.status(400).json({ error: "Query parameter q is required." });

    res.json({
      query,
      method: "hashed TF-IDF embeddings + cosine similarity",
      results: ragService.similarPlans(query, Number(req.query.limit || 5))
    });
  })
);

router.get(
  "/plans/:id",
  wrap(async (req, res) => {
    const plan = catalog.getPlans().find((item) => item._id === req.params.id);

    if (!plan) return res.status(404).json({ error: `Plan ${req.params.id} not found.` });

    res.json({ ...plan, related: ragService.relatedPlans(plan._id, 4) });
  })
);

router.get(
  "/categories",
  wrap(async (_req, res) => res.json(catalog.getCategories()))
);

// Legacy client alias — the catalogue is a single-operator portfolio,
// so categories are what the UI groups by.
router.get(
  "/operators",
  wrap(async (_req, res) => res.json(catalog.getCategories()))
);

router.post(
  "/plans/compare",
  wrap(async (req, res) => {
    const { planIds, scores } = req.body || {};

    if (!Array.isArray(planIds)) {
      return res.status(400).json({ error: "planIds must be an array of plan ids." });
    }

    res.json(comparisonService.compare(planIds, scores || {}));
  })
);

// ===============================================================
// Clusters / personas
// ===============================================================

router.get("/clusters", wrap(async (_req, res) => res.json(catalog.getClusters())));

router.get(
  "/clusters/:id",
  wrap(async (req, res) => {
    const cluster = catalog
      .getClusters()
      .find((item) => item.clusterLabel === Number(req.params.id));

    if (!cluster) return res.status(404).json({ error: `Cluster ${req.params.id} not found.` });

    res.json({
      ...cluster,
      plans: catalog.getPlans().filter((plan) => plan.clusterId === cluster.clusterLabel)
    });
  })
);

router.get(
  "/clusters/:id/customers",
  wrap(async (req, res) => {
    const customers = await customerService.clusterCustomers(
      Number(req.params.id),
      Number(req.query.limit || 12)
    );
    res.json(customers);
  })
);

// ===============================================================
// Customers
// ===============================================================

router.get(
  "/customers",
  wrap(async (req, res) => {
    res.json(
      await customerService.list(
        Number(req.query.limit || 25),
        req.query.clusterId === undefined ? null : Number(req.query.clusterId)
      )
    );
  })
);

router.post(
  "/customers",
  wrap(async (req, res) => {
    const { profile, name, customerId } = req.body || {};

    if (!profile || typeof profile !== "object") {
      return res.status(400).json({ error: "A profile object is required." });
    }

    const created = await customerService.createFromProfile(profile, { name, customerId });
    res.status(201).json(created);
  })
);

router.get(
  "/customers/:id",
  wrap(async (req, res) => {
    const customer = await customerService.get(req.params.id);

    if (!customer) return res.status(404).json({ error: `Customer ${req.params.id} not found.` });

    res.json(customer);
  })
);

router.get(
  "/customers/:id/usage",
  wrap(async (req, res) => {
    const usage = await customerService.usage(req.params.id);

    if (!usage) return res.status(404).json({ error: `Customer ${req.params.id} not found.` });

    res.json(usage);
  })
);

router.put(
  "/customers/:id/current-plan",
  wrap(async (req, res) => {
    const { planId } = req.body || {};

    if (!planId) return res.status(400).json({ error: "planId is required." });

    res.json(await customerService.setCurrentPlan(req.params.id, planId));
  })
);

router.get(
  "/customers/:id/recommendations",
  wrap(async (req, res) => {
    res.json(await recommendationService.history(req.params.id, Number(req.query.limit || 20)));
  })
);

// ===============================================================
// Recommendations
// ===============================================================

router.post(
  "/recommendations/by-customer/:id",
  wrap(async (req, res) => {
    const payload = await recommendationService.recommendForCustomer(req.params.id, {
      clusterOverride: req.body?.clusterId
    });

    res.json({
      plans: payload.top3,
      ranked: payload.ranked,
      clusterId: payload.clusterId,
      persona: payload.persona,
      cluster: payload.cluster,
      plansEvaluated: payload.plansEvaluated,
      scoringWeights: payload.scoringWeights,
      personaAssignment: payload.personaAssignment,
      recommendationId: payload.recommendationId,
      generatedAt: payload.generatedAt,
      source: payload.source
    });
  })
);

router.post(
  "/recommendations/by-profile",
  wrap(async (req, res) => {
    const profile = req.body?.profile ?? req.body;

    if (!profile || typeof profile !== "object") {
      return res.status(400).json({ error: "A profile object is required." });
    }

    const payload = await recommendationService.recommendForProfile(profile, {
      customerId: req.body?.customerId ?? null,
      source: req.body?.source || "profile"
    });

    res.json({
      plans: payload.top3,
      ranked: payload.ranked,
      clusterId: payload.clusterId,
      persona: payload.persona,
      cluster: payload.cluster,
      plansEvaluated: payload.plansEvaluated,
      scoringWeights: payload.scoringWeights,
      personaAssignment: payload.personaAssignment,
      features: payload.features,
      recommendationId: payload.recommendationId,
      generatedAt: payload.generatedAt,
      source: payload.source
    });
  })
);

router.post(
  "/recommendations/what-if",
  wrap(async (req, res) => {
    const { baselineProfile, customerId, changes, persist } = req.body || {};

    res.json(
      await whatIfService.simulate({
        baselineProfile,
        customerId,
        changes: changes || {},
        persist: persist === true
      })
    );
  })
);

router.get(
  "/recommendations/:id",
  wrap(async (req, res) => {
    const doc = await store.findById("recommendations", req.params.id);

    if (!doc) return res.status(404).json({ error: `Recommendation ${req.params.id} not found.` });

    res.json(doc);
  })
);

// ===============================================================
// Chat / RAG
// ===============================================================

router.post(
  "/chat/start",
  wrap(async (req, res) => res.json(await chatService.start(req.body?.customerId ?? null)))
);

router.post(
  "/chat/message",
  wrap(async (req, res) => {
    const { sessionId, message, customerId } = req.body || {};

    if (!message) return res.status(400).json({ error: "message is required." });

    res.json(await chatService.message(sessionId, message, customerId ?? null));
  })
);

router.get(
  "/chat/:sessionId",
  wrap(async (req, res) => {
    const session = await chatService.getSession(req.params.sessionId);

    if (!session) return res.status(404).json({ error: "Chat session not found." });

    res.json(session);
  })
);

router.post(
  "/rag/ask",
  wrap(async (req, res) => {
    const question = req.body?.question ?? req.body?.q;

    if (!question) return res.status(400).json({ error: "question is required." });

    res.json(await chatService.ask(String(question)));
  })
);

router.get(
  "/rag/search",
  wrap(async (req, res) => {
    const query = String(req.query.q || "").trim();

    if (!query) return res.status(400).json({ error: "Query parameter q is required." });

    res.json({
      query,
      results: ragService.search(query, Number(req.query.limit || 5), req.query.type || null)
    });
  })
);

router.get(
  "/rag/corpus",
  wrap(async (_req, res) => {
    const corpus = ragService.buildCorpus();

    res.json({
      documents: corpus.length,
      byType: corpus.reduce((acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1;
        return acc;
      }, {}),
      embedding: {
        method: "hashed TF-IDF bag of unigrams + bigrams",
        dimensions: ragService.getIndex().dimensions
      },
      items: corpus.map(({ id, type, title, source }) => ({ id, type, title, source }))
    });
  })
);

// ===============================================================
// Admin (JWT protected)
// ===============================================================

router.get("/admin/stats", requireAdmin, wrap(async (_req, res) => res.json(await adminService.stats())));

router.post(
  "/admin/clusters/run",
  requireAdmin,
  wrap(async (req, res) => {
    res.status(202).json(
      await adminService.runClusteringJob({ fullPipeline: req.body?.fullPipeline === true })
    );
  })
);

router.get(
  "/admin/clusters/run/:jobId",
  requireAdmin,
  wrap(async (req, res) => res.json(await adminService.jobStatus(req.params.jobId)))
);

module.exports = router;
