/**
 * In-process integration test of the full recommendation chain, with no
 * HTTP server involved:
 *
 *   Customer/Profile -> ML persona -> 25 plans -> recommendation engine
 *   -> Top 3 -> explanation, plus comparison, embeddings/RAG and What-If.
 */

const assert = require("assert");

const store = require("../db/store");
const catalog = require("../services/catalogService");
const personaEngine = require("../ml/personaEngine");
const recommendationService = require("../services/recommendationService");
const comparisonService = require("../services/comparisonService");
const whatIfService = require("../services/whatIfService");
const ragService = require("../services/ragService");
const chatService = require("../services/chatService");
const customerService = require("../services/customerService");

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
    console.error(`FAIL  ${name} — ${error.message}`);
  }
}

async function main() {
  await store.connect();

  console.log("========================================");
  console.log("     END-TO-END RECOMMENDATION FLOW");
  console.log("========================================");
  console.log("Database:", store.status().driver);
  console.log("");

  // ---- catalogue ---------------------------------------------------
  await check("Catalogue holds exactly 25 plans", async () => {
    const plans = catalog.getPlans();
    assert.strictEqual(plans.length, 25);
    const ids = new Set(plans.map((plan) => plan._id));
    assert.strictEqual(ids.size, 25, "plan ids are not unique");
    return `${plans.length} plans, ${new Set(plans.map((p) => p.category)).size} categories`;
  });

  await check("Every plan is mapped to a cluster", async () => {
    const plans = catalog.getPlans();
    const clusterIds = new Set(catalog.getClusters().map((c) => c.clusterLabel));
    for (const plan of plans) {
      assert.ok(
        clusterIds.has(plan.clusterId),
        `${plan._id} maps to unknown cluster ${plan.clusterId}`
      );
      assert.ok(plan.persona, `${plan._id} has no persona`);
    }
    return `${plans.length}/25 mapped across ${clusterIds.size} clusters`;
  });

  // ---- ML model ----------------------------------------------------
  await check("K-Means artefacts load and validate", async () => {
    const artifacts = personaEngine.loadArtifacts();
    assert.strictEqual(artifacts.featureOrder.length, 11);
    assert.strictEqual(artifacts.clusterCount, 2);
    assert.ok(artifacts.validation.normalizationVerified);
    assert.ok(artifacts.validation.nearestCentroidAgreement > 0.99);
    return `k=${artifacts.clusterCount}, agreement ${(artifacts.validation.nearestCentroidAgreement * 100).toFixed(2)}%`;
  });

  await check("New-user profile is assigned a persona", async () => {
    const heavy = personaEngine.profileToPersona({
      dataNeed: "high",
      callingNeed: "low",
      budget: 900,
      roamingRequired: true,
      familyOrIndividual: "individual"
    });

    const light = personaEngine.profileToPersona({
      dataNeed: "low",
      callingNeed: "medium",
      budget: 200,
      roamingRequired: false,
      familyOrIndividual: "individual"
    });

    assert.ok(heavy.persona, "heavy user got no persona");
    assert.ok(light.persona, "light user got no persona");
    assert.notStrictEqual(
      heavy.clusterId,
      light.clusterId,
      "a heavy-data and a light user landed in the same cluster"
    );
    assert.ok(heavy.imputedFeatures.length > 0, "imputed features were not reported");

    return `heavy -> ${heavy.persona} (c${heavy.clusterId}), light -> ${light.persona} (c${light.clusterId})`;
  });

  // ---- existing customer -------------------------------------------
  let customerPayload = null;

  await check("Existing customer: DB -> persona -> engine -> Top 3", async () => {
    const customers = await store.find("customers", {}, { limit: 1 });
    assert.ok(customers.length > 0, "no customers seeded — run npm run seed");

    customerPayload = await recommendationService.recommendForCustomer(customers[0]._id);

    assert.strictEqual(customerPayload.plansEvaluated, 25);
    assert.strictEqual(customerPayload.top3.length, 3);
    assert.strictEqual(customerPayload.ranked.length, 25);
    assert.strictEqual(customerPayload.clusterId, customers[0].clusterId);

    for (let i = 1; i < customerPayload.ranked.length; i++) {
      assert.ok(
        customerPayload.ranked[i - 1].rawScore >= customerPayload.ranked[i].rawScore,
        "ranking is not sorted by score"
      );
    }

    return `${customers[0]._id} -> ${customerPayload.persona} -> ${customerPayload.top3
      .map((entry) => `${entry.plan.planName} ${entry.matchPercent}%`)
      .join(", ")}`;
  });

  await check("Top 3 matches the engine's own output exactly", async () => {
    const customers = await store.find("customers", {}, { limit: 1 });
    const customer = customers[0];

    const raw = recommendationService.engine.recommend(
      recommendationService.toEngineCustomer(customer.features, customer._id),
      customer.clusterId
    );

    assert.deepStrictEqual(
      customerPayload.top3.map((entry) => entry.planId),
      raw.top3.map((entry) => entry.planId),
      "API Top 3 diverges from the engine Top 3"
    );

    customerPayload.top3.forEach((entry, index) => {
      assert.strictEqual(
        entry.rawScore,
        raw.top3[index].score,
        `score mismatch on ${entry.planId}`
      );
    });

    return `engine and API agree on ${raw.top3.map((e) => e.planId).join(", ")}`;
  });

  await check("Every recommendation carries an explanation", async () => {
    for (const entry of customerPayload.top3) {
      assert.ok(entry.explanation && entry.explanation.length > 40, "explanation missing");
      assert.strictEqual(entry.explanationDetail.reasons.length, 3);

      const recomputed =
        entry.explanationDetail.contributions.reduce((sum, c) => sum + c.contribution, 0);

      assert.ok(
        Math.abs(recomputed - entry.rawScore) < 0.75,
        `explanation contributions (${recomputed.toFixed(2)}) do not reconstruct the engine score (${entry.rawScore})`
      );
    }
    return "explanations reconstruct the engine score from its own weights";
  });

  // ---- new user path -----------------------------------------------
  let profilePayload = null;

  await check("New user: profile -> persona -> engine -> Top 3", async () => {
    profilePayload = await recommendationService.recommendForProfile({
      dataNeed: "high",
      callingNeed: "medium",
      budget: 800,
      roamingRequired: false,
      familyOrIndividual: "individual"
    });

    assert.strictEqual(profilePayload.plansEvaluated, 25);
    assert.strictEqual(profilePayload.top3.length, 3);
    assert.ok(profilePayload.personaAssignment.imputedFeatures.length > 0);
    assert.ok(profilePayload.recommendationId, "recommendation was not persisted");

    return `${profilePayload.persona} -> ${profilePayload.top3
      .map((entry) => entry.plan.planName)
      .join(", ")}`;
  });

  await check("Recommendation history persists", async () => {
    const created = await customerService.createFromProfile({
      dataNeed: "medium",
      callingNeed: "high",
      budget: 500,
      roamingRequired: false
    });

    await recommendationService.recommendForProfile(
      { dataNeed: "medium", callingNeed: "high", budget: 500, roamingRequired: false },
      { customerId: created.customer._id, source: "onboarding" }
    );

    const history = await recommendationService.history(created.customer._id);
    assert.ok(history.length >= 1, "no history rows written");
    assert.strictEqual(history[0].recommendedPlans.length, 3);

    return `${created.customer._id} -> ${history.length} stored recommendation(s)`;
  });

  // ---- comparison ---------------------------------------------------
  await check("Plan comparison works on engine scores", async () => {
    const ids = customerPayload.top3.map((entry) => entry.planId);
    const scores = Object.fromEntries(
      customerPayload.top3.map((entry) => [entry.planId, entry.matchPercent])
    );

    const comparison = comparisonService.compare(ids, scores);

    assert.strictEqual(comparison.plans.length, 3);
    assert.ok(comparison.rows.length > 5);

    const overall = comparison.verdicts.find((v) => v.key === "overall");
    assert.ok(overall, "no overall verdict");
    assert.strictEqual(
      overall.planId,
      customerPayload.top3[0].planId,
      "comparison disagrees with the engine's #1 plan"
    );

    return `${comparison.plans.length} plans, ${comparison.verdicts.length} verdicts, winner ${overall.planName}`;
  });

  // ---- embeddings / RAG ---------------------------------------------
  await check("Embeddings + semantic plan search", async () => {
    const results = ragService.similarPlans("cheap plan for a light user on a tight budget", 3);
    assert.strictEqual(results.length, 3);
    assert.ok(results[0].similarity > 0, "top result has no similarity");

    const family = ragService.similarPlans("shared data for a family of five", 3);
    assert.ok(
      family.some((item) => item.planId.startsWith("FAMILY")),
      `family query returned ${family.map((f) => f.planId).join(", ")}`
    );

    return `budget -> ${results[0].planName}, family -> ${family[0].planName}`;
  });

  await check("RAG answers are grounded in project artefacts", async () => {
    const answer = ragService.answer("How were the customer clusters chosen?");
    assert.ok(answer.grounded, "answer was not grounded");
    assert.ok(answer.passages.length > 0, "no passages cited");
    assert.ok(
      /silhouette|K-Means/i.test(answer.answer),
      "answer does not reference the real clustering method"
    );

    const nonsense = ragService.answer("zxqv wibble frobnicate");
    assert.strictEqual(nonsense.grounded, false, "nonsense query was answered as grounded");

    return `${answer.passages.length} passages cited from ${answer.passages
      .map((p) => p.source)
      .join(", ")}`;
  });

  // ---- chatbot -------------------------------------------------------
  await check("Chatbot slot-filling ends in engine-ranked plans", async () => {
    const session = await chatService.start(null);
    assert.ok(session.sessionId);

    const turns = [
      "I use a lot of data and stream every day",
      "I rarely call anyone",
      "my budget is around 700 rupees",
      "no, I do not travel",
      "just for me"
    ];

    let last = null;

    for (const turn of turns) {
      last = await chatService.message(session.sessionId, turn);
    }

    assert.ok(last.profileComplete, `profile incomplete: ${JSON.stringify(last.profile)}`);
    assert.ok(Array.isArray(last.plans) && last.plans.length === 3, "chatbot returned no Top 3");
    assert.ok(last.recommendationId, "chat recommendation was not persisted");

    return `${last.plans.map((entry) => entry.plan.planName).join(", ")} (${last.personaAssignment.persona})`;
  });

  await check("Chatbot answers knowledge questions via RAG", async () => {
    const session = await chatService.start(null);
    const reply = await chatService.message(session.sessionId, "How are the plans scored?");

    assert.ok(reply.sources.length > 0, "no RAG sources returned");
    assert.ok(
      /usageFit|0\.40|budgetFit/i.test(reply.reply),
      "reply does not describe the real scoring formula"
    );

    return `cited ${reply.sources.length} sources`;
  });

  // ---- what-if --------------------------------------------------------
  await check("What-If re-runs the same engine and reports impact", async () => {
    const simulation = await whatIfService.simulate({
      baselineProfile: {
        dataNeedGB: 6,
        callNeedMin: 230,
        budget: 380,
        roamingRequired: false,
        tenureMonths: 50
      },
      changes: { dataNeedGB: 45, budget: 900 }
    });

    assert.strictEqual(simulation.baseline.top3.length, 3);
    assert.strictEqual(simulation.simulated.top3.length, 3);
    assert.ok(simulation.profileChanges.length === 2, "profile diff is wrong");
    assert.ok(simulation.impact.narrative.length > 20, "no narrative produced");

    const changed =
      simulation.impact.topPlanChanged ||
      simulation.impact.personaChanged ||
      simulation.impact.movements.some((m) => m.scoreDelta !== 0);

    assert.ok(changed, "a large usage change produced no effect at all");

    return simulation.impact.narrative;
  });

  await check("What-If from a stored customer", async () => {
    const customers = await store.find("customers", {}, { limit: 1 });
    const simulation = await whatIfService.simulate({
      customerId: customers[0]._id,
      changes: { budget: 1500 }
    });

    assert.strictEqual(simulation.simulated.ranked.length, 25);
    return `${customers[0]._id}: budget 1500 -> top pick ${simulation.simulated.top3[0].plan.planName}`;
  });

  // ---- summary --------------------------------------------------------
  console.log("");
  console.log("========================================");
  const passed = results.filter((r) => r.ok).length;
  console.log(`${passed}/${results.length} checks passed`);
  console.log("========================================");

  await store.disconnect();

  if (passed !== results.length) process.exit(1);
}

main().catch((error) => {
  console.error("FLOW TEST CRASHED:", error);
  process.exit(1);
});
