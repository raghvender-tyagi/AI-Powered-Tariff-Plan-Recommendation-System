const fs = require("fs");
const csv = require("csv-parser");

const env = require("../config/env");

/** Streams a CSV into an array of row objects. */
function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error(`Required data file missing: ${filePath}`));
      return;
    }

    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

const NUMERIC_FEATURES = [
  "age",
  "tenure_months",
  "monthly_data_gb",
  "avg_daily_data_gb",
  "streaming_hours",
  "hotspot_data_gb",
  "streaming_data_ratio",
  "hotspot_data_ratio",
  "monthly_voice_minutes",
  "total_calls",
  "incoming_calls",
  "outgoing_calls",
  "avg_minutes_per_call",
  "monthly_sms",
  "international_minutes",
  "roaming_voice_minutes",
  "roaming_data_gb",
  "international_voice_ratio",
  "roaming_voice_ratio",
  "roaming_data_ratio",
  "monthly_recharge",
  "total_usage_events",
  "calls_per_rupee",
  "data_per_rupee",
  "churn"
];

/**
 * Joins the Group 1 engineered features, the raw customer attributes and the
 * Group 2 K-Means labels into the customer documents the API serves.
 */
async function loadCustomers(limit = null) {
  const [features, clusters, cleaned] = await Promise.all([
    readCsv(env.paths.customerFeatures),
    readCsv(env.paths.customerClusters),
    readCsv(env.paths.cleanedTelecom)
  ]);

  const labelById = new Map(clusters.map((row) => [row.customer_id, Number(row.cluster)]));
  const attributesById = new Map(cleaned.map((row) => [row.customer_id, row]));

  const rows = limit ? features.slice(0, limit) : features;

  return rows.map((row) => {
    const attributes = attributesById.get(row.customer_id) || {};

    const numericFeatures = {};
    for (const key of NUMERIC_FEATURES) {
      if (row[key] !== undefined) numericFeatures[key] = Number(row[key]);
    }

    const clusterId = labelById.has(row.customer_id) ? labelById.get(row.customer_id) : null;

    return {
      _id: row.customer_id,
      customerId: row.customer_id,
      name: row.customer_id,
      age: Number(row.age),
      city: attributes.city || "",
      operator: attributes.operator || "",
      networkType: attributes.network_type || "",
      contractType: attributes.account_type || "",
      tenureMonths: Number(row.tenure_months),
      monthlySpend: Number(row.monthly_recharge),
      churn: Number(row.churn),
      clusterId,
      currentPlanId: null,
      features: numericFeatures,
      source: "dataset",
      createdAt: new Date().toISOString()
    };
  });
}

module.exports = { readCsv, loadCustomers, NUMERIC_FEATURES };
