/**
 * HTTP-level test of every endpoint the React client calls, against a
 * running server. Start the API first, then: npm --prefix backend run test:api
 */

const assert = require("assert");

const BASE = process.env.API_BASE || "http://localhost:5000/api";

const results = [];
let adminToken = null;

async function api(method, path, body = null, token = null) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === null ? undefined : JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { status: response.status, body: payload };
}

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.error(`FAIL  ${name} — ${error.message}`);
  }
}

async function main() {
  console.log("========================================");
  console.log("            API ENDPOINT TESTS");
  console.log(`Base: ${BASE}`);
  console.log("========================================");

  let customerId = null;
  let sessionId = null;

  await check("GET /health", async () => {
    const { status, body } = await api("GET", "/health");
    assert.strictEqual(status, 200);
    assert.strictEqual(body.status, "ok");
    assert.strictEqual(body.catalogue.plans, 25);
    return `db=${body.database.driver}, plans=${body.catalogue.plans}`;
  });

  await check("GET /model", async () => {
    const { status, body } = await api("GET", "/model");
    assert.strictEqual(status, 200);
    assert.strictEqual(body.optimalK, 2);
    assert.ok(body.comparison.productionMethod === "K-Means");
    assert.ok(body.pca.totalExplainedVariance > 0);
    return `K=${body.optimalK}, silhouette=${body.bestSilhouetteScore}, PCA=${(body.pca.totalExplainedVariance * 100).toFixed(1)}%`;
  });

  await check("GET /plans returns all 25", async () => {
    const { status, body } = await api("GET", "/plans");
    assert.strictEqual(status, 200);
    assert.strictEqual(body.length, 25);
    assert.ok(body.every((plan) => plan.clusterId !== undefined));
    return `${body.length} plans`;
  });

  await check("GET /plans?category=FAMILY filters", async () => {
    const { body } = await api("GET", "/plans?category=FAMILY");
    assert.strictEqual(body.length, 5);
    return "5 FAMILY plans";
  });

  await check("GET /plans/:id", async () => {
    const { status, body } = await api("GET", "/plans/PRIME_3");
    assert.strictEqual(status, 200);
    assert.strictEqual(body.planName, "Prime 3");
    assert.ok(Array.isArray(body.related) && body.related.length > 0);
    return `${body.planName}, ${body.related.length} semantic neighbours`;
  });

  await check("GET /plans/search (embeddings)", async () => {
    const { status, body } = await api("GET", "/plans/search?q=family%20shared%20data%20plan");
    assert.strictEqual(status, 200);
    assert.ok(body.results.length > 0);
    assert.ok(body.results[0].planId.startsWith("FAMILY"));
    return `${body.results[0].planName} (${body.results[0].similarity})`;
  });

  await check("GET /clusters", async () => {
    const { status, body } = await api("GET", "/clusters");
    assert.strictEqual(status, 200);
    assert.strictEqual(body.length, 2);
    assert.ok(body.every((cluster) => cluster.personaName));
    return body.map((cluster) => cluster.personaName).join(" | ");
  });

  await check("GET /clusters/:id/customers", async () => {
    const { status, body } = await api("GET", "/clusters/0/customers?limit=5");
    assert.strictEqual(status, 200);
    assert.ok(body.length > 0);
    assert.ok(body.every((customer) => customer.clusterId === 0));
    return `${body.length} customers in cluster 0`;
  });

  await check("GET /customers + /customers/:id", async () => {
    const list = await api("GET", "/customers?limit=3");
    assert.strictEqual(list.status, 200);
    assert.ok(list.body.length > 0);

    customerId = list.body[0]._id;

    const { status, body } = await api("GET", `/customers/${customerId}`);
    assert.strictEqual(status, 200);
    assert.ok(body.usage.dataGB !== null);
    assert.ok(body.clusterId !== null);

    return `${customerId}: ${body.usage.dataGB}GB, cluster ${body.clusterId}`;
  });

  await check("GET /customers/:id/usage", async () => {
    const { status, body } = await api("GET", `/customers/${customerId}/usage`);
    assert.strictEqual(status, 200);
    assert.ok(Number.isFinite(body.monthlyRecharge));
    return `recharge Rs ${Math.round(body.monthlyRecharge)}`;
  });

  await check("GET /customers/:id 404s for unknown id", async () => {
    const { status } = await api("GET", "/customers/NOPE_12345");
    assert.strictEqual(status, 404);
    return "404";
  });

  await check("POST /recommendations/by-customer/:id (existing user)", async () => {
    const { status, body } = await api("POST", `/recommendations/by-customer/${customerId}`);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.plans.length, 3);
    assert.strictEqual(body.plansEvaluated, 25);
    assert.strictEqual(body.ranked.length, 25);
    assert.ok(body.plans[0].explanation.length > 40);
    assert.ok(body.plans[0].breakdown.usageFit !== undefined);
    return `${body.persona} -> ${body.plans.map((p) => `${p.plan.planName} ${p.matchPercent}%`).join(", ")}`;
  });

  await check("POST /recommendations/by-profile (new user)", async () => {
    const { status, body } = await api("POST", "/recommendations/by-profile", {
      profile: {
        dataNeed: "high",
        callingNeed: "low",
        budget: 700,
        roamingRequired: false,
        familyOrIndividual: "individual"
      }
    });

    assert.strictEqual(status, 200);
    assert.strictEqual(body.plans.length, 3);
    assert.ok(body.personaAssignment.imputedFeatures.length > 0);
    return `${body.persona} -> ${body.plans.map((p) => p.plan.planName).join(", ")}`;
  });

  await check("POST /recommendations/what-if", async () => {
    const { status, body } = await api("POST", "/recommendations/what-if", {
      customerId,
      changes: { dataNeedGB: 60, budget: 1200 }
    });

    assert.strictEqual(status, 200);
    assert.strictEqual(body.baseline.top3.length, 3);
    assert.strictEqual(body.simulated.top3.length, 3);
    assert.ok(body.impact.narrative.length > 20);
    return body.impact.narrative.slice(0, 110);
  });

  await check("POST /plans/compare", async () => {
    const { status, body } = await api("POST", "/plans/compare", {
      planIds: ["FLEX_3", "PLAY_2", "PRIME_1"],
      scores: { FLEX_3: 90, PLAY_2: 82, PRIME_1: 71 }
    });

    assert.strictEqual(status, 200);
    assert.strictEqual(body.plans.length, 3);
    assert.ok(body.verdicts.length >= 3);
    assert.strictEqual(body.verdicts.find((v) => v.key === "overall").planId, "FLEX_3");
    return `${body.rows.length} rows, ${body.verdicts.length} verdicts`;
  });

  await check("POST /plans/compare rejects a single plan", async () => {
    const { status } = await api("POST", "/plans/compare", { planIds: ["FLEX_1"] });
    assert.strictEqual(status, 400);
    return "400";
  });

  await check("GET /customers/:id/recommendations (history)", async () => {
    const { status, body } = await api("GET", `/customers/${customerId}/recommendations`);
    assert.strictEqual(status, 200);
    assert.ok(body.length > 0, "no history recorded");
    assert.strictEqual(body[0].recommendedPlans.length, 3);
    return `${body.length} entries`;
  });

  await check("POST /chat/start", async () => {
    const { status, body } = await api("POST", "/chat/start", { customerId: null });
    assert.strictEqual(status, 200);
    assert.ok(body.sessionId);
    sessionId = body.sessionId;
    return body.sessionId;
  });

  await check("POST /chat/message full slot-filling flow", async () => {
    const turns = [
      "I stream a lot of video every day",
      "I barely call anyone",
      "my budget is 600 rupees",
      "no I don't travel",
      "just me"
    ];

    let last = null;

    for (const turn of turns) {
      const { status, body } = await api("POST", "/chat/message", { sessionId, message: turn });
      assert.strictEqual(status, 200);
      last = body;
    }

    assert.ok(last.profileComplete, `incomplete: ${JSON.stringify(last.profile)}`);
    assert.strictEqual(last.plans.length, 3);
    return last.plans.map((entry) => entry.plan.planName).join(", ");
  });

  await check("POST /rag/ask", async () => {
    const { status, body } = await api("POST", "/rag/ask", {
      question: "Which clustering algorithm is used and why?"
    });

    assert.strictEqual(status, 200);
    assert.ok(body.sources.length > 0);
    assert.ok(/kmeans|k-means/i.test(body.answer));
    return `${body.sources.length} sources, grounded=${body.grounded}`;
  });

  await check("GET /rag/corpus", async () => {
    const { status, body } = await api("GET", "/rag/corpus");
    assert.strictEqual(status, 200);
    assert.ok(body.documents >= 25);
    return `${body.documents} docs, ${JSON.stringify(body.byType)}`;
  });

  await check("Admin routes reject anonymous requests", async () => {
    const { status } = await api("GET", "/admin/stats");
    assert.strictEqual(status, 401);
    return "401 without a token";
  });

  await check("POST /auth/login rejects bad credentials", async () => {
    const { status } = await api("POST", "/auth/login", {
      username: "admin",
      password: "definitely-wrong"
    });
    assert.strictEqual(status, 401);
    return "401";
  });

  await check("POST /auth/login issues a JWT", async () => {
    const { status, body } = await api("POST", "/auth/login", {
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "admin123"
    });

    assert.strictEqual(status, 200);
    assert.ok(body.token);
    adminToken = body.token;
    return "token issued";
  });

  await check("GET /admin/stats with JWT", async () => {
    const { status, body } = await api("GET", "/admin/stats", null, adminToken);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.totalPlans, 25);
    assert.strictEqual(body.totalClusters, 2);
    assert.ok(body.totalCustomers > 0);
    return `${body.totalCustomers} customers, ${body.recommendationsGenerated} recommendations, avg match ${body.avgMatchScore}%`;
  });

  await check("Admin clustering job runs and reports success", async () => {
    const started = await api("POST", "/admin/clusters/run", {}, adminToken);
    assert.strictEqual(started.status, 202);

    const jobId = started.body.jobId;
    let job = null;

    for (let attempt = 0; attempt < 40; attempt++) {
      const polled = await api("GET", `/admin/clusters/run/${jobId}`, null, adminToken);
      job = polled.body;
      if (job.status === "success" || job.status === "failed") break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    assert.strictEqual(job.status, "success", `job failed: ${job.error}`);
    return `job ${jobId} -> ${job.status}`;
  });

  await check("Unknown route returns JSON 404", async () => {
    const { status, body } = await api("GET", "/does-not-exist");
    assert.strictEqual(status, 404);
    assert.ok(body.error);
    return "404 JSON";
  });

  console.log("");
  console.log("========================================");
  const passed = results.filter((r) => r.ok).length;
  console.log(`${passed}/${results.length} endpoint checks passed`);
  console.log("========================================");

  if (passed !== results.length) process.exit(1);
}

main().catch((error) => {
  console.error("API TEST CRASHED:", error.message);
  process.exit(1);
});
