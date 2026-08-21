/**
 * buildModelArtifacts.js
 * ----------------------
 * Extracts the *already trained* Group 2 K-Means model into a portable
 * artifact so the backend can score a brand-new (unseen) customer without
 * re-running the whole clustering pipeline.
 *
 * Nothing here re-trains or re-labels anything:
 *   - normalization stats are recomputed with the exact same recipe used by
 *     prepareMLFeatures.js (1st/99th percentile clipping -> min-max), and are
 *     then VERIFIED row-by-row against the committed ml_features.csv;
 *   - centroids are the mean of the committed ml_features.csv rows grouped by
 *     the committed customer_clusters.csv labels, so they are exactly the
 *     centroids of the persisted K-Means solution (K = 2);
 *   - population statistics are used later only to impute the usage features a
 *     new user is never asked about; every imputed feature is reported back to
 *     the caller through the API.
 *
 * Output: data/processed/model_artifacts.json
 */

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const ROOT = path.resolve(__dirname, "../..");
const PROCESSED = path.join(ROOT, "data", "processed");

const CUSTOMER_FEATURES_PATH = path.join(PROCESSED, "customer_features.csv");
const ML_FEATURES_PATH = path.join(PROCESSED, "ml_features.csv");
const CLUSTERS_PATH = path.join(PROCESSED, "customer_clusters.csv");
const CLUSTER_PROFILES_PATH = path.join(PROCESSED, "cluster_profiles.json");
const OUTPUT_PATH = path.join(PROCESSED, "model_artifacts.json");

// Identical to prepareMLFeatures.js selectedFeatures (order matters).
const SELECTED_FEATURES = [
  "monthly_data_gb",
  "streaming_hours",
  "hotspot_data_gb",
  "monthly_voice_minutes",
  "avg_minutes_per_call",
  "monthly_sms",
  "international_minutes",
  "roaming_voice_minutes",
  "roaming_data_gb",
  "monthly_recharge",
  "tenure_months"
];

// Ratio features used to impute unknown usage from what the user does tell us.
const RATIO_FEATURES = [
  "streaming_data_ratio",
  "hotspot_data_ratio",
  "international_voice_ratio",
  "roaming_voice_ratio",
  "roaming_data_ratio"
];

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function percentile(sortedValues, p) {
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return (
    sortedValues[lower] +
    (sortedValues[upper] - sortedValues[lower]) * (index - lower)
  );
}

function describe(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    min: sorted[0],
    p10: percentile(sorted, 0.1),
    p25: percentile(sorted, 0.25),
    median: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
    p90: percentile(sorted, 0.9),
    max: sorted[sorted.length - 1],
    mean
  };
}

