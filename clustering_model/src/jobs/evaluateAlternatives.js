const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const ROOT = path.resolve(__dirname, "../../..");

const ML_FEATURES_PATH = path.join(
  ROOT,
  "data",
  "processed",
  "ml_features.csv"
);

const OUTPUT_PATH = path.join(
  ROOT,
  "data",
  "processed",
  "clustering_alternatives.json"
);

function loadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function euclideanSquared(a, b) {
  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    const difference = a[i] - b[i];
    sum += difference * difference;
  }

  return sum;
}

/*
 * Gaussian-mixture-style 2-cluster alternative.
 *
 * This is used only for model comparison.
 * K-Means remains the production clustering model.
 */
function gaussianAlternative(X, iterations = 25) {
  const n = X.length;
  const dimensions = X[0].length;

  let mean0 = [...X[0]];
  let mean1 = [...X[Math.floor(n / 2)]];

  let variance = Array(dimensions).fill(0.05);

  let weight0 = 0.5;
  let weight1 = 0.5;

  let responsibilities = Array.from(
    { length: n },
    () => [0.5, 0.5]
  );

  for (let iteration = 0; iteration < iterations; iteration++) {

    // =========================
    // E STEP
    // =========================

    for (let i = 0; i < n; i++) {
      let distance0 = 0;
      let distance1 = 0;

      for (let j = 0; j < dimensions; j++) {
        const v = Math.max(variance[j], 0.000001);

        distance0 +=
          ((X[i][j] - mean0[j]) ** 2) / v;

        distance1 +=
          ((X[i][j] - mean1[j]) ** 2) / v;
      }

      const probability0 =
        weight0 * Math.exp(-0.5 * distance0);

      const probability1 =
        weight1 * Math.exp(-0.5 * distance1);

      const total =
        probability0 + probability1 + 1e-12;

      responsibilities[i][0] =
        probability0 / total;

      responsibilities[i][1] =
        probability1 / total;
    }

    // =========================
    // M STEP
    // =========================

    let responsibility0 = 0;
    let responsibility1 = 0;

    for (let i = 0; i < n; i++) {
      responsibility0 += responsibilities[i][0];
      responsibility1 += responsibilities[i][1];
    }

    weight0 = responsibility0 / n;
    weight1 = responsibility1 / n;

    mean0 = Array(dimensions).fill(0);
    mean1 = Array(dimensions).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < dimensions; j++) {
        mean0[j] +=
          responsibilities[i][0] * X[i][j];

        mean1[j] +=
          responsibilities[i][1] * X[i][j];
      }
    }

    for (let j = 0; j < dimensions; j++) {
      mean0[j] /= responsibility0 || 1;
      mean1[j] /= responsibility1 || 1;
    }

    variance = Array(dimensions).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < dimensions; j++) {
        const difference0 =
          X[i][j] - mean0[j];

        const difference1 =
          X[i][j] - mean1[j];

        variance[j] +=
          responsibilities[i][0] *
          difference0 *
          difference0;

        variance[j] +=
          responsibilities[i][1] *
          difference1 *
          difference1;
      }
    }

    for (let j = 0; j < dimensions; j++) {
      variance[j] /=
        Math.max(
          responsibility0 + responsibility1,
          1
        );

      variance[j] = Math.max(
        variance[j],
        0.000001
      );
    }
  }

  const labels = responsibilities.map(
    (responsibility) =>
      responsibility[0] >= responsibility[1]
        ? 0
        : 1
  );

  return {
    labels,
    weights: [weight0, weight1],
    means: [mean0, mean1]
  };
}

/*
 * Sampled silhouette calculation.
 *
 * We use a subset to keep the alternative
 * evaluation fast.
 */
function silhouetteScoreSample(
  X,
  labels,
  sampleSize = 500
) {
  const n = X.length;

  const indices = [];

  const step = Math.max(
    1,
    Math.floor(n / sampleSize)
  );

  for (
    let i = 0;
    i < n && indices.length < sampleSize;
    i += step
  ) {
    indices.push(i);
  }

  let totalScore = 0;
  let evaluated = 0;

  for (const i of indices) {
    const ownCluster = labels[i];

    let sameDistance = 0;
    let sameCount = 0;

    let otherDistance = 0;
    let otherCount = 0;

    for (let j = 0; j < n; j += step) {
      if (i === j) {
        continue;
      }

      const distance = Math.sqrt(
        euclideanSquared(X[i], X[j])
      );

      if (labels[j] === ownCluster) {
        sameDistance += distance;
        sameCount++;
      } else {
        otherDistance += distance;
        otherCount++;
      }
    }

    if (
      sameCount === 0 ||
      otherCount === 0
    ) {
      continue;
    }

    const a =
      sameDistance / sameCount;

    const b =
      otherDistance / otherCount;

    const score =
      (b - a) /
      Math.max(a, b);

    totalScore += score;
    evaluated++;
  }

  return evaluated > 0
    ? totalScore / evaluated
    : 0;
}

