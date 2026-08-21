const env = require("./config/env");
const store = require("./db/store");
const { createApp } = require("./app");
const catalog = require("./services/catalogService");
const personaEngine = require("./ml/personaEngine");
const ragService = require("./services/ragService");

async function main() {
  // Fail fast and loudly if the Group 1/Group 2 artefacts are missing or
  // have drifted, rather than serving a half-broken catalogue.
  const plans = catalog.getPlans();
  const clusters = catalog.getClusters();
  const artifacts = personaEngine.loadArtifacts();
  const corpus = ragService.buildCorpus();

  if (plans.length !== 25) {
    throw new Error(`Expected 25 plans in the catalogue, found ${plans.length}.`);
  }

  await store.connect();

  const customerCount = await store.count("customers");

  if (customerCount === 0) {
    console.warn(
      "[startup] No customers in the database yet. Run: npm --prefix backend run seed"
    );
  }

  const app = createApp();

  app.listen(env.port, () => {
    console.log("========================================");
    console.log("  AI-POWERED TARIFF RECOMMENDATION API");
    console.log("========================================");
    console.log(`Listening       http://localhost:${env.port}/api`);
    console.log(`Database        ${store.status().driver} — ${store.status().detail}`);
    console.log(`Plans           ${plans.length}`);
    console.log(`Clusters        ${clusters.length} (${clusters.map((c) => c.personaName).join(" | ")})`);
    console.log(`Model           ${artifacts.algorithm}`);
    console.log(`Customers       ${customerCount}`);
    console.log(`Knowledge base  ${corpus.length} documents`);
    console.log(`Advisor LLM     ${env.llmEnabled ? env.chatModel : "not configured (grounded replies)"}`);
    console.log("========================================");
  });
}

main().catch((error) => {
  console.error("STARTUP FAILED:", error.message);
  process.exit(1);
});
