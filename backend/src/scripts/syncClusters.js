const env = require("../config/env");
const store = require("../db/store");
const { readCsv } = require("./loadDataset");

/**
 * Re-applies the batch K-Means labels from customer_clusters.csv onto the
 * stored customers. Used by the admin clustering job after a pipeline run.
 */
async function syncClusterLabels() {
  const rows = await readCsv(env.paths.customerClusters);
  const labelById = new Map(rows.map((row) => [row.customer_id, Number(row.cluster)]));

  const customers = await store.find("customers", { source: "dataset" }, { limit: 100000 });

  let updated = 0;

  for (const customer of customers) {
    const label = labelById.get(customer._id);

    if (label !== undefined && label !== customer.clusterId) {
      await store.updateById("customers", customer._id, { clusterId: label });
      updated += 1;
    }
  }

  return { customersChecked: customers.length, customersUpdated: updated };
}

module.exports = { syncClusterLabels };

if (require.main === module) {
  (async () => {
    await store.connect();
    const result = await syncClusterLabels();
    console.log("Cluster label sync:", result);
    await store.disconnect();
  })().catch((error) => {
    console.error("SYNC ERROR:", error.message);
    process.exit(1);
  });
}