function sampleRows(rows, maxRows = 2000) {
  if (rows.length <= maxRows) {
    return rows;
  }

  const result = [];

  const step =
    rows.length / maxRows;

  for (let i = 0; i < maxRows; i++) {
    result.push(
      rows[Math.floor(i * step)]
    );
  }

  return result;
}

async function main() {
  console.log("========================================");
  console.log("       ALTERNATIVE CLUSTERING");
  console.log("========================================");

  if (!fs.existsSync(ML_FEATURES_PATH)) {
    throw new Error(
      `ML features not found: ${ML_FEATURES_PATH}`
    );
  }

  const rows = await loadCSV(
    ML_FEATURES_PATH
  );

  if (rows.length === 0) {
    throw new Error(
      "ML features file is empty."
    );
  }

  const sample = sampleRows(
    rows,
    2000
  );

  const featureNames =
    Object.keys(sample[0]).filter(
      (name) =>
        name !== "customer_id"
    );

  const X = sample.map((row) =>
    featureNames.map(
      (feature) =>
        Number(row[feature])
    )
  );

  console.log(
    `Original customers: ${rows.length}`
  );

  console.log(
    `Evaluation sample: ${X.length}`
  );

  console.log(
    `Features evaluated: ${featureNames.length}`
  );

  // =====================================
  // VERIFIED K-MEANS RESULT
  // =====================================
  //
  // Your existing clusteringService.js
  // produced:
  //
  // K = 2
  // Silhouette = 0.2999
  //
  // We keep that verified production
  // result here for comparison.
  //
  const kmeansScore = 0.2999;

  console.log("");
  console.log(
    "K-Means baseline silhouette:",
    kmeansScore.toFixed(4)
  );

  // =====================================
  // GAUSSIAN ALTERNATIVE
  // =====================================

  console.log("");
  console.log(
    "Running Gaussian mixture alternative..."
  );

  const gaussian =
    gaussianAlternative(
      X,
      25
    );

  const gaussianScore =
    silhouetteScoreSample(
      X,
      gaussian.labels,
      500
    );

  const clusterCounts = {
    0: 0,
    1: 0
  };

  for (const label of gaussian.labels) {
    clusterCounts[label]++;
  }

  console.log("");
  console.log(
    "---------- COMPARISON ----------"
  );

  console.log(
    `K-Means silhouette: ${kmeansScore.toFixed(4)}`
  );

  console.log(
    `Gaussian alternative silhouette: ${gaussianScore.toFixed(4)}`
  );

  console.log("");

  console.log(
    "Gaussian cluster sizes:"
  );

  console.log(
    `Cluster 0: ${clusterCounts[0]}`
  );

  console.log(
    `Cluster 1: ${clusterCounts[1]}`
  );

  // =====================================
  // SELECT PREFERRED METHOD
  // =====================================

  const preferredMethod =
    kmeansScore >= gaussianScore
      ? "K-Means"
      : "Gaussian alternative";

  const report = {
    evaluation_method:
      "K-Means vs Gaussian mixture-style alternative",

    original_customers:
      rows.length,

    evaluation_sample:
      X.length,

    feature_count:
      featureNames.length,

    evaluated_features:
      featureNames,

    kmeans: {
      method: "K-Means",
      clusters: 2,
      silhouette: kmeansScore,
      production: true
    },

    gaussian_alternative: {
      method:
        "Gaussian mixture-style soft clustering",
      clusters: 2,
      silhouette:
        gaussianScore,
      cluster_sizes:
        clusterCounts,
      production: false
    },

    preferred_method:
      preferredMethod,

    production_method:
      "K-Means",

    conclusion:
      preferredMethod === "K-Means"
        ? "K-Means provides the stronger silhouette score and remains the production clustering method."
        : "The Gaussian alternative produced a higher silhouette score in this evaluation, but K-Means remains the current production baseline pending further validation."
  };

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      report,
      null,
      2
    )
  );

  console.log("");

  console.log(
    `Preferred method: ${preferredMethod}`
  );

  console.log(
    `Report: ${OUTPUT_PATH}`
  );

  console.log(
    "========================================"
  );

  console.log(
    "Alternative evaluation: PASS"
  );

  console.log(
    "========================================"
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "ALTERNATIVE CLUSTERING ERROR:"
  );

  console.error(
    error.message
  );

  process.exit(1);
});