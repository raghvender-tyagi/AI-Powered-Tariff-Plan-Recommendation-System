const env = require("../config/env");
const store = require("../db/store");
const catalog = require("../services/catalogService");
const ragService = require("../services/ragService");
const { loadCustomers } = require("./loadDataset");

/**
 * Seeds the database from the committed Group 1 / Group 2 artefacts.
 *
 * Plans and clusters are mirrored in full. Customers are seeded up to
 * SEED_CUSTOMER_LIMIT (default 1000 of the 10,000 rows) to keep the local
 * store small; pass --all to load every customer.
 */
async function seed({ all = false } = {}) {
  await store.connect();

  console.log("========================================");
  console.log("            DATABASE SEED");
  console.log("========================================");
  console.log("Driver:", store.status().driver);

  // ---- plans -------------------------------------------------------
  const plans = catalog.getPlans();

  if (plans.length !== 25) {
    throw new Error(`Expected 25 plans, found ${plans.length}.`);
  }

  const index = ragService.getIndex();

  const planDocs = plans.map((plan) => {
    const embedded = index.documents.find((doc) => doc.id === `plan:${plan._id}`);
    return { ...plan, embedding: embedded ? embedded.vector : [] };
  });

  await store.clear("plans");
  await store.insertMany("plans", planDocs);
  console.log(`Plans:      ${planDocs.length}`);

  // ---- clusters ----------------------------------------------------
  const clusters = catalog.getClusters();
  await store.clear("clusters");
  await store.insertMany("clusters", clusters);
  console.log(`Clusters:   ${clusters.length} (${clusters.map((c) => c.personaName).join(" | ")})`);

  // ---- customers ---------------------------------------------------
  const limit = all ? null : env.seedCustomerLimit;
  const customers = await loadCustomers(limit);

  const unlabelled = customers.filter((customer) => customer.clusterId === null).length;

  if (unlabelled > 0) {
    console.warn(`WARNING: ${unlabelled} seeded customers have no K-Means label.`);
  }

  await store.clear("customers");
  await store.insertMany("customers", customers);
  console.log(`Customers:  ${customers.length}${all ? " (full dataset)" : ` (limit ${limit})`}`);

  const perCluster = customers.reduce((acc, customer) => {
    acc[customer.clusterId] = (acc[customer.clusterId] || 0) + 1;
    return acc;
  }, {});

  console.log("Per cluster:", JSON.stringify(perCluster));
  console.log("Sample id:  ", customers[0]?._id);
  console.log("========================================");
  console.log("Seed complete.");

  await store.disconnect();
}

if (require.main === module) {
  seed({ all: process.argv.includes("--all") }).catch((error) => {
    console.error("SEED ERROR:", error.message);
    process.exit(1);
  });
}

module.exports = { seed };