async function main() {
  const requiredInputs = [
    CUSTOMER_FEATURES_PATH,
    ML_FEATURES_PATH,
    CLUSTERS_PATH,
    CLUSTER_PROFILES_PATH
  ];

  for (const required of requiredInputs) {
    if (!fs.existsSync(required)) {
      throw new Error(`Required input missing: ${required}`);
    }
  }

  const featureRows = await readCsv(CUSTOMER_FEATURES_PATH);
  const mlRows = await readCsv(ML_FEATURES_PATH);
  const clusterRows = await readCsv(CLUSTERS_PATH);

  if (featureRows.length === 0) {
    throw new Error("customer_features.csv is empty.");
  }

  if (mlRows.length !== featureRows.length) {
    throw new Error(
      `Row mismatch: customer_features=${featureRows.length}, ml_features=${mlRows.length}`
    );
  }

  // -------------------------------------------------------------
  // 1. Normalization stats (same recipe as prepareMLFeatures.js)
  // -------------------------------------------------------------
  const normalization = {};

  for (const feature of SELECTED_FEATURES) {
    const values = featureRows.map((row) => Number(row[feature]));

    if (values.some((value) => !Number.isFinite(value))) {
      throw new Error(`Invalid numeric value found in ${feature}`);
    }

    const sorted = [...values].sort((a, b) => a - b);
    const clipLower = percentile(sorted, 0.01);
    const clipUpper = percentile(sorted, 0.99);

    const clipped = values.map((value) =>
      Math.min(Math.max(value, clipLower), clipUpper)
    );

    normalization[feature] = {
      clipLower,
      clipUpper,
      min: Math.min(...clipped),
      max: Math.max(...clipped)
    };
  }

  // -------------------------------------------------------------
  // 2. Verify the stats reproduce the committed ml_features.csv
  // -------------------------------------------------------------
  let maxDelta = 0;

  for (let i = 0; i < mlRows.length; i++) {
    for (const feature of SELECTED_FEATURES) {
      const raw = Number(featureRows[i][feature]);
      const stats = normalization[feature];
      const clipped = Math.min(Math.max(raw, stats.clipLower), stats.clipUpper);
      const scaled =
        stats.max === stats.min
          ? 0
          : (clipped - stats.min) / (stats.max - stats.min);
      const delta = Math.abs(scaled - Number(mlRows[i][feature]));
      if (delta > maxDelta) maxDelta = delta;
    }
  }

  // ml_features.csv stores values rounded to 6 decimals.
  const NORMALIZATION_TOLERANCE = 1e-6 + 1e-9;
  const normalizationVerified = maxDelta <= NORMALIZATION_TOLERANCE;

  if (!normalizationVerified) {
    throw new Error(
      `Normalization stats do not reproduce ml_features.csv (max delta ${maxDelta}).`
    );
  }

  // -------------------------------------------------------------
  // 3. Centroids of the persisted K-Means solution
  // -------------------------------------------------------------
  const labelById = new Map(
    clusterRows.map((row) => [row.customer_id, Number(row.cluster)])
  );

  const sums = {};
  const counts = {};

  for (const row of mlRows) {
    const label = labelById.get(row.customer_id);

    if (label === undefined) {
      throw new Error(`No cluster label for ${row.customer_id}`);
    }

    if (!sums[label]) {
      sums[label] = new Array(SELECTED_FEATURES.length).fill(0);
      counts[label] = 0;
    }

    SELECTED_FEATURES.forEach((feature, index) => {
      sums[label][index] += Number(row[feature]);
    });

    counts[label] += 1;
  }

  const centroids = {};

  for (const label of Object.keys(sums)) {
    centroids[label] = sums[label].map((total) => total / counts[label]);
  }

  // -------------------------------------------------------------
  // 4. Self-check: nearest-centroid assignment must reproduce the
  //    persisted labels for the overwhelming majority of customers.
  // -------------------------------------------------------------
  let agree = 0;

  for (const row of mlRows) {
    const vector = SELECTED_FEATURES.map((feature) => Number(row[feature]));

    let bestLabel = null;
    let bestDistance = Infinity;

    for (const label of Object.keys(centroids)) {
      const centroid = centroids[label];
      let sum = 0;

      for (let i = 0; i < vector.length; i++) {
        const diff = vector[i] - centroid[i];
        sum += diff * diff;
      }

      if (sum < bestDistance) {
        bestDistance = sum;
        bestLabel = Number(label);
      }
    }

    if (bestLabel === labelById.get(row.customer_id)) agree += 1;
  }

  const assignmentAgreement = agree / mlRows.length;

  // -------------------------------------------------------------
  // 5. Population statistics + ratios used for imputation
  // -------------------------------------------------------------
  const population = {};

  for (const feature of [...SELECTED_FEATURES, ...RATIO_FEATURES]) {
    const values = featureRows
      .map((row) => Number(row[feature]))
      .filter((value) => Number.isFinite(value));

    population[feature] = describe(values);
  }

  const clusterProfiles = JSON.parse(
    fs.readFileSync(CLUSTER_PROFILES_PATH, "utf8")
  );

  const artifacts = {
    generatedAt: new Date().toISOString(),
    source: {
      customerFeatures: path.basename(CUSTOMER_FEATURES_PATH),
      mlFeatures: path.basename(ML_FEATURES_PATH),
      clusterLabels: path.basename(CLUSTERS_PATH)
    },
    algorithm: "K-Means (k=2, kmeans++, seed 42) - persisted Group 2 solution",
    customers: mlRows.length,
    featureOrder: SELECTED_FEATURES,
    ratioFeatures: RATIO_FEATURES,
    preprocessing: {
      outlierTreatment: "1st-99th percentile clipping",
      scaling: "Min-Max to [0, 1]"
    },
    normalization,
    centroids,
    clusterCount: Object.keys(centroids).length,
    personas: Object.fromEntries(
      Object.entries(clusterProfiles.clusters).map(([id, cluster]) => [
        id,
        {
          clusterId: Number(id),
          persona: cluster.preliminaryPersona,
          customerCount: cluster.customerCount,
          customerPercentage: cluster.customerPercentage
        }
      ])
    ),
    population,
    validation: {
      normalizationVerified,
      maxNormalizationDelta: maxDelta,
      nearestCentroidAgreement: Number(assignmentAgreement.toFixed(6))
    }
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(artifacts, null, 2), "utf8");

  console.log("========================================");
  console.log("        MODEL ARTIFACT EXTRACTION");
  console.log("========================================");
  console.log("Customers:", mlRows.length);
  console.log("Features:", SELECTED_FEATURES.length);
  console.log("Clusters:", artifacts.clusterCount);
  console.log("Normalization reproduces ml_features.csv:", normalizationVerified);
  console.log("Max normalization delta:", maxDelta.toExponential(3));
  console.log(
    "Nearest-centroid agreement with persisted labels:",
    `${(assignmentAgreement * 100).toFixed(2)}%`
  );
  console.log("Output:", OUTPUT_PATH);
  console.log("========================================");

  if (assignmentAgreement < 0.99) {
    console.warn(
      "WARNING: nearest-centroid assignment disagrees with the persisted labels for more than 1% of customers."
    );
  }
}

main().catch((error) => {
  console.error("MODEL ARTIFACT ERROR:", error.message);
  process.exit(1);
});
